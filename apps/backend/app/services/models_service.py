# app/services/models_service.py

from fastapi import HTTPException
from app.core.firebase_client import db
from app.core.model_registry import (
    MODEL_METADATA,
    MODEL_REGISTRY,
    get_model_metadata_by_id,
    get_default_model_metadata
)
from app.core.model_config import DEFAULT_MODEL_ID

def get_available_models():
    return MODEL_METADATA

def get_current_model(uid: str):
    user_config_ref = db.collection("users").document(uid).collection("config").document("model")
    doc = user_config_ref.get()

    if doc.exists:
        model_id = doc.to_dict().get("id", DEFAULT_MODEL_ID)
    else:
        model_id = DEFAULT_MODEL_ID

    return get_model_metadata_by_id(model_id) or get_default_model_metadata()

def select_model(uid: str, model_id: str):
    if model_id not in MODEL_REGISTRY:
        raise HTTPException(status_code=400, detail="Invalid model ID")

    db.collection("users").document(uid).collection("config").document("model").set({
        "id": model_id
    })

    return {"message": f"Model '{model_id}' selected."}
