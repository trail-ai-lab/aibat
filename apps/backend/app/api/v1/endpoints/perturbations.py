from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.core.firebase_auth import verify_firebase_token
from app.services import perturbations_service

router = APIRouter()

class GeneratePerturbationsInput(BaseModel):
    topic: str
    test_ids: List[str]
    batch_size: int = 10  # Default batch size for API calls

@router.post("/generate")
def generate_perturbations(body: GeneratePerturbationsInput, user=Depends(verify_firebase_token)):
    """
    Generate perturbations using user-defined criteria for a specific topic and list of test IDs.
    The backend fetches the user's criteria configuration for the topic and applies each selected type.
    """
    return perturbations_service.generate_perturbations(user["uid"], body.topic, body.test_ids, body.batch_size)

@router.get("/topic/{topic}")
def get_perturbations_by_topic(topic: str, user=Depends(verify_firebase_token)):
    """
    Fetch all perturbations for a specific topic.
    Returns all cached perturbations that were previously generated for the topic.
    """
    return perturbations_service.get_perturbations_by_topic(user["uid"], topic)