# app/services/criteria_service.py

from app.utils.logs import log_test
from uuid import uuid4
from typing import List, Dict, Any

# Optional imports for Firebase-dependent functionality
FIREBASE_AVAILABLE = False
_db = None
get_model_pipeline = None

try:
    from app.utils.model_selector import get_model_pipeline
    from app.core.firebase_client import db as _db
    FIREBASE_AVAILABLE = True
except (ImportError, KeyError, Exception):
    # Firebase dependencies not available
    pass

def log_action(user_id: str, action: str, data: dict):
    """Simple logging function for criteria actions"""
    log_entry = {
        "action": action,
        "data": data
    }
    log_test(user_id, log_entry)

# Default criteria configurations
DEFAULT_CRITERIA_TYPES = {
    "AIBAT": ["spelling", "negation", "synonyms", "paraphrase", "acronyms", "antonyms", "spanish"],
    "Mini-AIBAT": ["spelling", "synonyms", "paraphrase", "acronyms", "spanish"],
    "M-AIBAT": ["spanish", "spanglish", "english", "nouns", "spelling", "cognates", "dialect", "loan_word"]
}

def get_all_criteria_types(uid: str):
    """Get all available criteria types (default + custom)"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        # Get custom criteria from Firestore
        custom_docs = _db.collection("users").document(uid).collection("custom_criteria").stream()
        custom_criteria = []
        
        for doc in custom_docs:
            data = doc.to_dict()
            custom_criteria.append({
                "name": data.get("name", doc.id),
                "is_custom": True,
                "is_default": False
            })
        
        # Get default criteria (we'll use AIBAT as default for now)
        default_criteria = []
        for criteria_name in DEFAULT_CRITERIA_TYPES.get("AIBAT", []):
            default_criteria.append({
                "name": criteria_name,
                "is_custom": False,
                "is_default": True
            })
        
        all_criteria = custom_criteria + default_criteria
        
        return {"criteria_types": all_criteria}
        
    except Exception as e:
        raise Exception(f"Error fetching criteria types: {str(e)}")

def get_criteria_info(uid: str, criteria_name: str):
    """Get information about a specific criteria type"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        # Check if it's a custom criteria first
        doc_ref = _db.collection("users").document(uid).collection("custom_criteria").document(criteria_name)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return {
                "name": criteria_name,
                "prompt": data.get("prompt", ""),
                "flip_label": data.get("flip_label", False)
            }
        
        # If not custom, check if it's a default criteria
        for config, criteria_list in DEFAULT_CRITERIA_TYPES.items():
            if criteria_name in criteria_list:
                return {
                    "name": criteria_name,
                    "prompt": f"Default prompt for {criteria_name}",
                    "flip_label": criteria_name in ["negation", "antonyms"]  # These typically flip labels
                }
        
        raise Exception(f"Criteria '{criteria_name}' not found")
        
    except Exception as e:
        raise Exception(f"Error fetching criteria info: {str(e)}")

def add_custom_criteria(uid: str, name: str, prompt: str, flip_label: bool, topic: str):
    """Add a new custom criteria type"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        # Check if criteria already exists
        doc_ref = _db.collection("users").document(uid).collection("custom_criteria").document(name)
        if doc_ref.get().exists:
            raise Exception(f"Criteria '{name}' already exists")
        
        # Create the custom criteria
        criteria_data = {
            "name": name,
            "prompt": prompt,
            "flip_label": flip_label,
            "topic": topic,
            "created_at": str(uuid4()),
            "updated_at": str(uuid4())
        }
        
        doc_ref.set(criteria_data)
        log_action(uid, "add_custom_criteria", criteria_data)
        
        return {"message": f"Custom criteria '{name}' added successfully"}
        
    except Exception as e:
        raise Exception(f"Error adding custom criteria: {str(e)}")

def edit_criteria(uid: str, name: str, prompt: str, flip_label: bool):
    """Edit an existing custom criteria type"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        doc_ref = _db.collection("users").document(uid).collection("custom_criteria").document(name)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception(f"Custom criteria '{name}' not found")
        
        # Update the criteria
        updated_data = doc.to_dict()
        updated_data.update({
            "prompt": prompt,
            "flip_label": flip_label,
            "updated_at": str(uuid4())
        })
        
        doc_ref.set(updated_data)
        log_action(uid, "edit_criteria", updated_data)
        
        return {"message": f"Criteria '{name}' updated successfully"}
        
    except Exception as e:
        raise Exception(f"Error editing criteria: {str(e)}")

def delete_criteria(uid: str, criteria_name: str):
    """Delete a custom criteria type"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        doc_ref = _db.collection("users").document(uid).collection("custom_criteria").document(criteria_name)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception(f"Custom criteria '{criteria_name}' not found")
        
        # Delete the criteria
        doc_ref.delete()
        log_action(uid, "delete_criteria", {"name": criteria_name})
        
        # Also delete any perturbations using this criteria type
        perturbations_ref = _db.collection("users").document(uid).collection("perturbations")
        perturbations_docs = perturbations_ref.where("type", "==", criteria_name).stream()
        
        deleted_count = 0
        for pert_doc in perturbations_docs:
            pert_doc.reference.delete()
            deleted_count += 1
        
        return {
            "message": f"Criteria '{criteria_name}' deleted successfully",
            "deleted_perturbations": deleted_count
        }
        
    except Exception as e:
        raise Exception(f"Error deleting criteria: {str(e)}")

def test_criteria_prompt(uid: str, prompt: str, test_case: str):
    """Test a criteria prompt on a sample text"""
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase not available")
    
    try:
        pipeline = get_model_pipeline(uid)
        perturbed_text = pipeline.custom_perturb(f"{prompt}: {test_case}")
        
        return {"perturbed": perturbed_text}
        
    except Exception as e:
        raise Exception(f"Error testing criteria prompt: {str(e)}")

def get_default_criteria(config: str):
    """Get default criteria types for a configuration"""
    if config not in DEFAULT_CRITERIA_TYPES:
        raise Exception(f"Invalid configuration: {config}")
    
    return {"default_types": DEFAULT_CRITERIA_TYPES[config]}