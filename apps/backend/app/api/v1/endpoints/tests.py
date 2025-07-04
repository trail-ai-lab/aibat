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
    Get all tests for a specific topic from CSV files or Firestore
    """
    try:
        return tests_service.get_tests_by_topic(topic_name, user["uid"])
    except FileNotFoundError:
        available_topics = tests_service.get_available_topics(user["uid"])
        all_topics = available_topics["builtin"] + available_topics["user_created"]
        raise HTTPException(
            status_code=404,
            detail=f"No tests found for topic '{topic_name}'. Available topics: {all_topics}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topic/{topic_name}/fast", response_model=TopicTestsResponse)
def get_tests_by_topic_fast(topic_name: str, user=Depends(verify_firebase_token)):
    """
    Get all tests for a specific topic quickly without AI grading
    Returns tests with 'grading' status for AI assessment
    """
    try:
        return tests_service.get_tests_by_topic_fast(topic_name, user["uid"])
    except FileNotFoundError:
        available_topics = tests_service.get_available_topics(user["uid"])
        all_topics = available_topics["builtin"] + available_topics["user_created"]
        raise HTTPException(
            status_code=404,
            detail=f"No tests found for topic '{topic_name}'. Available topics: {all_topics}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics/available")
def get_available_topics(user=Depends(verify_firebase_token)):
    """
    Get list of available topics from both CSV files and Firestore
    """
    return tests_service.get_available_topics(user["uid"])


@router.post("/topics/create")
def create_topic(topic_data: dict, user=Depends(verify_firebase_token)):
    """
    Create a new topic with tests in Firestore
    """
    try:
        return tests_service.create_topic(user["uid"], topic_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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




@router.post("/grade/{topic_name}/{test_id}")
def grade_single_test(
    topic_name: str,
    test_id: str,
    user=Depends(verify_firebase_token)
):
    """
    Grade a single test statement and return the AI assessment
    """
    try:
        result = tests_service.grade_single_test(topic_name, test_id, user["uid"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/assessment/{test_id}/optimized")
def update_test_assessment_optimized(
    test_id: str,
    assessment_data: dict,
    user=Depends(verify_firebase_token)
):
    """
    Update the assessment for a specific test with optimized agreement calculation
    """
    try:
        return tests_service.update_test_assessment_with_agreement(user["uid"], test_id, assessment_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/log/")
def get_logs(user=Depends(verify_firebase_token)):
    logs = tests_service.get_logs(user["uid"])
    return {"logs": logs}


@router.put("/assessment/{test_id}")
def update_test_assessment(
    test_id: str,
    assessment_data: dict,
    user=Depends(verify_firebase_token)
):
    """
    Update the assessment for a specific test
    """
    try:
        return tests_service.update_test_assessment(user["uid"], test_id, assessment_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
