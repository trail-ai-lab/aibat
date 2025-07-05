# app/services/perturbations_service.py

from app.utils.logs import log_test
from uuid import uuid4

# Optional imports for Firebase-dependent functionality
FIREBASE_AVAILABLE = False
_db = None
get_model_pipeline = None
get_user_session_data = None

try:
    from app.utils.model_selector import get_model_pipeline
    from app.utils.user_session import get_user_session_data
    from app.core.firebase_client import db as _db
    FIREBASE_AVAILABLE = True
except (ImportError, KeyError, Exception):
    # Firebase dependencies not available
    pass

def log_action(user_id: str, action: str, data: dict):
    """Simple logging function for perturbation actions"""
    log_entry = {
        "action": action,
        "data": data
    }
    log_test(user_id, log_entry)

# Store custom perturbation types in memory (can be moved to Firestore if needed)
custom_pert_types = {}

# Static default types for demo
DEFAULT_PERTURBATION_TYPES = {
    "AIBAT": ["spelling", "negation", "synonyms", "paraphrase", "acronyms", "antonyms", "spanish"],
    "Mini-AIBAT": ["spelling", "synonyms", "paraphrase", "acronyms", "spanish"],
    "M-AIBAT": ["spanish", "spanglish", "english", "nouns", "spelling", "cognates", "dialect", "loan_word"]
}

# Default perturbation types for the new implementation
DEFAULT_PERTURBATION_TYPES_NEW = ["spelling", "negation", "synonyms"]

def generate_perturbations(uid: str, topic: str, tests: list):
    pipeline = get_model_pipeline(uid)
    results = []

    for test in tests:
        original = test.title
        perturbed_text = pipeline.perturb(original)
        label = pipeline.grade(perturbed_text, topic)

        pert_id = uuid4().hex
        perturbation = {
            "id": pert_id,
            "original_id": test.id,
            "title": perturbed_text,
            "label": label,
            "topic": topic,
            "ground_truth": test.ground_truth,
            "validity": "approved" if label == test.ground_truth else "denied"
        }

        _db.collection("users").document(uid).collection("perturbations").document(pert_id).set(perturbation)
        log_action(uid, "generate_perturbation", perturbation)
        results.append(perturbation)

    return {"perturbations": results}


def get_perturbations(uid: str):
    docs = _db.collection("users").document(uid).collection("perturbations").stream()
    return [doc.to_dict() for doc in docs]


def edit_perturbation(uid: str, body):
    doc_ref = _db.collection("users").document(uid).collection("perturbations").document(body.id)
    doc = doc_ref.get()
    if not doc.exists:
        raise ValueError("Perturbation not found")

    updated = doc.to_dict()
    updated["title"] = body.title
    updated["label"] = get_model_pipeline(uid).grade(body.title, body.topic)
    updated["validity"] = "unapproved"

    doc_ref.set(updated)
    log_action(uid, "edit_perturbation", updated)
    return updated


def validate_perturbations(uid: str, body):
    updated = []
    for pert_id in body.ids:
        doc_ref = _db.collection("users").document(uid).collection("perturbations").document(pert_id)
        doc = doc_ref.get()
        if not doc.exists:
            continue

        pert = doc.to_dict()
        if body.validation == "approved":
            pert["ground_truth"] = pert["label"]
        elif body.validation == "denied":
            pert["ground_truth"] = "acceptable" if pert["label"] == "unacceptable" else "unacceptable"

        pert["validity"] = body.validation
        doc_ref.set(pert)
        log_action(uid, "validate_perturbation", pert)
        updated.append(pert)

    return {"validated": updated}


def delete_perturbation_type(uid: str, pert_type: str):
    col_ref = _db.collection("users").document(uid).collection("perturbations")
    docs = col_ref.where("type", "==", pert_type).stream()
    for doc in docs:
        doc.reference.delete()
        log_action(uid, "delete_perturbation", doc.to_dict())

    return {"deleted_type": pert_type}


def add_custom_perturbation_type(uid: str, pert_name: str, prompt: str, flip_label: bool, test_list: list):
    if pert_name in custom_pert_types.get(uid, {}):
        raise ValueError("Perturbation type already exists")

    # Store prompt and label rule
    if uid not in custom_pert_types:
        custom_pert_types[uid] = {}
    custom_pert_types[uid][pert_name] = {"prompt": prompt, "flip_label": flip_label}

    pipeline = get_model_pipeline(uid)
    results = []

    for test in test_list:
        perturbed_text = pipeline.custom_perturb(f"{prompt}: {test['title']}")
        label = pipeline.grade(perturbed_text, test['topic'])
        gt = "acceptable" if flip_label ^ (test['ground_truth'] == "acceptable") else "unacceptable"
        validity = "approved" if flip_label ^ (test['ground_truth'] == label) else "denied"

        pert_id = uuid4().hex
        pert = {
            "id": pert_id,
            "original_id": test["id"],
            "title": perturbed_text,
            "label": label,
            "type": pert_name,
            "prompt": prompt,
            "topic": test["topic"],
            "ground_truth": gt,
            "validity": validity
        }

        _db.collection("users").document(uid).collection("perturbations").document(pert_id).set(pert)
        log_action(uid, "add_custom_perturbation", pert)
        results.append(pert)

    return {"custom_type": pert_name, "perturbations": results}


