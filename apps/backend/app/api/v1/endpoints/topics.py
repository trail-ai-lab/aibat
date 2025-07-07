# app/api/v1/endpoints/topics.py

from fastapi import APIRouter, Depends, HTTPException

from app.core.firebase_auth import verify_firebase_token
from app.models.schemas import AddTopicInput, EditTopicInput, TopicTestInput, DeleteTopicInput, TestPromptInput
from app.services import topics_service


router = APIRouter()

@router.get("")
def get_topics(user=Depends(verify_firebase_token)):
    return topics_service.get_topics(user["uid"])

@router.post("/add")
def add_topic(body: AddTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.add_topic(user["uid"], body)

@router.delete("/delete")
def delete_topic(body: DeleteTopicInput, user=Depends(verify_firebase_token)):
    return topics_service.delete_topic(user["uid"], body.topic)

@router.put("/edit")
def edit_topic_api(body: EditTopicInput, user=Depends(verify_firebase_token)):
    try:
        return topics_service.edit_topic(user["uid"], body.old_topic, body.new_topic, body.prompt)
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Edit topic failed: {traceback.format_exc()}"
        )

@router.post("/test-prompt")
def test_topic_prompt(body: TestPromptInput, user=Depends(verify_firebase_token)):
    return topics_service.test_prompt(user["uid"], body.prompt, body.test)


