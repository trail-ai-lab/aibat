from fastapi import APIRouter, Depends
from app.api.v1.endpoints import topics, auth, models, onboard, tests, perturbations, criteria
from app.core.firebase_auth import verify_firebase_token

api_router = APIRouter()

# Unprotected routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Protected routes
protected_router = APIRouter(dependencies=[Depends(verify_firebase_token)])
protected_router.include_router(topics.router, prefix="/topics", tags=["topics"])
protected_router.include_router(models.router, prefix="/models", tags=["models"])
protected_router.include_router(onboard.router, prefix="/onboard", tags=["onboard"])
protected_router.include_router(tests.router, prefix="/tests", tags=["tests"])
protected_router.include_router(perturbations.router, prefix="/perturbations", tags=["perturbations"])
protected_router.include_router(criteria.router, prefix="/criteria", tags=["criteria"])

api_router.include_router(protected_router)
