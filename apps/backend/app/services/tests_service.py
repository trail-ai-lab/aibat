from app.core.firebase_client import db
from app.utils.model_selector import get_model_pipeline
from app.services.assessment_cache_service import cache_multiple_assessments
from datetime import datetime
from uuid import uuid4

def get_tests_by_topic(user_id: str, topic: str):
    ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic)
    docs = ref.stream()

    tests = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        tests.append(data)
    return {"topic": topic, "test_count": len(tests), "tests": tests}

# Add multiple test statements to an existing topic
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


# Delete multiple tests by ID
def delete_tests(user_id: str, test_ids: list[str]):
    ref = db.collection("users").document(user_id).collection("tests")
    for tid in test_ids:
        ref.document(tid).delete()
    return {"deleted_count": len(test_ids)}


# Grade multiple test statements by ID
def grade_tests(user_id: str, test_ids: list[str]):
    pipeline = get_model_pipeline(user_id)
    ref = db.collection("users").document(user_id).collection("tests")
    assessments = []

    for tid in test_ids:
        doc = ref.document(tid).get()
        if not doc.exists:
            continue
        data = doc.to_dict()
        title = data.get("title")
        topic = data.get("topic")
        ground_truth = data.get("ground_truth")

        label = pipeline.grade(title, topic)
        validity = "approved" if label == ground_truth else "denied"

        ref.document(tid).update({
            "label": label,
            "validity": validity,
            "graded_at": datetime.utcnow()
        })

        assessments.append({
            "test_id": tid,
            "statement": title,
            "ai_assessment": label
        })

    cache_multiple_assessments(user_id, topic, "groq-llama3", assessments)  # or get user's current model
    return {"graded_count": len(assessments), "results": assessments}


# Edit multiple tests (title, ground_truth)
def edit_tests(user_id: str, test_updates: list[dict]):
    ref = db.collection("users").document(user_id).collection("tests")
    updated = 0
    for update in test_updates:
        test_id = update["id"]
        new_data = {}
        if "title" in update: new_data["title"] = update["title"]
        if "ground_truth" in update: new_data["ground_truth"] = update["ground_truth"]
        if new_data:
            new_data["updated_at"] = datetime.utcnow()
            ref.document(test_id).update(new_data)
            updated += 1
    return {"updated_count": updated}


# Add a user assessment for a test (also calculates agreement)
def add_assessment(user_id: str, test_id: str, assessment: str):
    if assessment not in ["acceptable", "unacceptable"]:
        raise ValueError("Assessment must be acceptable or unacceptable")

    assessment_ref = db.collection("users").document(user_id).collection("assessments").document(test_id)
    assessment_ref.set({
        "test_id": test_id,
        "assessment": assessment,
        "updated_at": datetime.utcnow()
    })

    return {"message": "Assessment updated", "test_id": test_id, "assessment": assessment}


# Return all logs for the user
def get_logs(user_id: str):
    from app.utils.logs import log_test
    return log_test(user_id, get_only=True)
