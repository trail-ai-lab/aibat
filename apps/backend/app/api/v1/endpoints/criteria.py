# app/api/v1/endpoints/criteria.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.core.firebase_auth import verify_firebase_token
from app.services import criteria_service

router = APIRouter()

class CriteriaType(BaseModel):
    name: str
    is_custom: bool
    is_default: bool

class CriteriaInfo(BaseModel):
    name: str
    prompt: str
    flip_label: bool

class AddCustomCriteriaInput(BaseModel):
    name: str
    prompt: str
    flip_label: bool
    topic: str

class EditCriteriaInput(BaseModel):
    name: str
    prompt: str
    flip_label: bool

class TestCriteriaPromptInput(BaseModel):
    prompt: str
    test_case: str

@router.get("/types")
def get_all_criteria_types(user=Depends(verify_firebase_token)):
    """Get all available criteria types (default + custom)"""
    return criteria_service.get_all_criteria_types(user["uid"])

@router.get("/type/{criteria_name}")
def get_criteria_info(criteria_name: str, user=Depends(verify_firebase_token)):
    """Get information about a specific criteria type"""
    return criteria_service.get_criteria_info(user["uid"], criteria_name)

@router.post("/add-type")
def add_custom_criteria(body: AddCustomCriteriaInput, user=Depends(verify_firebase_token)):
    """Add a new custom criteria type"""
    return criteria_service.add_custom_criteria(
        user["uid"],
        name=body.name,
        prompt=body.prompt,
        flip_label=body.flip_label,
        topic=body.topic
    )

@router.put("/edit-type")
def edit_criteria(body: EditCriteriaInput, user=Depends(verify_firebase_token)):
    """Edit an existing custom criteria type"""
    return criteria_service.edit_criteria(
        user["uid"],
        name=body.name,
        prompt=body.prompt,
        flip_label=body.flip_label
    )

@router.delete("/delete-type/{criteria_name}")
def delete_criteria(criteria_name: str, user=Depends(verify_firebase_token)):
    """Delete a custom criteria type"""
    return criteria_service.delete_criteria(user["uid"], criteria_name)

@router.post("/test-prompt")
def test_criteria_prompt(body: TestCriteriaPromptInput, user=Depends(verify_firebase_token)):
    """Test a criteria prompt on a sample text"""
    return criteria_service.test_criteria_prompt(user["uid"], body.prompt, body.test_case)

@router.get("/defaults/{config}")
def get_default_criteria(config: str):
    """Get default criteria types for a configuration"""
    return criteria_service.get_default_criteria(config)