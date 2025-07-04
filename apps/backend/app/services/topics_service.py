# app/services/topics_service.py

import os
import csv
from datetime import datetime
from app.core.firebase_client import db as _db
from uuid import uuid4
from app.utils.model_selector import get_model_pipeline


def add_topic(uid: str, body):
    topic = body.topic
    prompt = body.prompt_topic
    tests = body.tests

    # Save prompt in Firestore
    _db.collection("users").document(uid).collection("topics").document(topic).set({
        "prompt": prompt,
        "created_at": datetime.utcnow()
    })

    # Write CSV to local disk
    csv_dir = os.path.join(os.getcwd(), "data")
    os.makedirs(csv_dir, exist_ok=True)
    csv_path = os.path.join(csv_dir, f"{uid}_{topic}.csv")

    with open(csv_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['id', 'topic', 'input', 'output', 'label', 'labeler', 'description', 'author', 'model score'])
        for test in tests:
            writer.writerow([
                uuid4().hex,
                topic,
                test.test,
                test.ground_truth,
                'pass',
                'adatest_default',
                '', '', ''
            ])

    return {"message": "Topic added successfully!"}

def delete_topic(uid: str, topic: str):
    _db.collection("users").document(uid).collection("topics").document(topic).delete()
    _db.collection("users").document(uid).collection("tests").where("topic", "==", topic).get()
    _db.collection("users").document(uid).collection("perturbations").where("topic", "==", topic).get()
    return {"message": "Topic deleted successfully!"}

def get_topics(uid: str):
    docs = _db.collection("users").document(uid).collection("topics").stream()
    return [doc.id for doc in docs]

def get_topic_prompt(uid: str, topic: str):
    doc = _db.collection("users").document(uid).collection("topics").document(topic).get()
    if doc.exists:
        return doc.to_dict()["prompt"]
    return None

def test_prompt(uid: str, prompt: str, test: str):
    pipeline = get_model_pipeline(uid)
    return pipeline.grade_with_prompt(prompt, test)
