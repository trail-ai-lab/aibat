from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.core.firebase_auth import verify_firebase_token
from app.services import perturbations_service

router = APIRouter()

class GeneratePerturbationsInput(BaseModel):
    topic: str
    test_ids: List[str]

@router.post("/generate")
def generate_perturbations(body: GeneratePerturbationsInput, user=Depends(verify_firebase_token)):
    """
    Generate perturbations using user-defined criteria for a specific topic and list of test IDs.
    The backend fetches the user's criteria configuration for the topic and applies each selected type.
    """
    return perturbations_service.generate_perturbations(user["uid"], body.topic, body.test_ids)