# app/services/tests_service.py

from app.utils.logs import log_test
from app.utils.model_selector import get_model_pipeline
from app.utils.user_session import get_user_session_data
from app.models.schemas import TestSample

# In-memory test data store per user (can later move to DB)
user_tests = {}

def get_all_tests(user_id: str):
    return user_tests.get(user_id, [])

def add_test(user_id: str, sample: TestSample):
    if user_id not in user_tests:
        user_tests[user_id] = []
    user_tests[user_id].append(sample)

def clear_tests(user_id: str):
    user_tests[user_id] = []

def grade_test(user_id: str, sample: TestSample):
    session_data = get_user_session_data(user_id)
    model_name = session_data.get("model", "mock")
    pipeline = get_model_pipeline(model_name)

    grade = pipeline.grade(sample.input)
    sample.label = grade

    # Store and log
    add_test(user_id, sample)
    log_test(user_id, sample.dict())

    return {"label": grade}

def get_logs(user_id: str):
    return log_test(user_id, get_only=True)
