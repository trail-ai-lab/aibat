# app/services/assessment_cache_service.py

from datetime import datetime
from typing import Dict, List, Optional
from app.models.schemas import CachedAssessment

# Optional imports for Firebase-dependent functionality
FIREBASE_AVAILABLE = False
try:
    from app.core.firebase_client import db
    FIREBASE_AVAILABLE = True
except (ImportError, KeyError, Exception):
    # Firebase dependencies not available
    pass

def get_cached_assessment(user_id: str, topic: str, model_id: str, test_id: str) -> Optional[str]:
    """
    Get cached AI assessment for a specific test, topic, and model combination
    
    Returns:
        AI assessment ("pass" or "fail") if cached, None if not found
    """
    if not FIREBASE_AVAILABLE:
        return None
    
    try:
        # Query for cached assessment
        cache_ref = db.collection("users").document(user_id).collection("assessment_cache")
        query = cache_ref.where("topic", "==", topic)\
                        .where("model_id", "==", model_id)\
                        .where("test_id", "==", test_id)\
                        .limit(1)
        
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            return data.get("ai_assessment")
        
        return None
    except Exception as e:
        print(f"Error getting cached assessment: {e}")
        return None

def get_cached_assessments_for_topic(user_id: str, topic: str, model_id: str) -> Dict[str, str]:
    """
    Get all cached AI assessments for a topic and model combination
    
    Returns:
        Dictionary mapping test_id to ai_assessment
    """
    if not FIREBASE_AVAILABLE:
        return {}
    
    try:
        cache_ref = db.collection("users").document(user_id).collection("assessment_cache")
        query = cache_ref.where("topic", "==", topic).where("model_id", "==", model_id)
        
        cached_assessments = {}
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            test_id = data.get("test_id")
            ai_assessment = data.get("ai_assessment")
            if test_id and ai_assessment:
                cached_assessments[test_id] = ai_assessment
        
        return cached_assessments
    except Exception as e:
        print(f"Error getting cached assessments for topic: {e}")
        return {}

def cache_assessment(user_id: str, topic: str, model_id: str, test_id: str, statement: str, ai_assessment: str) -> bool:
    """
    Cache an AI assessment for future use
    
    Returns:
        True if successfully cached, False otherwise
    """
    if not FIREBASE_AVAILABLE:
        return False
    
    try:
        cache_ref = db.collection("users").document(user_id).collection("assessment_cache")
        
        # Create a unique document ID based on topic, model, and test
        doc_id = f"{topic}_{model_id}_{test_id}".replace("/", "_").replace(" ", "_")
        
        cache_data = {
            "user_id": user_id,
            "topic": topic,
            "model_id": model_id,
            "test_id": test_id,
            "statement": statement,
            "ai_assessment": ai_assessment,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        cache_ref.document(doc_id).set(cache_data)
        return True
    except Exception as e:
        print(f"Error caching assessment: {e}")
        return False

def cache_multiple_assessments(user_id: str, topic: str, model_id: str, assessments: List[Dict]) -> int:
    """
    Cache multiple AI assessments at once
    
    Args:
        assessments: List of dicts with keys: test_id, statement, ai_assessment
    
    Returns:
        Number of successfully cached assessments
    """
    if not FIREBASE_AVAILABLE:
        return 0
    
    cached_count = 0
    for assessment in assessments:
        test_id = assessment.get("test_id")
        statement = assessment.get("statement")
        ai_assessment = assessment.get("ai_assessment")
        
        if test_id and statement and ai_assessment:
            if cache_assessment(user_id, topic, model_id, test_id, statement, ai_assessment):
                cached_count += 1
    
    return cached_count

def clear_cached_assessments_for_topic_model(user_id: str, topic: str, model_id: str) -> bool:
    """
    Clear all cached assessments for a specific topic and model combination
    
    Returns:
        True if successfully cleared, False otherwise
    """
    if not FIREBASE_AVAILABLE:
        return False
    
    try:
        cache_ref = db.collection("users").document(user_id).collection("assessment_cache")
        query = cache_ref.where("topic", "==", topic).where("model_id", "==", model_id)
        
        docs = query.stream()
        for doc in docs:
            doc.reference.delete()
        
        return True
    except Exception as e:
        print(f"Error clearing cached assessments: {e}")
        return False

def get_cached_topics_for_model(user_id: str, model_id: str) -> List[str]:
    """
    Get list of topics that have cached assessments for a specific model
    
    Returns:
        List of topic names
    """
    if not FIREBASE_AVAILABLE:
        return []
    
    try:
        cache_ref = db.collection("users").document(user_id).collection("assessment_cache")
        query = cache_ref.where("model_id", "==", model_id)
        
        topics = set()
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            topic = data.get("topic")
            if topic:
                topics.add(topic)
        
        return list(topics)
    except Exception as e:
        print(f"Error getting cached topics for model: {e}")
        return []