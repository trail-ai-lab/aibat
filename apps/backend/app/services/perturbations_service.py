# app/services/perturbations_service.py

from app.utils.logs import log_action
from app.utils.model_selector import get_model_pipeline
from app.utils.user_session import get_user_session_data
from app.core.firebase_client import db as _db
from uuid import uuid4

# Store custom perturbation types in memory (can be moved to Firestore if needed)
custom_pert_types = {}

# Static default types for demo
DEFAULT_PERTURBATION_TYPES = {
    "AIBAT": ["spelling", "negation", "synonyms", "paraphrase", "acronyms", "antonyms", "spanish"],
    "Mini-AIBAT": ["spelling", "synonyms", "paraphrase", "acronyms", "spanish"],
    "M-AIBAT": ["spanish", "spanglish", "english", "nouns", "spelling", "cognates", "dialect", "loan_word"]
}

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
