# app/api/v1/endpoints/logs.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.core.firebase_auth import verify_firebase_token
from app.services import logs_service

router = APIRouter()

class LogActionInput(BaseModel):
    test_ids: List[str]
    action: str

@router.post("/action/")
def log_action(body: LogActionInput, user=Depends(verify_firebase_token)):
    return logs_service.log_action(user["uid"], body)


@router.post("/save/{name}")
def save_log(name: str, user=Depends(verify_firebase_token)):
    return logs_service.save_log(user["uid"], name)


@router.delete("/clear/")
def clear_logs(user=Depends(verify_firebase_token)):
    return logs_service.clear_logs(user["uid"])
