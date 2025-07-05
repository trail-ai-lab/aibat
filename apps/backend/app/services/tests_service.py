# app/services/tests_service.py

import os
import csv
from datetime import datetime
from typing import List, Optional, Dict
from app.utils.logs import log_test
from app.models.schemas import TestSample, TestResponse, TopicTestsResponse
from app.services.assessment_cache_service import (
    get_cached_assessments_for_topic,
    cache_multiple_assessments,
    get_cached_assessment
)

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

def get_tests_by_topic_fast(topic: str, user_id: str = None) -> TopicTestsResponse:
    """
    Get all tests for a specific topic quickly without AI grading
    Returns tests with 'grading' status for AI assessment
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
                        statement = data.get('statement', '')
                        ground_truth = data.get('ground_truth', 'acceptable').lower()
                        
                        # Use stored AI assessment or default to grading
                        ai_assessment_raw = data.get('ai_assessment', 'grading')
                        if isinstance(ai_assessment_raw, str):
                            ai_assessment_raw = ai_assessment_raw.lower()
                        if ai_assessment_raw not in ['pass', 'fail', 'grading']:
                            ai_assessment_raw = "grading"
                        
                        # Agreement logic: only calculate if both AI and user assessments are available
                        # For user-created topics, compare AI assessment with user's ground truth
                        agreement = None
                        user_assessment = ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable'
                        if ai_assessment_raw in ['pass', 'fail'] and user_assessment in ['acceptable', 'unacceptable']:
                            agreement = (
                                (ai_assessment_raw == 'pass' and user_assessment == 'acceptable') or
                                (ai_assessment_raw == 'fail' and user_assessment == 'unacceptable')
                            )
                        
                        test_response = TestResponse(
                            id=doc.id,
                            topic=topic,
                            statement=statement,
                            ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                            your_assessment=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',  # For user-created topics, use their ground truth as their assessment
                            ai_assessment=ai_assessment_raw,
                            agreement=agreement,
                            labeler=data.get('labeler', 'user'),
                            description=data.get('description', ''),
                            author=data.get('author', ''),
                            model_score=data.get('model_score', ''),
                            is_builtin=False
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
    
    # Process CSV file for built-in topics - FAST VERSION
    csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic}.csv")
    
    # Get user assessment overrides if available
    user_assessments = {}
    if user_id and FIREBASE_AVAILABLE:
        try:
            from app.core.firebase_client import db
            assessments_ref = db.collection("users").document(user_id).collection("assessments")
            assessment_docs = assessments_ref.stream()
            
            for doc in assessment_docs:
                data = doc.to_dict()
                user_assessments[data.get('test_id')] = data.get('assessment', 'ungraded')
        except Exception as e:
            print(f"Error fetching user assessments: {e}")
    
    tests = []
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Skip empty rows
                if not row.get('input', '').strip():
                    continue
                
                test_id = row.get('', '') or f"{topic}_{len(tests)}"
                statement = row.get('input', '')
                ground_truth = row.get('output', '').lower()
                
                # Set AI assessment to "grading" initially - no actual grading here
                ai_assessment_raw = "grading"
                
                # Check if user has overridden the assessment
                your_assessment = user_assessments.get(test_id, "ungraded")
                
                # Agreement is None since AI assessment is still grading
                agreement = None
                
                test_response = TestResponse(
                    id=test_id,
                    topic=topic,
                    statement=statement,
                    ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                    your_assessment=your_assessment,
                    ai_assessment=ai_assessment_raw,
                    agreement=agreement,
                    labeler=row.get('labeler', 'adatest_default'),
                    description=row.get('description', ''),
                    author=row.get('author', ''),
                    model_score=row.get('model score', ''),
                    is_builtin=True
                )
                
                tests.append(test_response)
    
    except Exception as e:
        raise Exception(f"Error reading CSV file for topic '{topic}': {str(e)}")
    
    return TopicTestsResponse(
        topic=topic,
        total_tests=len(tests),
        tests=tests
    )

def get_tests_by_topic(topic: str, user_id: str = None) -> TopicTestsResponse:
    """
    Get all tests for a specific topic from CSV files or Firestore
    WITH CACHING - checks cache first, then performs AI grading if needed
    """
    # Check if this is a built-in topic (has a prompt in DEFAULT_TOPICS)
    try:
        from app.services.views_service import DEFAULT_TOPICS
        is_builtin_topic = topic in DEFAULT_TOPICS
    except ImportError:
        is_builtin_topic = topic in ["CU0", "CU5", "Food"]
    
    # Get current model ID for caching
    current_model_id = "groq-llama3"  # Default
    if user_id and FIREBASE_AVAILABLE:
        try:
            from app.core.firebase_client import db
            user_config_ref = db.collection("users").document(user_id).collection("config").document("model")
            doc = user_config_ref.get()
            if doc.exists:
                data = doc.to_dict()
                current_model_id = data.get("id", "groq-llama3")
        except Exception as e:
            print(f"Error getting current model: {e}")
    
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
                    topic_data = topic_doc.to_dict()
                    topic_prompt = topic_data.get('prompt', '')
                    
                    # Get cached assessments for this topic and model
                    cached_assessments = get_cached_assessments_for_topic(user_id, topic, current_model_id)
                    
                    # Get the model pipeline for grading
                    model_pipeline = None
                    try:
                        model_pipeline = get_model_pipeline(user_id)
                    except Exception as e:
                        print(f"Error getting model pipeline: {e}")
                    
                    # Get tests from Firestore
                    tests_ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic)
                    test_docs = tests_ref.stream()
                    
                    tests = []
                    assessments_to_cache = []
                    
                    for doc in test_docs:
                        data = doc.to_dict()
                        statement = data.get('statement', '')
                        ground_truth = data.get('ground_truth', 'acceptable').lower()
                        test_id = doc.id
                        
                        # Check cache first
                        ai_assessment_raw = cached_assessments.get(test_id)
                        
                        if ai_assessment_raw:
                            # Use cached assessment
                            print(f"Using cached assessment for test {test_id}: {ai_assessment_raw}")
                        else:
                            # Generate AI assessment using the actual model pipeline
                            ai_assessment_raw = "grading"  # Default to grading status
                            if model_pipeline and topic_prompt:
                                try:
                                    # Call the actual grading function
                                    grade_result = model_pipeline.grade(statement, topic_prompt)
                                    # Convert acceptable/unacceptable to pass/fail, handle unknown
                                    if grade_result == "acceptable":
                                        ai_assessment_raw = "pass"
                                    elif grade_result == "unacceptable":
                                        ai_assessment_raw = "fail"
                                    else:  # unknown or any other response
                                        ai_assessment_raw = "grading"
                                    
                                    # Add to cache list
                                    assessments_to_cache.append({
                                        "test_id": test_id,
                                        "statement": statement,
                                        "ai_assessment": ai_assessment_raw
                                    })
                                    print(f"Generated new assessment for test {test_id}: {ai_assessment_raw}")
                                except Exception as e:
                                    print(f"Error grading statement: {e}")
                                    # Use stored data as fallback
                                    ai_assessment_raw = data.get('ai_assessment', 'pass').lower()
                                    if ai_assessment_raw not in ['pass', 'fail']:
                                        ai_assessment_raw = "grading"
                            else:
                                # Use stored data as fallback
                                ai_assessment_raw = data.get('ai_assessment', 'pass').lower()
                                if ai_assessment_raw not in ['pass', 'fail']:
                                    ai_assessment_raw = "grading"
                        
                        # Agreement logic: only calculate if both AI and user assessments are available
                        # For user-created topics, compare AI assessment with user's ground truth
                        agreement = None
                        user_assessment = ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable'
                        if ai_assessment_raw in ['pass', 'fail'] and user_assessment in ['acceptable', 'unacceptable']:
                            agreement = (
                                (ai_assessment_raw == 'pass' and user_assessment == 'acceptable') or
                                (ai_assessment_raw == 'fail' and user_assessment == 'unacceptable')
                            )
                        
                        test_response = TestResponse(
                            id=test_id,
                            topic=topic,
                            statement=statement,
                            ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                            your_assessment=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',  # For user-created topics, use their ground truth as their assessment
                            ai_assessment=ai_assessment_raw if ai_assessment_raw in ['pass', 'fail', 'grading'] else 'grading',
                            agreement=agreement,
                            labeler=data.get('labeler', 'user'),
                            description=data.get('description', ''),
                            author=data.get('author', ''),
                            model_score=data.get('model_score', ''),
                            is_builtin=False
                        )
                        tests.append(test_response)
                    
                    # Cache new assessments
                    if assessments_to_cache:
                        cached_count = cache_multiple_assessments(user_id, topic, current_model_id, assessments_to_cache)
                        print(f"Cached {cached_count} new assessments for topic {topic} with model {current_model_id}")
                    
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
    
    # Get cached assessments for this topic and model
    cached_assessments = {}
    if user_id:
        cached_assessments = get_cached_assessments_for_topic(user_id, topic, current_model_id)
    
    # Get user assessment overrides if available
    user_assessments = {}
    if user_id and FIREBASE_AVAILABLE:
        try:
            from app.core.firebase_client import db
            assessments_ref = db.collection("users").document(user_id).collection("assessments")
            assessment_docs = assessments_ref.stream()
            
            for doc in assessment_docs:
                data = doc.to_dict()
                user_assessments[data.get('test_id')] = data.get('assessment', 'ungraded')
        except Exception as e:
            print(f"Error fetching user assessments: {e}")
    
    # Get the topic prompt for grading
    topic_prompt = None
    try:
        from app.services.views_service import DEFAULT_TOPICS
        topic_prompt = DEFAULT_TOPICS.get(topic)
    except ImportError:
        pass
    
    # Get the model pipeline for grading
    model_pipeline = None
    if user_id and FIREBASE_AVAILABLE:
        try:
            model_pipeline = get_model_pipeline(user_id)
        except Exception as e:
            print(f"Error getting model pipeline: {e}")
    
    tests = []
    assessments_to_cache = []
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Skip empty rows
                if not row.get('input', '').strip():
                    continue
                
                test_id = row.get('', '') or f"{topic}_{len(tests)}"
                statement = row.get('input', '')
                ground_truth = row.get('output', '').lower()
                
                # Check cache first
                ai_assessment_raw = cached_assessments.get(test_id)
                
                if ai_assessment_raw:
                    # Use cached assessment
                    print(f"Using cached assessment for test {test_id}: {ai_assessment_raw}")
                else:
                    # Generate AI assessment using the actual model pipeline
                    ai_assessment_raw = "grading"  # Default to grading status
                    if model_pipeline and topic_prompt:
                        try:
                            # Call the actual grading function
                            grade_result = model_pipeline.grade(statement, topic_prompt)
                            # Convert acceptable/unacceptable to pass/fail, handle unknown
                            if grade_result == "acceptable":
                                ai_assessment_raw = "pass"
                            elif grade_result == "unacceptable":
                                ai_assessment_raw = "fail"
                            else:  # unknown or any other response
                                ai_assessment_raw = "grading"
                            
                            # Add to cache list
                            assessments_to_cache.append({
                                "test_id": test_id,
                                "statement": statement,
                                "ai_assessment": ai_assessment_raw
                            })
                            print(f"Generated new assessment for test {test_id}: {ai_assessment_raw}")
                        except Exception as e:
                            print(f"Error grading statement: {e}")
                            # Use the original CSV data as fallback
                            ai_assessment_raw = row.get('label', 'pass').lower()
                            if ai_assessment_raw not in ['pass', 'fail']:
                                ai_assessment_raw = "grading"
                    else:
                        # Use the original CSV data as fallback
                        ai_assessment_raw = row.get('label', 'pass').lower()
                        if ai_assessment_raw not in ['pass', 'fail']:
                            ai_assessment_raw = "grading"
                
                # Check if user has overridden the assessment
                your_assessment = user_assessments.get(test_id, "ungraded")
                
                # Agreement logic: only calculate if both AI assessment and user assessment are available
                # User assessment should not be "ungraded" for agreement calculation
                agreement = None
                if ai_assessment_raw in ['pass', 'fail'] and your_assessment in ['acceptable', 'unacceptable']:
                    agreement = (
                        (ai_assessment_raw == 'pass' and your_assessment == 'acceptable') or
                        (ai_assessment_raw == 'fail' and your_assessment == 'unacceptable')
                    )
                
                test_response = TestResponse(
                    id=test_id,
                    topic=topic,
                    statement=statement,
                    ground_truth=ground_truth if ground_truth in ['acceptable', 'unacceptable'] else 'acceptable',
                    your_assessment=your_assessment,  # Use user override or default to ungraded
                    ai_assessment=ai_assessment_raw if ai_assessment_raw in ['pass', 'fail', 'grading'] else 'grading',
                    agreement=agreement,
                    labeler=row.get('labeler', 'adatest_default'),
                    description=row.get('description', ''),
                    author=row.get('author', ''),
                    model_score=row.get('model score', ''),
                    is_builtin=True
                )
                
                tests.append(test_response)
    
    except Exception as e:
        raise Exception(f"Error reading CSV file for topic '{topic}': {str(e)}")
    
    # Cache new assessments
    if assessments_to_cache and user_id:
        cached_count = cache_multiple_assessments(user_id, topic, current_model_id, assessments_to_cache)
        print(f"Cached {cached_count} new assessments for topic {topic} with model {current_model_id}")
    
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
    Create a new topic with tests in Firestore and cache AI assessments
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        from datetime import datetime
        
        topic_name = topic_data["topic"]
        prompt = topic_data["prompt_topic"]
        tests = topic_data["tests"]
        
        # Get current model ID for caching
        current_model_id = "groq-llama3"  # Default
        try:
            user_config_ref = db.collection("users").document(user_id).collection("config").document("model")
            doc = user_config_ref.get()
            if doc.exists:
                data = doc.to_dict()
                current_model_id = data.get("id", "groq-llama3")
        except Exception as e:
            print(f"Error getting current model: {e}")
        
        # Save topic metadata in Firestore
        topic_ref = db.collection("users").document(user_id).collection("topics").document(topic_name)
        topic_ref.set({
            "prompt": prompt,
            "created_at": datetime.utcnow(),
            "test_count": len(tests)
        })
        
        # Get the model pipeline for grading
        model_pipeline = None
        try:
            model_pipeline = get_model_pipeline(user_id)
        except Exception as e:
            print(f"Error getting model pipeline: {e}")
        
        # Save tests in Firestore and prepare for caching
        tests_ref = db.collection("users").document(user_id).collection("tests")
        assessments_to_cache = []
        
        for test in tests:
            statement = test["test"]
            ground_truth = test["ground_truth"]
            
            # Generate AI assessment using the actual model pipeline
            ai_assessment = "pass"  # Default fallback
            if model_pipeline and prompt:
                try:
                    # Call the actual grading function
                    grade_result = model_pipeline.grade(statement, prompt)
                    # Convert acceptable/unacceptable to pass/fail, handle unknown
                    if grade_result == "acceptable":
                        ai_assessment = "pass"
                    elif grade_result == "unacceptable":
                        ai_assessment = "fail"
                    else:  # unknown or any other response
                        ai_assessment = "pass"  # Default fallback for topic creation
                except Exception as e:
                    print(f"Error grading statement during topic creation: {e}")
            
            test_doc = tests_ref.document()  # Auto-generate ID
            test_doc.set({
                "topic": topic_name,
                "statement": statement,
                "ground_truth": ground_truth,
                "ai_assessment": ai_assessment,
                "labeler": "user",
                "description": "",
                "author": user_id,
                "model_score": "",
                "created_at": datetime.utcnow()
            })
            
            # Add to cache list
            assessments_to_cache.append({
                "test_id": test_doc.id,
                "statement": statement,
                "ai_assessment": ai_assessment
            })
        
        # Cache all assessments for this topic and model
        if assessments_to_cache:
            cached_count = cache_multiple_assessments(user_id, topic_name, current_model_id, assessments_to_cache)
            print(f"Cached {cached_count} assessments for new topic {topic_name} with model {current_model_id}")
        
        return {"message": "Topic created successfully", "topic": topic_name}
        
    except Exception as e:
        raise Exception(f"Error creating topic: {str(e)}")

def add_statements_to_topic(user_id: str, statements_data: dict) -> dict:
    """
    Add new statements to an existing topic in Firestore and cache AI assessments
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        from datetime import datetime
        
        topic_name = statements_data["topic"]
        tests = statements_data["tests"]
        
        # Check if topic exists
        topic_ref = db.collection("users").document(user_id).collection("topics").document(topic_name)
        topic_doc = topic_ref.get()
        
        if not topic_doc.exists:
            raise Exception(f"Topic '{topic_name}' does not exist")
        
        topic_data = topic_doc.to_dict()
        prompt = topic_data.get("prompt", "")
        
        # Get current model ID for caching
        current_model_id = "groq-llama3"  # Default
        try:
            user_config_ref = db.collection("users").document(user_id).collection("config").document("model")
            doc = user_config_ref.get()
            if doc.exists:
                data = doc.to_dict()
                current_model_id = data.get("id", "groq-llama3")
        except Exception as e:
            print(f"Error getting current model: {e}")
        
        # Get the model pipeline for grading
        model_pipeline = None
        try:
            model_pipeline = get_model_pipeline(user_id)
        except Exception as e:
            print(f"Error getting model pipeline: {e}")
        
        # Save new tests in Firestore and prepare for caching
        tests_ref = db.collection("users").document(user_id).collection("tests")
        assessments_to_cache = []
        added_count = 0
        
        for test in tests:
            statement = test["test"]
            ground_truth = test["ground_truth"]
            
            # Skip empty statements
            if not statement.strip():
                continue
            
            # Generate AI assessment using the actual model pipeline
            ai_assessment = "pass"  # Default fallback
            if model_pipeline and prompt:
                try:
                    # Call the actual grading function
                    grade_result = model_pipeline.grade(statement, prompt)
                    # Convert acceptable/unacceptable to pass/fail, handle unknown
                    if grade_result == "acceptable":
                        ai_assessment = "pass"
                    elif grade_result == "unacceptable":
                        ai_assessment = "fail"
                    else:  # unknown or any other response
                        ai_assessment = "pass"  # Default fallback for statement addition
                except Exception as e:
                    print(f"Error grading statement during statement addition: {e}")
            
            test_doc = tests_ref.document()  # Auto-generate ID
            test_doc.set({
                "topic": topic_name,
                "statement": statement,
                "ground_truth": ground_truth,
                "ai_assessment": ai_assessment,
                "labeler": "user",
                "description": "",
                "author": user_id,
                "model_score": "",
                "created_at": datetime.utcnow()
            })
            
            # Add to cache list
            assessments_to_cache.append({
                "test_id": test_doc.id,
                "statement": statement,
                "ai_assessment": ai_assessment
            })
            
            added_count += 1
        
        # Update topic test count
        current_test_count = topic_data.get("test_count", 0)
        topic_ref.update({
            "test_count": current_test_count + added_count,
            "updated_at": datetime.utcnow()
        })
        
        # Cache all assessments for this topic and model
        if assessments_to_cache:
            cached_count = cache_multiple_assessments(user_id, topic_name, current_model_id, assessments_to_cache)
            print(f"Cached {cached_count} new assessments for topic {topic_name} with model {current_model_id}")
        
        return {
            "message": f"Successfully added {added_count} statements to topic '{topic_name}'",
            "topic": topic_name,
            "added_count": added_count
        }
        
    except Exception as e:
        raise Exception(f"Error adding statements to topic: {str(e)}")

