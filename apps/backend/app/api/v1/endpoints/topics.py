# app/api/v1/endpoints/topics.py

from fastapi import APIRouter, Depends, HTTPException

from app.core.firebase_auth import verify_firebase_token
from app.models.schemas import AddTopicInput, TopicTestInput, DeleteTopicInput, TestPromptInput
from app.services import topics_service


router = APIRouter()

@router.post("/add")
def add_topic(body: AddTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.add_topic(user["uid"], body)


@router.delete("/delete")
def delete_topic(body: DeleteTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.delete_topic(user["uid"], body.topic)


@router.get("")
def get_topics(user=Depends(verify_firebase_token)):
    return topics_service.get_topics(user["uid"])


@router.post("/test-prompt")
def test_topic_prompt(body: TestPromptInput, user=Depends(verify_firebase_token)):
    return topics_service.test_prompt(user["uid"], body.prompt, body.test)

@router.post("/topics/generate-statements")
def generate_statements_for_topic(generation_data: dict, user=Depends(verify_firebase_token)):
    """
    Generate new statements for an existing topic using AI
    """
    try:
        return tests_service.generate_statements_for_topic(user["uid"], generation_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
