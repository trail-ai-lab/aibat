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


def generate_perturbations(uid: str, topic: str, test_ids: list):
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase dependencies not available")

    try:
        # Load tests for the topic
        topic_tests = get_tests_by_topic_fast(topic, uid)
        test_lookup = {test.id: test for test in topic_tests.tests}

        # Load user-specific criteria for the topic
        user_criteria_doc = _db.collection("users").document(uid).collection("topics").document(topic).collection("config").document("criteria").get()
        if user_criteria_doc.exists:
            criteria_data = user_criteria_doc.to_dict()
            criteria_types = criteria_data.get("types", [])
        else:
            # Fallback to AIBAT default criteria
            print(f"No user criteria found for topic '{topic}', using AIBAT fallback")
            criteria_types = [
                {
                    "name": name,
                    "prompt": get_criteria_prompt(name, for_generation=False),
                    "isDefault": True
                }
                for name in DEFAULT_CRITERIA_CONFIGS.get("AIBAT", [])
            ]

        # Get model pipeline
        pipeline = get_model_pipeline(uid)
        results = []

        for test_id in test_ids:
            if test_id not in test_lookup:
                continue
            test = test_lookup[test_id]
            original_text = test.statement

            for criteria in criteria_types:
                name = criteria["name"]
                prompt = criteria["prompt"]
                is_default = criteria.get("isDefault", False)

                try:
                    # Apply the perturbation
                    perturbed_text = pipeline.custom_perturb(f"{prompt}: {original_text}")

                    # Grade the perturbed statement
                    label_result = pipeline.grade(perturbed_text, test.topic)
                    ai_assessment = "pass" if label_result == "acceptable" else "fail"

                    # Determine expected label
                    expected_gt = test.ground_truth
                    if not is_default and should_flip_label(name):
                        expected_gt = "unacceptable" if test.ground_truth == "acceptable" else "acceptable"

                    # Validate based on expected and predicted
                    validity = "approved" if (
                        (ai_assessment == "pass" and expected_gt == "acceptable") or
                        (ai_assessment == "fail" and expected_gt == "unacceptable")
                    ) else "denied"

                    pert_id = uuid4().hex
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

                    _db.collection("users").document(uid).collection("perturbations").document(pert_id).set(perturbation)
                    log_action(uid, "generate_perturbation", perturbation)
                    results.append(perturbation)

                except Exception as e:
                    print(f"Error generating '{name}' perturbation for test '{test_id}': {e}")
                    continue

        return {"message": f"Generated {len(results)} perturbations", "perturbations": results}

    except Exception as e:
        raise Exception(f"Error generating perturbations: {str(e)}")
