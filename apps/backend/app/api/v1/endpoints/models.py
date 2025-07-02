# app/api/v1/endpoints/models.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.firebase_auth import verify_firebase_token
from app.core.model_registry import MODEL_METADATA
from app.core.firebase_client import db

router = APIRouter()

class ModelSelectInput(BaseModel):
    id: str

@router.get("/available")
def get_available_models():
    return MODEL_METADATA


@router.post("/select")
def select_model(body: ModelSelectInput, user=Depends(verify_firebase_token)):
    model_id = body.id
    if model_id not in [m["id"] for m in MODEL_METADATA]:
        raise HTTPException(status_code=400, detail="Invalid model ID")

    db.collection("users").document(user["uid"]).collection("config").document("model").set({
        "id": model_id
    })

    return {"message": f"Model '{model_id}' selected."}
