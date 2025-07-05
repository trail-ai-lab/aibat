from uuid import uuid4
from app.utils.logs import log_test

# Optional imports for Firebase-dependent functionality
FIREBASE_AVAILABLE = False
_db = None
get_model_pipeline = None
get_user_criteria = None
get_tests_by_topic_fast = None
DEFAULT_CRITERIA_CONFIGS = {}

try:
    from app.core.firebase_client import db as _db
    from app.utils.model_selector import get_model_pipeline
    from app.services.criteria_service import get_user_criteria
    from app.services.tests_service import get_tests_by_topic_fast
    from app.core.criteria_config import (
        DEFAULT_CRITERIA_CONFIGS,
        get_criteria_prompt,
        should_flip_label
    )
    FIREBASE_AVAILABLE = True
except ImportError:
    pass


def log_action(user_id: str, action: str, data: dict):
    log_entry = {
        "action": action,
        "data": data
    }
    log_test(user_id, log_entry)


def generate_perturbations(uid: str, topic: str, test_ids: list, batch_size: int = 5):
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase dependencies not available")

    try:
        # Load tests
        topic_tests = get_tests_by_topic_fast(topic, uid)
        test_lookup = {test.id: test for test in topic_tests.tests}

        # Load user-specific criteria
        user_criteria_doc = _db.collection("users").document(uid).collection("topics").document(topic).collection("config").document("criteria").get()
        if user_criteria_doc.exists:
            criteria_data = user_criteria_doc.to_dict()
            criteria_types = criteria_data.get("types", [])
        else:
            print(f"No user criteria found for topic '{topic}', using AIBAT fallback")
            criteria_types = [
                {
                    "name": name,
                    "prompt": get_criteria_prompt(name, for_generation=False),
                    "isDefault": True
                }
                for name in DEFAULT_CRITERIA_CONFIGS.get("AIBAT", [])
            ]

        pipeline = get_model_pipeline(uid)
        results = []

        # Build list of (test, criteria) pairs
        task_list = []
        for test_id in test_ids:
            if test_id not in test_lookup:
                continue
            test = test_lookup[test_id]
            for criteria in criteria_types:
                task_list.append((test, criteria))

        # Process in batches
        for i in range(0, len(task_list), batch_size):
            batch = task_list[i:i + batch_size]

            # 1. Generate perturbations
            pert_prompts = [f"{criteria['prompt']}: {test.statement}" for test, criteria in batch]
            perturbed_texts = [pipeline.custom_perturb(p) for p in pert_prompts]

            # 2. Grade perturbations
            graded_labels = [pipeline.grade(perturbed, topic) for perturbed in perturbed_texts]

            # 3. Record results
            for (test, criteria), perturbed_text, label_result in zip(batch, perturbed_texts, graded_labels):
                name = criteria["name"]
                is_default = criteria.get("isDefault", False)
                ai_assessment = "pass" if label_result == "acceptable" else "fail"

                # Use user's current assessment instead of original ground_truth
                # This is the key fix - use your_assessment from the test object
                user_assessment = test.your_assessment
                if user_assessment == "ungraded":
                    # If user hasn't assessed yet, fall back to original ground_truth
                    expected_gt = test.ground_truth
                else:
                    # Use user's assessment as the base for perturbation ground truth
                    expected_gt = user_assessment
                
                # Apply flip logic for criteria that change meaning (negation, antonyms)
                if should_flip_label(name):
                    expected_gt = "unacceptable" if expected_gt == "acceptable" else "acceptable"

                validity = "approved" if (
                    (ai_assessment == "pass" and expected_gt == "acceptable") or
                    (ai_assessment == "fail" and expected_gt == "unacceptable")
                ) else "denied"

                # Create a deterministic ID based on original_id and type to avoid duplicates
                # This ensures each test+criteria combination has only one perturbation
                pert_id = f"{test.id}_{name}".replace(" ", "_").replace("-", "_").lower()
                
                perturbation = {
                    "id": pert_id,
                    "original_id": test.id,
                    "title": perturbed_text,
                    "label": ai_assessment,
                    "type": name,
                    "topic": topic,
                    "ground_truth": expected_gt,
                    "validity": validity
                }

                # Use set() to upsert - this will overwrite if the document already exists
                _db.collection("users").document(uid).collection("perturbations").document(pert_id).set(perturbation)
                log_action(uid, "generate_perturbation", perturbation)
                results.append(perturbation)

        return {"message": f"Generated {len(results)} perturbations", "perturbations": results}

    except Exception as e:
        raise Exception(f"Error generating perturbations: {str(e)}")


def get_perturbations_by_topic(uid: str, topic: str):
    """
    Fetch all perturbations for a specific topic and user.
    Returns perturbations grouped by original test ID.
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase dependencies not available")

    try:
        # Query perturbations collection for the user and topic
        perturbations_ref = _db.collection("users").document(uid).collection("perturbations")
        query = perturbations_ref.where("topic", "==", topic)
        
        perturbations_docs = query.get()
        
        perturbations = []
        for doc in perturbations_docs:
            perturbation_data = doc.to_dict()
            perturbation_data["id"] = doc.id
            perturbations.append(perturbation_data)
        
        return {"perturbations": perturbations}
    
    except Exception as e:
        raise Exception(f"Error fetching perturbations: {str(e)}")
