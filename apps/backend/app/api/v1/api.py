from fastapi import APIRouter, Depends
from app.api.v1.endpoints import topics, auth, models
from app.core.firebase_auth import verify_firebase_token

api_router = APIRouter()

# Unprotected routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Protected routes
protected_router = APIRouter(dependencies=[Depends(verify_firebase_token)])
protected_router.include_router(topics.router, prefix="/topics", tags=["topics"])
protected_router.include_router(models.router, prefix="/models", tags=["models"])

api_router.include_router(protected_router)
