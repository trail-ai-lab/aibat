# app/services/topics_service.py

from typing import List
from datetime import datetime
from app.core.firebase_client import db as _db
from uuid import uuid4
from app.utils.model_selector import get_model_pipeline
from app.api.v1.endpoints.topics import TopicTestInput
from app.services.tests_service import add_tests


def add_topic(uid: str, body):
    topic = body.topic
    prompt = body.prompt_topic
    tests = body.tests
    is_default = body.default

    # Save topic metadata in Firestore
    _db.collection("users").document(uid).collection("topics").document(topic).set({
        "prompt": prompt,
        "default": is_default,
        "created_at": datetime.utcnow()
    })

    # Use shared logic to add test statements
    test_payload = [{"title": t.test, "ground_truth": t.ground_truth} for t in tests]
    add_tests(uid, topic, test_payload)


    return {"message": "Topic and tests added successfully!"}

def delete_topic(uid: str, topic: str):
    _db.collection("users").document(uid).collection("topics").document(topic).delete()
    _db.collection("users").document(uid).collection("tests").where("topic", "==", topic).get()
    _db.collection("users").document(uid).collection("perturbations").where("topic", "==", topic).get()
    return {"message": "Topic deleted successfully!"}

def get_topics(uid: str):
    docs = _db.collection("users").document(uid).collection("topics").stream()
    return [doc.id for doc in docs]

def get_topic_prompt(uid: str, topic: str):
    doc = _db.collection("users").document(uid).collection("topics").document(topic).get()
    if doc.exists:
        return doc.to_dict()["prompt"]
    return None

def test_prompt(uid: str, prompt: str, test: str):
    pipeline = get_model_pipeline(uid)
    return pipeline.grade_with_prompt(prompt, test)


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
            from apps.backend.app.services.onboard_service import DEFAULT_TOPICS
            if topic_name in DEFAULT_TOPICS:
                topic_prompt = DEFAULT_TOPICS[topic_name]
                is_builtin_topic = True
        except ImportError:
            if topic_name in ["CU0", "CU5", "Food"]:
                is_builtin_topic = True
                # Fallback prompts for built-in topics
                fallback_prompts = {
                    "CU0": "Does the following contain the physics concept: Greater height means greater energy? Here is the sentence:",
                    "CU5": "The sentence is acceptable if it contains the physics concept: The more mass, the more energy. If not, it is unacceptable. Here is the sentence:",
                    "Food": "Does this sentence include a description of food and/or culture? Here is the sentence:"
                }
                topic_prompt = fallback_prompts.get(topic_name)
        
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

