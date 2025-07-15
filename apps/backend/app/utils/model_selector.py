# app/utils/model_selector.py

from app.core.firebase_client import db
from app.core.model_registry import MODEL_REGISTRY

DEFAULT_MODEL = "groq-gemma2"


def get_model_pipeline(uid: str):
    user_config_ref = db.collection("users").document(uid).collection("config").document("model")
    doc = user_config_ref.get()

    model_id = DEFAULT_MODEL
    if doc.exists:
        data = doc.to_dict()
        model_id = data.get("id", DEFAULT_MODEL)

    if model_id not in MODEL_REGISTRY:
        print(f"Warning: Model '{model_id}' is not registered. Falling back to default model '{DEFAULT_MODEL}'.")
        # Update user's config to use the default model
        user_config_ref.set({"id": DEFAULT_MODEL})
        model_id = DEFAULT_MODEL

    return MODEL_REGISTRY[model_id]
