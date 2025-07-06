# app/api/v1/endpoints/models.py

from app.models.schemas import ModelSelectInput
from fastapi import APIRouter, Depends
from app.core.firebase_auth import verify_firebase_token
from app.services import models_service

router = APIRouter()

@router.get("/available")
def get_available_models():
    return models_service.get_available_models()

@router.get("/current")
def get_current_model(user=Depends(verify_firebase_token)):
    return models_service.get_current_model(user["uid"])

@router.post("/select")
def select_model(body: ModelSelectInput, user=Depends(verify_firebase_token)):
    return models_service.select_model(user["uid"], body.id)
