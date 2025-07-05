# app/api/v1/endpoints/perturbations.py

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Literal

from app.core.firebase_auth import verify_firebase_token
from app.services import perturbations_service

router = APIRouter()

class PerturbationInput(BaseModel):
    id: str
    title: str
    topic: str
    ground_truth: Literal["acceptable", "unacceptable"]

class EditPerturbationInput(BaseModel):
    id: str
    title: str
    topic: str

class ValidateInput(BaseModel):
    ids: List[str]
    validation: Literal["approved", "denied", "invalid"]

class CustomPerturbationInput(BaseModel):
    pert_name: str
    prompt: str
    flip_label: bool
    test_list: List[PerturbationInput]

class TestNewPertInput(BaseModel):
    test_case: str
    prompt: str

class GeneratePerturbationsInput(BaseModel):
    topic: str
    test_ids: List[str]

@router.post("/generate")
def generate_perturbations(body: GeneratePerturbationsInput, user=Depends(verify_firebase_token)):
    return perturbations_service.generate_perturbations_for_tests(user["uid"], body.topic, body.test_ids)

@router.get("/topic/{topic}")
def get_perturbations_by_topic(topic: str, user=Depends(verify_firebase_token)):
    return perturbations_service.get_perturbations_by_topic(user["uid"], topic)


@router.get("/")
def get_perturbations(user=Depends(verify_firebase_token)):
    return perturbations_service.get_perturbations(user["uid"])


@router.post("/edit/")
def edit_perturbation(body: EditPerturbationInput, user=Depends(verify_firebase_token)):
    return perturbations_service.edit_perturbation(user["uid"], body)


@router.post("/validate/")
def validate_perturbations(body: ValidateInput, user=Depends(verify_firebase_token)):
    return perturbations_service.validate_perturbations(user["uid"], body)


@router.delete("/delete-type/")
def delete_perturbation_type(pert_type: str, user=Depends(verify_firebase_token)):
    return perturbations_service.delete_perturbation_type(user["uid"], pert_type)


@router.post("/add-type/")
def add_custom_perturbation(body: CustomPerturbationInput, user=Depends(verify_firebase_token)):
    return perturbations_service.add_custom_perturbation_type(
        user["uid"],
        pert_name=body.pert_name,
        prompt=body.prompt,
        flip_label=body.flip_label,
        test_list=[t.dict() for t in body.test_list]
    )


@router.post("/test-type/")
def test_new_perturbation(body: TestNewPertInput, user=Depends(verify_firebase_token)):
    return perturbations_service.test_new_perturbation(user["uid"], body.prompt, body.test_case)


@router.get("/types/")
def get_all_perturbation_types(user=Depends(verify_firebase_token)):
    return perturbations_service.get_all_perturbation_types(user["uid"])


@router.get("/type/{pert_type}")
def get_perturbation_type(pert_type: str, user=Depends(verify_firebase_token)):
    return perturbations_service.get_perturbation_type(user["uid"], pert_type)


@router.get("/defaults/{config}")
def get_default_perturbations(config: str):
    return perturbations_service.get_default_perturbations(config)
