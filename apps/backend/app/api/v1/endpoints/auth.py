from fastapi import APIRouter, Depends, Request
from app.core.firebase_auth import verify_firebase_token

router = APIRouter()

@router.get("/protected/")
def protected_route(user=Depends(verify_firebase_token)):
    return {"message": "Authenticated", "uid": user["uid"]}
