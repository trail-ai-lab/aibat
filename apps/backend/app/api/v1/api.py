from fastapi import APIRouter, Depends
from app.api.v1.endpoints import topics, auth
from app.core.firebase_auth import verify_firebase_token

api_router = APIRouter()

# Unprotected
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Protected
protected_router = APIRouter(dependencies=[Depends(verify_firebase_token)])
protected_router.include_router(topics.router, prefix="/topics", tags=["topics"])

api_router.include_router(protected_router)
