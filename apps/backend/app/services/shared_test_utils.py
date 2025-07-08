# app/services/shared_test_utils.py

from uuid import uuid4
from datetime import datetime
from app.core.firebase_client import db

def add_tests(user_id: str, topic: str, tests):
    ref = db.collection("users").document(user_id).collection("tests")
    added_ids = []

    for test in tests:
        # Handle both Pydantic objects (with .title attribute) and dictionaries (with ["title"] key)
        if hasattr(test, 'title'):
            # Pydantic object from tests endpoint
            title = test.title
            ground_truth = test.ground_truth if test.ground_truth else "ungraded"
        else:
            # Dictionary object from topics service
            title = test.get("title")
            ground_truth = test.get("ground_truth", "ungraded")
        
        if not title or not title.strip():
            continue
            
        doc_id = uuid4().hex
        ref.document(doc_id).set({
            "id": doc_id,
            "topic": topic,
            "title": title,
            "ground_truth": ground_truth,
            "label": "ungraded",
            "validity": "ungraded",
            "created_at": datetime.utcnow()
        })
        added_ids.append(doc_id)

    return {"added_count": len(added_ids), "test_ids": added_ids}