def update_test_assessment(user_id: str, test_id: str, assessment_data: dict) -> dict:
    """
    Update the assessment for a specific test and recalculate agreement
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        
        assessment = assessment_data.get("assessment")
        if assessment not in ["acceptable", "unacceptable"]:
            raise Exception("Invalid assessment value")
        
        # For builtin topics, we need to store user assessments separately
        # since we can't modify the original CSV data
        
        # Check if this is a user assessment override
        user_assessment_ref = db.collection("users").document(user_id).collection("assessments").document(test_id)
        
        user_assessment_ref.set({
            "test_id": test_id,
            "assessment": assessment,
            "updated_at": datetime.utcnow()
        })
        
        # Calculate agreement if we have both assessments
        # Note: For built-in topics, we need to get the AI assessment from CSV or current grading
        # For user-created topics, we need to get it from Firestore
        # The agreement calculation will be handled in the frontend when the data is fetched
        
        return {"message": "Assessment updated successfully", "test_id": test_id, "assessment": assessment}
        
    except Exception as e:
        raise Exception(f"Error updating assessment: {str(e)}")


def grade_single_test(topic: str, test_id: str, user_id: str = None) -> dict:
    """
    Grade a single test statement and return the AI assessment
    """
    if not user_id or not FIREBASE_AVAILABLE:
        return {"test_id": test_id, "ai_assessment": "grading", "error": "Firebase not available"}
    
    try:
        # Get the topic prompt
        topic_prompt = None
        try:
            from app.services.views_service import DEFAULT_TOPICS
            topic_prompt = DEFAULT_TOPICS.get(topic)
        except ImportError:
            pass
        
        if not topic_prompt:
            return {"test_id": test_id, "ai_assessment": "grading", "error": "Topic prompt not found"}
        
        # Get the model pipeline
        model_pipeline = None
        try:
            model_pipeline = get_model_pipeline(user_id)
        except Exception as e:
            print(f"Error getting model pipeline: {e}")
            return {"test_id": test_id, "ai_assessment": "grading", "error": "Model pipeline not available"}
        
        # Get the test statement from CSV or Firestore
        statement = None
        
        # Check if this is a built-in topic
        try:
            from app.services.views_service import DEFAULT_TOPICS
            is_builtin_topic = topic in DEFAULT_TOPICS
        except ImportError:
            is_builtin_topic = topic in ["CU0", "CU5", "Food"]
        
        if is_builtin_topic:
            # Get statement from CSV
            csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic}.csv")
            if os.path.exists(csv_path):
                with open(csv_path, 'r', newline='', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    for i, row in enumerate(reader):
                        current_test_id = row.get('', '') or f"{topic}_{i}"
                        if current_test_id == test_id:
                            statement = row.get('input', '')
                            break
        else:
            # Get statement from Firestore
            from app.core.firebase_client import db
            test_doc = db.collection("users").document(user_id).collection("tests").document(test_id).get()
            if test_doc.exists:
                statement = test_doc.to_dict().get('statement', '')
        
        if not statement:
            return {"test_id": test_id, "ai_assessment": "grading", "error": "Test statement not found"}
        
        # Grade the statement
        try:
            grade_result = model_pipeline.grade(statement, topic_prompt)
            # Convert acceptable/unacceptable to pass/fail, handle unknown
            if grade_result == "acceptable":
                ai_assessment = "pass"
            elif grade_result == "unacceptable":
                ai_assessment = "fail"
            else:  # unknown or any other response
                ai_assessment = "grading"
            
            # Calculate agreement if user has assessed this test
            agreement = None
            user_assessment = None
            
            # Get user assessment
            try:
                from app.core.firebase_client import db
                assessment_doc = db.collection("users").document(user_id).collection("assessments").document(test_id).get()
                if assessment_doc.exists:
                    user_assessment = assessment_doc.to_dict().get('assessment')
                    
                    if user_assessment in ['acceptable', 'unacceptable']:
                        agreement = (
                            (ai_assessment == 'pass' and user_assessment == 'acceptable') or
                            (ai_assessment == 'fail' and user_assessment == 'unacceptable')
                        )
            except Exception as e:
                print(f"Error getting user assessment: {e}")
            
            return {
                "test_id": test_id,
                "ai_assessment": ai_assessment,
                "agreement": agreement,
                "success": True
            }
            
        except Exception as e:
            print(f"Error grading statement: {e}")
            return {"test_id": test_id, "ai_assessment": "grading", "error": f"Grading failed: {str(e)}"}
    
    except Exception as e:
        return {"test_id": test_id, "ai_assessment": "grading", "error": str(e)}

def update_test_assessment_with_agreement(user_id: str, test_id: str, assessment_data: dict) -> dict:
    """
    Update the assessment for a specific test and return updated agreement
    This is an optimized version that doesn't require full page reload
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        
        assessment = assessment_data.get("assessment")
        if assessment not in ["acceptable", "unacceptable"]:
            raise Exception("Invalid assessment value")
        
        # Store user assessment
        user_assessment_ref = db.collection("users").document(user_id).collection("assessments").document(test_id)
        user_assessment_ref.set({
            "test_id": test_id,
            "assessment": assessment,
            "updated_at": datetime.utcnow()
        })
        
        # Try to get current AI assessment to calculate agreement
        agreement = None
        topic = assessment_data.get("topic")  # Frontend should provide topic
        
        if topic:
            # Get AI assessment from previous grading or grade now if needed
            ai_assessment = None
            
            # Check if this is a built-in topic
            try:
                from app.services.views_service import DEFAULT_TOPICS
                is_builtin_topic = topic in DEFAULT_TOPICS
            except ImportError:
                is_builtin_topic = topic in ["CU0", "CU5", "Food"]
            
            if is_builtin_topic:
                # For built-in topics, we might need to grade or use cached result
                # For now, let's try to grade it
                grade_result = grade_single_test(topic, test_id, user_id)
                if grade_result.get("success"):
                    ai_assessment = grade_result.get("ai_assessment")
            
            # Calculate agreement if we have AI assessment
            if ai_assessment in ['pass', 'fail']:
                agreement = (
                    (ai_assessment == 'pass' and assessment == 'acceptable') or
                    (ai_assessment == 'fail' and assessment == 'unacceptable')
                )
        
        return {
            "message": "Assessment updated successfully",
            "test_id": test_id,
            "assessment": assessment,
            "agreement": agreement
        }
        
    except Exception as e:
        raise Exception(f"Error updating assessment: {str(e)}")

