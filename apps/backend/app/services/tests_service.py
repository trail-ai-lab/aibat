# app/services/tests_service.py

import os
import csv
from typing import List, Optional, Dict
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

def get_tests_by_topic(topic: str, user_id: str = None) -> TopicTestsResponse:
    """
    Get all tests for a specific topic from CSV files or Firestore
    """
    # Check if this is a built-in topic (has a prompt in DEFAULT_TOPICS)
    try:
        from app.services.views_service import DEFAULT_TOPICS
        is_builtin_topic = topic in DEFAULT_TOPICS
    except ImportError:
        is_builtin_topic = topic in ["CU0", "CU5", "Food"]
    
    if is_builtin_topic:
        # For built-in topics, always use CSV files
        csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic}.csv")
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file for built-in topic '{topic}' not found")
    else:
        # For user-created topics, get from Firestore
        if user_id and FIREBASE_AVAILABLE:
            try:
                from app.core.firebase_client import db
                
                # Check if this is a user-created topic
                topic_doc = db.collection("users").document(user_id).collection("topics").document(topic).get()
                if topic_doc.exists:
                    # Get tests from Firestore
                    tests_ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic)
                    test_docs = tests_ref.stream()
                    
                    tests = []
                    for doc in test_docs:
                        data = doc.to_dict()
                        
                        # Calculate agreement between AI assessment and ground truth
                        ground_truth = data.get('ground_truth', 'acceptable').lower()
                        ai_assessment = data.get('ai_assessment', 'pass').lower()
                        
                        agreement = (
                            (ai_assessment == 'pass' and ground_truth == 'acceptable') or
                            (ai_assessment == 'fail' and ground_truth == 'unacceptable')
                        )
                        
                        test_response = TestResponse(
                            id=doc.id,
                            topic=topic,
                            statement=data.get('statement', ''),
                            ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                            ai_assessment=ai_assessment if ai_assessment in ['pass', 'fail'] else 'pass',
                            agreement=agreement,
                            labeler=data.get('labeler', 'user'),
                            description=data.get('description', ''),
                            author=data.get('author', ''),
                            model_score=data.get('model_score', '')
                        )
                        tests.append(test_response)
                    
                    return TopicTestsResponse(
                        topic=topic,
                        total_tests=len(tests),
                        tests=tests
                    )
            except Exception as e:
                print(f"Error fetching from Firestore: {e}")
        
        raise FileNotFoundError(f"User-created topic '{topic}' not found in Firestore")
    
    # Process CSV file for built-in topics
    csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic}.csv")
    
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

def get_available_topics(user_id: str = None) -> Dict[str, List[str]]:
    """
    Get list of available topics from both DEFAULT_TOPICS and Firestore
    Returns dict with 'builtin' and 'user_created' topic lists
    """
    builtin_topics = []
    user_created_topics = []
    
    # Get built-in topics from DEFAULT_TOPICS (only topics with prompts)
    try:
        from app.services.views_service import DEFAULT_TOPICS
        builtin_topics = list(DEFAULT_TOPICS.keys())
    except ImportError:
        # Fallback to hardcoded list if import fails
        builtin_topics = ["CU0", "CU5", "Food"]
    
    # Get user-created topics from Firestore
    if user_id and FIREBASE_AVAILABLE:
        try:
            from app.core.firebase_client import db
            topics_ref = db.collection("users").document(user_id).collection("topics")
            topic_docs = topics_ref.stream()
            
            for doc in topic_docs:
                topic_name = doc.id
                # Only include user-created topics (not the default ones)
                if topic_name not in builtin_topics:
                    user_created_topics.append(topic_name)
        except Exception as e:
            print(f"Error fetching user topics from Firestore: {e}")
    
    return {
        "builtin": sorted(builtin_topics),
        "user_created": sorted(user_created_topics)
    }

def create_topic(user_id: str, topic_data: dict) -> dict:
    """
    Create a new topic with tests in Firestore
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        from datetime import datetime
        
        topic_name = topic_data["topic"]
        prompt = topic_data["prompt_topic"]
        tests = topic_data["tests"]
        
        # Save topic metadata in Firestore
        topic_ref = db.collection("users").document(user_id).collection("topics").document(topic_name)
        topic_ref.set({
            "prompt": prompt,
            "created_at": datetime.utcnow(),
            "test_count": len(tests)
        })
        
        # Save tests in Firestore
        tests_ref = db.collection("users").document(user_id).collection("tests")
        
        for test in tests:
            test_doc = tests_ref.document()  # Auto-generate ID
            test_doc.set({
                "topic": topic_name,
                "statement": test["test"],
                "ground_truth": test["ground_truth"],
                "ai_assessment": "pass",  # Default, will be updated when AI processes it
                "labeler": "user",
                "description": "",
                "author": user_id,
                "model_score": "",
                "created_at": datetime.utcnow()
            })
        
        return {"message": "Topic created successfully", "topic": topic_name}
        
    except Exception as e:
        raise Exception(f"Error creating topic: {str(e)}")