def test_new_perturbation(uid: str, prompt: str, test_case: str):
    pipeline = get_model_pipeline(uid)
    perturbed_text = pipeline.custom_perturb(f"{prompt}: {test_case}")
    return {"perturbed": perturbed_text}


def get_all_perturbation_types(uid: str):
    user_types = list(custom_pert_types.get(uid, {}).keys())
    return {"custom_types": user_types}


def get_perturbation_type(uid: str, pert_type: str):
    user_map = custom_pert_types.get(uid, {})
    if pert_type not in user_map:
        raise ValueError("Perturbation type not found")
    return user_map[pert_type]


def get_default_perturbations(config: str):
    if config not in DEFAULT_PERTURBATION_TYPES:
        raise ValueError("Invalid configuration")
    return {"default_types": DEFAULT_PERTURBATION_TYPES[config]}


def generate_perturbations_for_tests(uid: str, topic: str, test_ids: list):
    """
    Generate perturbations for specific test IDs using default perturbation types
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        from app.services.tests_service import get_tests_by_topic_fast
        
        # Get the tests for this topic
        topic_tests = get_tests_by_topic_fast(topic, uid)
        test_lookup = {test.id: test for test in topic_tests.tests}
        
        # Get topic prompt for grading
        topic_prompt = None
        try:
            from app.services.views_service import DEFAULT_TOPICS
            topic_prompt = DEFAULT_TOPICS.get(topic)
        except ImportError:
            # Fallback prompts for built-in topics
            fallback_prompts = {
                "CU0": "Does the following contain the physics concept: Greater height means greater energy? Here is the sentence:",
                "CU5": "The sentence is acceptable if it contains the physics concept: The more mass, the more energy. If not, it is unacceptable. Here is the sentence:",
                "Food": "Does this sentence include a description of food and/or culture? Here is the sentence:",
                "Car": "Does this sentence describe or mention cars, automobiles, or automotive concepts? Here is the sentence:"
            }
            topic_prompt = fallback_prompts.get(topic)
        
        if not topic_prompt:
            raise Exception(f"No prompt found for topic '{topic}'")
        
        # Get model pipeline
        pipeline = get_model_pipeline(uid)
        
        results = []
        
        # Generate perturbations for each test ID
        for test_id in test_ids:
            if test_id not in test_lookup:
                continue
                
            test = test_lookup[test_id]
            original_statement = test.statement
            
            # Generate perturbations using default types
            for pert_type in DEFAULT_PERTURBATION_TYPES_NEW:
                try:
                    # Generate perturbed text based on type using the custom_perturb method
                    perturbation_prompts = {
                        "spelling": "Introduce minor spelling errors or typos in this text while keeping the meaning clear",
                        "negation": "Add negation words (like 'not', 'never', 'no') to change the meaning of this text",
                        "synonyms": "Replace key words with synonyms in this text while maintaining the same meaning"
                    }
                    
                    prompt = perturbation_prompts.get(pert_type, f"Apply {pert_type} perturbation to this text")
                    perturbed_text = pipeline.custom_perturb(f"{prompt}: {original_statement}")
                    
                    # Grade the perturbed text
                    label_result = pipeline.grade(perturbed_text, topic_prompt)
                    ai_assessment = "pass" if label_result == "acceptable" else "fail"
                    
                    # Determine expected ground truth based on perturbation type
                    if pert_type in ["negation", "antonyms"]:
                        # These should flip the label
                        expected_gt = "unacceptable" if test.ground_truth == "acceptable" else "acceptable"
                    else:
                        # These should preserve the label
                        expected_gt = test.ground_truth
                    
                    # Determine validity
                    validity = "approved" if (
                        (ai_assessment == "pass" and expected_gt == "acceptable") or
                        (ai_assessment == "fail" and expected_gt == "unacceptable")
                    ) else "denied"
                    
                    pert_id = uuid4().hex
                    perturbation = {
                        "id": pert_id,
                        "original_id": test_id,
                        "title": perturbed_text,
                        "label": ai_assessment,
                        "type": pert_type,
                        "topic": topic,
                        "ground_truth": expected_gt,
                        "validity": validity
                    }
                    
                    # Store in Firestore
                    _db.collection("users").document(uid).collection("perturbations").document(pert_id).set(perturbation)
                    log_action(uid, "generate_perturbation", perturbation)
                    results.append(perturbation)
                    
                except Exception as e:
                    print(f"Error generating {pert_type} perturbation for test {test_id}: {e}")
                    continue
        
        return {"message": f"Generated {len(results)} perturbations", "perturbations": results}
        
    except Exception as e:
        raise Exception(f"Error generating perturbations: {str(e)}")


def get_perturbations_by_topic(uid: str, topic: str):
    """
    Get all perturbations for a specific topic
    """
    try:
        docs = _db.collection("users").document(uid).collection("perturbations").where("topic", "==", topic).stream()
        perturbations = []
        for doc in docs:
            data = doc.to_dict()
            perturbations.append(data)
        return perturbations
    except Exception as e:
        raise Exception(f"Error fetching perturbations for topic: {str(e)}")
