from app.core.firebase_client import db
from app.utils.model_selector import get_model_pipeline
from app.services.assessment_cache_service import cache_multiple_assessments
from datetime import datetime
from uuid import uuid4

def get_tests_by_topic(user_id: str, topic: str):
    ref = db.collection("users").document(user_id).collection("tests").where("topic", "==", topic)
    docs = ref.stream()

    tests = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        tests.append(data)
    return {"topic": topic, "test_count": len(tests), "tests": tests}

# Add multiple test statements to an existing topic
def add_tests(user_id: str, topic: str, tests: list[dict]):
    ref = db.collection("users").document(user_id).collection("tests")
    added_ids = []

    for test in tests:
        if not test.get("title"): continue
        doc_id = uuid4().hex
        ref.document(doc_id).set({
            "id": doc_id,
            "topic": topic,
            "title": test["title"],
            "ground_truth": test.get("ground_truth", "ungraded"),
            "label": "ungraded",
            "validity": "ungraded",
            "created_at": datetime.utcnow()
        })
        added_ids.append(doc_id)

    return {"added_count": len(added_ids), "test_ids": added_ids}


# Delete multiple tests by ID
def delete_tests(user_id: str, test_ids: list[str]):
    ref = db.collection("users").document(user_id).collection("tests")
    for tid in test_ids:
        ref.document(tid).delete()
    return {"deleted_count": len(test_ids)}


# Grade multiple test statements by ID
def grade_tests(user_id: str, test_ids: list[str]):
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

    cache_multiple_assessments(user_id, topic, "groq-llama3", assessments)  # or get user's current model
    return {"graded_count": len(assessments), "results": assessments}


# Edit multiple tests (title, ground_truth)
def edit_tests(user_id: str, test_updates: list[dict]):
    ref = db.collection("users").document(user_id).collection("tests")
    updated = 0
    for update in test_updates:
        test_id = update["id"]
        new_data = {}
        if "title" in update: new_data["title"] = update["title"]
        if "ground_truth" in update: new_data["ground_truth"] = update["ground_truth"]
        if new_data:
            new_data["updated_at"] = datetime.utcnow()
            ref.document(test_id).update(new_data)
            updated += 1
    return {"updated_count": updated}


# Add a user assessment for a test (also calculates agreement)
def add_assessment(user_id: str, test_id: str, assessment: str):
    if assessment not in ["acceptable", "unacceptable"]:
        raise ValueError("Assessment must be acceptable or unacceptable")

    assessment_ref = db.collection("users").document(user_id).collection("assessments").document(test_id)
    assessment_ref.set({
        "test_id": test_id,
        "assessment": assessment,
        "updated_at": datetime.utcnow()
    })

    return {"message": "Assessment updated", "test_id": test_id, "assessment": assessment}


# Return all logs for the user
def get_logs(user_id: str):
    from app.utils.logs import log_test
    return log_test(user_id, get_only=True)


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

