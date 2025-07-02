# app/api/v1/endpoints/topics.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from app.core.firebase_auth import verify_firebase_token
from app.services import topics_service

router = APIRouter()

class TopicTestInput(BaseModel):
    test: str
    ground_truth: str

class AddTopicInput(BaseModel):
    topic: str
    prompt_topic: str
    tests: List[TopicTestInput]

class DeleteTopicInput(BaseModel):
    topic: str

class TestPromptInput(BaseModel):
    prompt: str
    test: str

@router.post("/add/")
def add_topic(body: AddTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.add_topic(user["uid"], body)


@router.delete("/delete/")
def delete_topic(body: DeleteTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.delete_topic(user["uid"], body.topic)


@router.get("/")
def get_topics(user=Depends(verify_firebase_token)):
    return topics_service.get_topics(user["uid"])


@router.get("/{topic}/prompt")
def get_topic_prompt(topic: str, user=Depends(verify_firebase_token)):
    return topics_service.get_topic_prompt(user["uid"], topic)


@router.post("/test-prompt/")
def test_topic_prompt(body: TestPromptInput, user=Depends(verify_firebase_token)):
    return topics_service.test_prompt(user["uid"], body.prompt, body.test)
