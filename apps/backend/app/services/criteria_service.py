# app/services/criteria_service.py

from typing import List, Dict, Any
from app.core.firebase_client import db as _db
from datetime import datetime
from app.core.criteria_config import DEFAULT_CRITERIA_CONFIGS, PERTURBATION_PROMPTS

def get_all_default_criteria_configs() -> List[Dict[str, Any]]:
    """Returns all default config names (e.g., AIBAT, Mini-AIBAT) and their criteria with prompts"""
    results = []
    for config_name, types in DEFAULT_CRITERIA_CONFIGS.items():
        results.append({
            "config": config_name,
            "types": [
                {
                    "name": t,
                    "prompt": PERTURBATION_PROMPTS.get(t, "Prompt not defined")
                }
                for t in types
            ]
        })
    return results

def save_user_criteria(uid: str, topic: str, types: List[dict]):
    """
    Save user's selected criteria types for a topic in Firestore.
    """
    # Convert each Pydantic model to dict if it's not already a plain dict
    cleaned_types = [
        t.dict() if hasattr(t, "dict") else t
        for t in types
    ]

    criteria_data = {
        "types": cleaned_types,
        "updated_at": datetime.utcnow()
    }

    _db.collection("users").document(uid).collection("topics").document(topic).collection("config").document("criteria").set(criteria_data)
    return {"message": "Criteria saved successfully."}



def get_user_criteria(uid: str, topic: str):
    """
    Fetch user's criteria config for a topic.
    """
    doc_ref = _db.collection("users").document(uid).collection("topics").document(topic).collection("config").document("criteria")
    doc = doc_ref.get()

    if not doc.exists:
        return {"types": []}

    data = doc.to_dict()
    return {
        "types": data.get("types", [])
    }