def clear_topic_cache(user_id: str, topic: str, model_id: str) -> dict:
    """
    Clear cached assessments for a specific topic and model combination
    """
    try:
        from app.services.assessment_cache_service import clear_cached_assessments_for_topic_model
        
        success = clear_cached_assessments_for_topic_model(user_id, topic, model_id)
        
        if success:
            return {
                "message": f"Cache cleared for topic '{topic}' and model '{model_id}'",
                "topic": topic,
                "model_id": model_id
            }
        else:
            return {
                "message": "No cache found or failed to clear cache",
                "topic": topic,
                "model_id": model_id
            }
    except Exception as e:
        raise Exception(f"Error clearing topic cache: {str(e)}")


def generate_statements_for_topic(user_id: str, generation_data: dict) -> dict:
    """
    Generate new statements for an existing topic using AI and add them to Firestore
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        from app.core.firebase_client import db
        from datetime import datetime
        
        topic_name = generation_data["topic"]
        criteria = generation_data.get("criteria", "base")
        num_statements = generation_data.get("num_statements", 5)
        
        # Check if topic exists and get its prompt
        topic_prompt = None
        is_builtin_topic = False
        
        # Check if this is a built-in topic
        try:
            from app.services.views_service import DEFAULT_TOPICS
            if topic_name in DEFAULT_TOPICS:
                topic_prompt = DEFAULT_TOPICS[topic_name]
                is_builtin_topic = True
        except ImportError:
            if topic_name in ["CU0", "CU5", "Food"]:
                is_builtin_topic = True
        
        if not is_builtin_topic:
            # For user-created topics, get prompt from Firestore
            topic_doc = db.collection("users").document(user_id).collection("topics").document(topic_name).get()
            if not topic_doc.exists:
                raise Exception(f"Topic '{topic_name}' does not exist")
            topic_data = topic_doc.to_dict()
            topic_prompt = topic_data.get("prompt", "")
        
        if not topic_prompt:
            raise Exception(f"No prompt found for topic '{topic_name}'")
        
        # Get existing statements for context
        existing_statements = []
        
        if is_builtin_topic:
            # Get statements from CSV
            import os
            import csv
            csv_path = os.path.join(os.getcwd(), "data", f"NTX_{topic_name}.csv")
            if os.path.exists(csv_path):
                with open(csv_path, 'r', newline='', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    for row in reader:
                        statement = row.get('input', '').strip()
                        if statement:
                            existing_statements.append(statement)
        else:
            # Get statements from Firestore
            tests_ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic_name)
            test_docs = tests_ref.stream()
            for doc in test_docs:
                data = doc.to_dict()
                statement = data.get('statement', '').strip()
                if statement:
                    existing_statements.append(statement)
        
        if not existing_statements:
            raise Exception(f"No existing statements found for topic '{topic_name}' to use as examples")
        
        # Get the model pipeline for generation
        model_pipeline = None
        try:
            model_pipeline = get_model_pipeline(user_id)
        except Exception as e:
            print(f"Error getting model pipeline: {e}")
            raise Exception("Model pipeline not available for generation")
        
        # Generate new statements using the pipeline
        generated_statements = model_pipeline.generate(
            existing_statements=existing_statements,
            topic_prompt=topic_prompt,
            criteria=criteria,
            num_statements=num_statements
        )
        
        if not generated_statements:
            raise Exception("Failed to generate statements")
        
        # Get current model ID for caching
        current_model_id = "groq-llama3"  # Default
        try:
            user_config_ref = db.collection("users").document(user_id).collection("config").document("model")
            doc = user_config_ref.get()
            if doc.exists:
                data = doc.to_dict()
                current_model_id = data.get("id", "groq-llama3")
        except Exception as e:
            print(f"Error getting current model: {e}")
        
        # Add generated statements to Firestore (only for user-created topics)
        added_statements = []
        if not is_builtin_topic:
            tests_ref = db.collection("users").document(user_id).collection("tests")
            
            for statement in generated_statements:
                test_doc = tests_ref.document()  # Auto-generate ID
                test_doc.set({
                    "topic": topic_name,
                    "statement": statement,
                    "ground_truth": "acceptable",  # Default for generated statements
                    "ai_assessment": "grading",  # Will be graded when displayed
                    "labeler": "ai_generated",
                    "description": f"Generated using {criteria} criteria",
                    "author": user_id,
                    "model_score": "",
                    "created_at": datetime.utcnow()
                })
                
                added_statements.append({
                    "id": test_doc.id,
                    "statement": statement,
                    "ground_truth": "acceptable",
                    "your_assessment": "ungraded",  # New statements are ungraded
                    "ai_assessment": "grading"  # Will be graded when displayed
                })
            
            # Update topic test count
            topic_ref = db.collection("users").document(user_id).collection("topics").document(topic_name)
            topic_doc = topic_ref.get()
            if topic_doc.exists:
                topic_data = topic_doc.to_dict()
                current_test_count = topic_data.get("test_count", 0)
                topic_ref.update({
                    "test_count": current_test_count + len(generated_statements),
                    "updated_at": datetime.utcnow()
                })
        else:
            # For built-in topics, just return the generated statements without saving
            for i, statement in enumerate(generated_statements):
                added_statements.append({
                    "id": f"generated_{topic_name}_{i}_{datetime.utcnow().timestamp()}",
                    "statement": statement,
                    "ground_truth": "acceptable",
                    "your_assessment": "ungraded",
                    "ai_assessment": "grading"  # Will be graded when displayed
                })
        
        return {
            "message": f"Successfully generated {len(generated_statements)} statements for topic '{topic_name}'",
            "topic": topic_name,
            "criteria": criteria,
            "generated_count": len(generated_statements),
            "statements": added_statements
        }
        
    except Exception as e:
        raise Exception(f"Error generating statements: {str(e)}")
