from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List
from app.core.firebase_auth import verify_firebase_token
from app.services import tests_service

router = APIRouter()


class TestInput(BaseModel):
    title: str
    topic: str
    label: str


@router.get("/", response_model=List[dict])
def list_tests(user=Depends(verify_firebase_token)):
    return tests_service.get_all_tests(user["uid"])


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
