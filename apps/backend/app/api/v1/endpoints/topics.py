# app/api/v1/endpoints/topics.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_topics():
    return {"topics": ["CU0", "CU5"]}
