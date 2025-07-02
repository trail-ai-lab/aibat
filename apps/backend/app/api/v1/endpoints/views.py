# app/api/v1/endpoints/views.py

from fastapi import APIRouter, Depends
from app.core.firebase_auth import verify_firebase_token
from app.services import views_service

router = APIRouter()

@router.post("/init/")
def initialize_user_data(user=Depends(verify_firebase_token)):
    return views_service.init_user_data(user["uid"])


@router.get("/check/")
def check_user_initialized(user=Depends(verify_firebase_token)):
    return views_service.check_user_initialized(user["uid"])
