from app.core.firebase_client import db
from app.utils.model_selector import get_model_pipeline
from app.services.assessment_cache_service import cache_multiple_assessments
from app.services.topics_service import get_topics
from app.services.models_service import get_current_model
from datetime import datetime
from uuid import uuid4

from app.core.model_config import DEFAULT_MODEL_ID
from app.services.shared_test_utils import add_tests

def get_tests_by_topic(user_id: str, topic: str):
    ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic)
    docs = ref.stream()

    tests = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        tests.append(data)
    return {"topic": topic, "test_count": len(tests), "tests": tests}


# Delete multiple tests by ID
def delete_tests(user_id: str, test_ids: list[str]):
    ref = db.collection("users").document(user_id).collection("tests")
    for tid in test_ids:
        ref.document(tid).delete()
    return {"deleted_count": len(test_ids)}


# Grade multiple test statements by ID
def auto_grade_tests(user_id: str, test_ids: list[str]):
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

    cache_multiple_assessments(user_id, topic, DEFAULT_MODEL_ID, assessments)  # or get user's current model
    return {"graded_count": len(assessments), "results": assessments}


# Edit multiple tests (title, ground_truth)
def edit_tests(user_id: str, test_updates: list):
    ref = db.collection("users").document(user_id).collection("tests")
    updated = 0
    pipeline = None
    
    for update in test_updates:
        test_id = update.id
        new_data = {}
        title_changed = False
        
        if update.title is not None:
            new_data["title"] = update.title
            title_changed = True
        if update.ground_truth is not None:
            new_data["ground_truth"] = update.ground_truth
            
        if new_data:
            new_data["updated_at"] = datetime.utcnow()
            
            # If title changed, reset AI assessment and re-grade
            if title_changed:
                if pipeline is None:
                    pipeline = get_model_pipeline(user_id)
                
                # Get the test document to get the topic
                test_doc = ref.document(test_id).get()
                if test_doc.exists:
                    test_data = test_doc.to_dict()
                    topic = test_data.get("topic")
                    
                    # Re-grade the updated statement
                    new_label = pipeline.grade(update.title, topic)
                    new_data["label"] = new_label
                    new_data["validity"] = "approved" if new_label == new_data.get("ground_truth", test_data.get("ground_truth")) else "denied"
                    
                    # Cache the new assessment
                    assessments = [{
                        "test_id": test_id,
                        "statement": update.title,
                        "ai_assessment": new_label
                    }]
                    cache_multiple_assessments(user_id, topic, DEFAULT_MODEL_ID, assessments)
            
            ref.document(test_id).update(new_data)
            updated += 1
            
    return {"updated_count": updated}


# Add a user assessment for a test (also calculates agreement)
def add_assessment(user_id: str, test_id: str, assessment: str):
    if assessment not in ["acceptable", "unacceptable"]:
        raise ValueError("Assessment must be acceptable or unacceptable")

    test_ref = db.collection("users").document(user_id).collection("tests").document(test_id)

    # Check if the test exists
    test_doc = test_ref.get()
    if not test_doc.exists:
        raise ValueError(f"Test with ID '{test_id}' not found")

    test_ref.update({
        "ground_truth": assessment,
        "updated_at": datetime.utcnow()
    })

    return {
        "message": "Assessment recorded as ground truth",
        "test_id": test_id,
        "assessment": assessment
    }


# Return all logs for the user
def get_logs(user_id: str):
    from app.utils.logs import log_test
    return log_test(user_id, get_only=True)


def generate_statements(user_id: str, generation_data: dict) -> dict:
    """
    Generate new statements for an existing topic using AI and add them to Firestore
    """
    
    topic_name = generation_data["topic"]
    criteria = generation_data.get("criteria", "base")
    num_statements = generation_data.get("num_statements", 5)
    
    # Get topic data including prompt from topics API
    topics = get_topics(user_id)
    topic_data = None
    for topic in topics:
        if topic["name"] == topic_name:
            topic_data = topic
            break
    
    if not topic_data:
        raise Exception(f"Topic '{topic_name}' does not exist")
    
    topic_prompt = topic_data.get("prompt", "")
    if not topic_prompt:
        raise Exception(f"No prompt found for topic '{topic_name}'")
    
    # Get existing statements for context from Firestore
    tests_ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic_name)
    test_docs = tests_ref.stream()
    existing_statements = []
    for doc in test_docs:
        data = doc.to_dict()
        statement = data.get('title', '').strip()
        if statement:
            existing_statements.append(statement)
    
    if not existing_statements:
        raise Exception(f"No existing statements found for topic '{topic_name}' to use as examples")
    
    # Get the model pipeline for generation
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
    
    # Get current model for caching
    try:
        current_model = get_current_model(user_id)
        current_model_id = current_model.get("id", DEFAULT_MODEL_ID)
    except Exception as e:
        print(f"Error getting current model: {e}")
        current_model_id = DEFAULT_MODEL_ID
    
    # Prepare test data for add_tests function
    test_payload = [{"title": statement, "ground_truth": "ungraded"} for statement in generated_statements]
    
    # Use add_tests to add the generated statements
    result = add_tests(user_id, topic_name, test_payload)
    
    # Cache the generated assessments
    assessments = []
    for i, statement in enumerate(generated_statements):
        assessments.append({
            "test_id": result["test_ids"][i] if i < len(result["test_ids"]) else f"generated_{i}",
            "statement": statement,
            "ai_assessment": "ungraded"
        })
    
    cache_multiple_assessments(user_id, topic_name, current_model_id, assessments)
    
    return result

