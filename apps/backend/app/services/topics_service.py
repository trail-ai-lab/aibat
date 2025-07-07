# app/services/topics_service.py

from typing import List
from datetime import datetime
from app.core.firebase_client import db as _db
from uuid import uuid4
from app.utils.model_selector import get_model_pipeline
from app.api.v1.endpoints.topics import TopicTestInput
from app.services.tests_service import add_tests


def add_topic(uid: str, body):
    topic = body.topic
    prompt = body.prompt_topic
    tests = body.tests
    is_default = body.default

    # Save topic metadata in Firestore
    _db.collection("users").document(uid).collection("topics").document(topic).set({
        "name": topic,
        "prompt": prompt,
        "default": is_default,
        "created_at": datetime.utcnow()
    })


    # Use shared logic to add test statements
    test_payload = [{"title": t.test, "ground_truth": t.ground_truth} for t in tests]
    add_tests(uid, topic, test_payload)


    return {"message": "Topic and tests added successfully!"}

def delete_topic(uid: str, topic: str):
    # Delete the topic
    _db.collection("users").document(uid).collection("topics").document(topic).delete()

    # Delete related tests
    tests = _db.collection("users").document(uid).collection("tests").where("topic", "==", topic).stream()
    for doc in tests:
        doc.reference.delete()

    # Delete related perturbations
    perturbations = _db.collection("users").document(uid).collection("perturbations").where("topic", "==", topic).stream()
    for doc in perturbations:
        doc.reference.delete()

    return {"message": "Topic and associated data deleted successfully!"}


def get_topics(uid: str):
    docs = _db.collection("users").document(uid).collection("topics").stream()
    return [
        {
            "name": doc.id,
            **doc.to_dict()
        }
        for doc in docs
    ]

def edit_topic(uid: str, old_topic: str, new_topic: str, new_prompt: str):
    user_ref = _db.collection("users").document(uid)

    old_topic_ref = user_ref.collection("topics").document(old_topic)
    old_doc = old_topic_ref.get()

    if not old_doc.exists:
        raise Exception(f"Topic '{old_topic}' not found")

    data = old_doc.to_dict()
    data["prompt"] = new_prompt
    data["updated_at"] = datetime.utcnow()
    data["name"] = new_topic

    # If name hasn't changed, just update the prompt
    if old_topic == new_topic:
        old_topic_ref.update({"prompt": new_prompt, "updated_at": datetime.utcnow()})
        return {"message": f"Updated prompt for topic '{old_topic}'"}

    # Rename logic: create new doc, move references, delete old
    new_topic_ref = user_ref.collection("topics").document(new_topic)
    new_topic_ref.set(data)

    # Copy tests
    tests = user_ref.collection("tests").where("topic", "==", old_topic).stream()
    for doc in tests:
        test_data = doc.to_dict()
        test_data["topic"] = new_topic
        user_ref.collection("tests").document(doc.id).set(test_data)

    # Copy perturbations
    perturbations = user_ref.collection("perturbations").where("topic", "==", old_topic).stream()
    for doc in perturbations:
        pert_data = doc.to_dict()
        pert_data["topic"] = new_topic
        user_ref.collection("perturbations").document(doc.id).set(pert_data)

    # Delete old topic
    old_topic_ref.delete()

    return {"message": f"Renamed topic from '{old_topic}' to '{new_topic}' and updated prompt."}


def test_prompt(uid: str, prompt: str, test: str):
    pipeline = get_model_pipeline(uid)
    return pipeline.grade_with_prompt(prompt, test)


