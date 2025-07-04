# app/utils/logs.py

from typing import List, Dict, Any, Optional
import json
from datetime import datetime

# In-memory log storage per user (can later move to DB)
user_logs = {}

def log_test(user_id: str, test_data: Dict[str, Any] = None, get_only: bool = False) -> Optional[List[Dict[str, Any]]]:
    """
    Log test data for a user or retrieve logs
    
    Args:
        user_id: User identifier
        test_data: Test data to log (optional)
        get_only: If True, only return logs without adding new data
    
    Returns:
        List of logs if get_only is True, otherwise None
    """
    if user_id not in user_logs:
        user_logs[user_id] = []
    
    if get_only:
        return user_logs[user_id]
    
    if test_data:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "data": test_data
        }
        user_logs[user_id].append(log_entry)
    
    return None

def clear_logs(user_id: str):
    """Clear all logs for a user"""
    if user_id in user_logs:
        user_logs[user_id] = []

def get_user_logs(user_id: str) -> List[Dict[str, Any]]:
    """Get all logs for a user"""
    return user_logs.get(user_id, [])