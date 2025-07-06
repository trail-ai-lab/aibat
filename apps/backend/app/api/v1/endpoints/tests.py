from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List
from app.core.firebase_auth import verify_firebase_token
from app.services import tests_service
from app.models.schemas import (
    AddTestsRequest,
    DeleteTestsRequest,
    GradeTestsRequest,
    EditTestsRequest,
    AssessmentInput
)

router = APIRouter()

# Get tests by topic
@router.get("/topic/{topic}")
def get_tests_by_topic(topic: str, user=Depends(verify_firebase_token)):
    return tests_service.get_tests_by_topic(user["uid"], topic)


@router.post("/add")
def add_tests(payload: AddTestsRequest, user=Depends(verify_firebase_token)):
    return tests_service.add_tests(user["uid"], payload.topic, payload.tests)


@router.delete("/delete")
def delete_tests(payload: DeleteTestsRequest, user=Depends(verify_firebase_token)):
    return tests_service.delete_tests(user["uid"], payload.test_ids)


@router.post("/grade")
def grade_tests(payload: GradeTestsRequest, user=Depends(verify_firebase_token)):
    return tests_service.grade_tests(user["uid"], payload.test_ids)


@router.put("/edit")
def edit_tests(payload: EditTestsRequest, user=Depends(verify_firebase_token)):
    return tests_service.edit_tests(user["uid"], payload.tests)


@router.post("/assess")
def add_assessment(payload: AssessmentInput, user=Depends(verify_firebase_token)):
    try:
        return tests_service.add_assessment(user["uid"], payload.test_id, payload.assessment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logs")
def get_logs(user=Depends(verify_firebase_token)):
    return tests_service.get_logs(user["uid"])
