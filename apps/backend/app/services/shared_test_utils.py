# app/services/shared_test_utils.py

from uuid import uuid4
from datetime import datetime
from app.core.firebase_client import db

def add_tests(user_id: str, topic: str, tests: list[dict]):
    ref = db.collection("users").document(user_id).collection("tests")
    added_ids = []

    for test in tests:
        if not test.get("title"): continue
        doc_id = uuid4().hex
        ref.document(doc_id).set({
            "id": doc_id,
            "topic": topic,
            "title": test["title"],
            "ground_truth": test.get("ground_truth", "ungraded"),
            "label": "ungraded",
            "validity": "ungraded",
            "created_at": datetime.utcnow()
        })
        added_ids.append(doc_id)

    return {"added_count": len(added_ids), "test_ids": added_ids}
