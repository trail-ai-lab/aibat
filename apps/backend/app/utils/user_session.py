# app/utils/user_session.py

from typing import Dict, Any

# In-memory user session data store (can later move to DB)
user_sessions = {}

def get_user_session_data(user_id: str) -> Dict[str, Any]:
    """
    Get user session data
    
    Args:
        user_id: User identifier
    
    Returns:
        Dictionary containing user session data
    """
    if user_id not in user_sessions:
        user_sessions[user_id] = {
            "model": "mock",  # Default model
            "config": {},
            "preferences": {}
        }
    
    return user_sessions[user_id]

def set_user_session_data(user_id: str, data: Dict[str, Any]):
    """
    Set user session data
    
    Args:
        user_id: User identifier
        data: Session data to store
    """
    if user_id not in user_sessions:
        user_sessions[user_id] = {}
    
    user_sessions[user_id].update(data)

def clear_user_session(user_id: str):
    """Clear user session data"""
    if user_id in user_sessions:
        del user_sessions[user_id]

def update_user_model(user_id: str, model_name: str):
    """Update user's selected model"""
    session_data = get_user_session_data(user_id)
    session_data["model"] = model_name
    user_sessions[user_id] = session_data