from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from app.core.firebase_auth import verify_firebase_token
from app.services import criteria_service

router = APIRouter()

# Existing default criteria route
@router.get("/defaults")
def get_all_default_criteria():
    return criteria_service.get_all_default_criteria_configs()

# User criteria model
class CriteriaTypeInput(BaseModel):
    name: str
    prompt: str
    isDefault: bool

class SaveUserCriteriaInput(BaseModel):
    topic: str
    types: List[CriteriaTypeInput]

@router.post("/user/save")
def save_user_criteria(body: SaveUserCriteriaInput, user=Depends(verify_firebase_token)):
    return criteria_service.save_user_criteria(user["uid"], body.topic, body.types)

@router.get("/user/{topic}")
def get_user_criteria(topic: str, user=Depends(verify_firebase_token)):
    return criteria_service.get_user_criteria(user["uid"], topic)
