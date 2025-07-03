# app/services/tests_service.py

import os
import csv
from typing import List, Optional
from app.utils.logs import log_test
from app.models.schemas import TestSample, TestResponse, TopicTestsResponse

# Optional imports for Firebase-dependent functionality
FIREBASE_AVAILABLE = False
try:
    from app.utils.model_selector import get_model_pipeline
    from app.utils.user_session import get_user_session_data
    FIREBASE_AVAILABLE = True
except (ImportError, KeyError, Exception):
    # Firebase dependencies not available
    pass

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
    if not FIREBASE_AVAILABLE:
        # Return mock response when Firebase is not available
        return {"label": "pass"}
    
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

def get_tests_by_topic(topic: str) -> TopicTestsResponse:
    """
    Get all tests for a specific topic from CSV files
    """
    # Construct CSV file path
    csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic}.csv")
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file for topic '{topic}' not found")
    
    tests = []
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Skip empty rows
                if not row.get('input', '').strip():
                    continue
                
                # Calculate agreement between AI assessment and ground truth
                ground_truth = row.get('output', '').lower()
                ai_assessment = row.get('label', '').lower()
                
                # Agreement logic: pass means AI thinks it's acceptable, fail means unacceptable
                agreement = (
                    (ai_assessment == 'pass' and ground_truth == 'acceptable') or
                    (ai_assessment == 'fail' and ground_truth == 'unacceptable')
                )
                
                test_response = TestResponse(
                    id=row.get('', '') or f"{topic}_{len(tests)}",  # Use first column as ID or generate one
                    topic=topic,
                    statement=row.get('input', ''),
                    ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                    ai_assessment=ai_assessment if ai_assessment in ['pass', 'fail'] else 'pass',
                    agreement=agreement,
                    labeler=row.get('labeler', 'adatest_default'),
                    description=row.get('description', ''),
                    author=row.get('author', ''),
                    model_score=row.get('model score', '')
                )
                
                tests.append(test_response)
    
    except Exception as e:
        raise Exception(f"Error reading CSV file for topic '{topic}': {str(e)}")
    
    return TopicTestsResponse(
        topic=topic,
        total_tests=len(tests),
        tests=tests
    )

def get_available_topics() -> List[str]:
    """
    Get list of available topics based on CSV files in the data directory
    """
    data_dir = os.path.join(os.getcwd(), "data")
    topics = []
    
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename.startswith("NTX_") and filename.endswith(".csv"):
                # Extract topic name from filename (e.g., "NTX_CU0.csv" -> "CU0")
                topic = filename[4:-4]  # Remove "NTX_" prefix and ".csv" suffix
                topics.append(topic)
    
    return sorted(topics)
