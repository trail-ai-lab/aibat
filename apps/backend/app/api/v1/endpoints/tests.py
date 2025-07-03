from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List
from app.core.firebase_auth import verify_firebase_token
from app.services import tests_service
from app.models.schemas import TopicTestsResponse

router = APIRouter()


class TestInput(BaseModel):
    title: str
    topic: str
    label: str


@router.get("/", response_model=List[dict])
def list_tests(user=Depends(verify_firebase_token)):
    return tests_service.get_all_tests(user["uid"])


@router.get("/topic/{topic_name}", response_model=TopicTestsResponse)
def get_tests_by_topic(topic_name: str, user=Depends(verify_firebase_token)):
    """
    Get all tests for a specific topic from CSV files
    """
    try:
        return tests_service.get_tests_by_topic(topic_name)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"No tests found for topic '{topic_name}'. Available topics: {tests_service.get_available_topics()}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics/available")
def get_available_topics(user=Depends(verify_firebase_token)):
    """
    Get list of available topics based on CSV files
    """
    return {"topics": tests_service.get_available_topics()}


@router.post("/add/")
def add_test(test: TestInput, user=Depends(verify_firebase_token)):
    success = tests_service.add_test(user["uid"], test)
    if not success:
        raise HTTPException(status_code=400, detail="Test already exists or error occurred")
    return {"status": "success"}


@router.post("/clear/")
def clear_tests(user=Depends(verify_firebase_token)):
    tests_service.clear_tests(user["uid"])
    return {"status": "cleared"}


@router.post("/grade/")
def grade_test(test: TestInput, user=Depends(verify_firebase_token)):
    result = tests_service.grade_test(user["uid"], test)
    return {"label": result}


@router.get("/log/")
def get_logs(user=Depends(verify_firebase_token)):
    logs = tests_service.get_logs(user["uid"])
    return {"logs": logs}
