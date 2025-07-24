# apps/backend/app/services/perturbations_service.py
import time
from uuid import uuid4
from datetime import datetime
from app.utils.logs import log_test
from app.core.firebase_client import db
from app.utils.model_selector import get_model_pipeline
from app.services.tests_service import get_tests_by_topic
from app.services.criteria_service import save_user_criteria
from app.core.criteria_config import (
    DEFAULT_CRITERIA_CONFIGS,
    get_criteria_prompt,
    should_flip_label
)

def log_action(user_id: str, action: str, data: dict):
    log_entry = {
        "action": action,
        "data": data
    }
    log_test(user_id, log_entry)

def generate_perturbations(uid: str, topic: str, test_ids: list, batch_size: int = 10):
    try:
        topic_data = get_tests_by_topic(uid, topic)
        test_lookup = {test["id"]: test for test in topic_data["tests"]}

        user_criteria_doc = (
            db.collection("users")
            .document(uid)
            .collection("topics")
            .document(topic)
            .collection("config")
            .document("criteria")
            .get()
        )

        if user_criteria_doc.exists:
            criteria_data = user_criteria_doc.to_dict()
            criteria_types = criteria_data.get("types", [])
        else:
            print(f"No user criteria found for topic '{topic}', using AIBAT fallback")

            # Build default AIBAT criteria config
            criteria_types = [
                {
                    "name": name,
                    "prompt": get_criteria_prompt(name, for_generation=False),
                    "isDefault": True
                }
                for name in DEFAULT_CRITERIA_CONFIGS.get("AIBAT", [])
            ]

            # Save it to Firestore so it's stored for future use
            save_user_criteria(uid, topic, criteria_types)

        pipeline = get_model_pipeline(uid)
        results = []

        # Filter tests to only include those where AI and user assessments match
        matching_tests = []
        for test_id in test_ids:
            if test_id not in test_lookup:
                print(f"Test ID {test_id} not found, skipping")
                continue
                
            test = test_lookup[test_id]
            ai_assessment = test.get("label", "ungraded")  # AI assessment
            user_assessment = test.get("ground_truth", "ungraded")  # User assessment
            
            # Convert AI assessment format (acceptable/unacceptable) to match user format if needed
            # Both should be in acceptable/unacceptable format
            if ai_assessment in ["acceptable", "unacceptable"] and user_assessment in ["acceptable", "unacceptable"]:
                if ai_assessment == user_assessment:
                    matching_tests.append(test)
                    print(f"Including test '{test['title'][:50]}...' - AI: {ai_assessment}, User: {user_assessment}")
                else:
                    print(f"Skipping test '{test['title'][:50]}...' - AI: {ai_assessment}, User: {user_assessment} (mismatch)")
            else:
                print(f"Skipping test '{test['title'][:50]}...' - AI: {ai_assessment}, User: {user_assessment} (ungraded)")

        print(f"Filtered {len(matching_tests)} matching tests out of {len(test_ids)} requested tests")

        # Create task list only for matching tests
        task_list = [
            (test, criteria)
            for test in matching_tests
            for criteria in criteria_types
        ]

        if not task_list:
            print("No matching tests found for perturbation generation")
            return {"message": "No perturbations generated - no tests with matching AI and user assessments", "perturbations": []}

        print(f"Processing {len(task_list)} perturbation tasks across {len(matching_tests)} tests and {len(criteria_types)} criteria types")

        for i in range(0, len(task_list), batch_size):
            batch = task_list[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(task_list) + batch_size - 1)//batch_size} with {len(batch)} items")

            pert_prompts = [f"{criteria['prompt']}: {test['title']}" for test, criteria in batch]
            print(f"Generated {len(pert_prompts)} perturbation prompts")
            
            # Use batch processing for perturbations if available
            if hasattr(pipeline, 'batch_perturb'):
                print(f"Using batch perturbation for {len(pert_prompts)} items")
                try:
                    perturbed_texts = pipeline.batch_perturb(pert_prompts)
                    print(f"Batch perturbation completed, got {len(perturbed_texts)} results")
                except Exception as e:
                    print(f"Batch perturbation failed: {e}, falling back to individual calls")
                    # Fallback to individual calls
                    perturbed_texts = []
                    for j, prompt in enumerate(pert_prompts):
                        try:
                            perturbed_text = pipeline.custom_perturb(prompt)
                            perturbed_texts.append(perturbed_text)
                        except Exception as e:
                            print(f"Error in perturbation {j+1}: {e}")
                            perturbed_texts.append(None)
            else:
                # Fallback for pipelines without batch support
                print("Pipeline doesn't support batch perturbation, using individual calls")
                perturbed_texts = []
                for j, prompt in enumerate(pert_prompts):
                    try:
                        perturbed_text = pipeline.custom_perturb(prompt)
                        perturbed_texts.append(perturbed_text)
                    except Exception as e:
                        print(f"Error in perturbation {j+1}: {e}")
                        perturbed_texts.append(None)
            
            # Filter out None values for grading
            valid_texts = [text for text in perturbed_texts if text is not None]
            
            # Use batch processing for grading if available
            if valid_texts and hasattr(pipeline, 'batch_grade'):
                print(f"Using batch grading for {len(valid_texts)} valid perturbations")
                try:
                    batch_grades = pipeline.batch_grade(valid_texts, topic)
                    print(f"Batch grading completed, got {len(batch_grades)} results")
                    
                    # Map batch grades back to the full list (including None values)
                    graded_labels = []
                    valid_index = 0
                    for perturbed_text in perturbed_texts:
                        if perturbed_text is None:
                            graded_labels.append("unknown")
                        else:
                            if valid_index < len(batch_grades):
                                graded_labels.append(batch_grades[valid_index])
                            else:
                                graded_labels.append("unknown")
                            valid_index += 1
                            
                except Exception as e:
                    print(f"Batch grading failed: {e}, falling back to individual calls")
                    # Fallback to individual grading
                    graded_labels = []
                    for j, perturbed_text in enumerate(perturbed_texts):
                        if perturbed_text is None:
                            graded_labels.append("unknown")
                        else:
                            try:
                                label_result = pipeline.grade(perturbed_text, topic)
                                graded_labels.append(label_result)
                            except Exception as e:
                                print(f"Error in grading {j+1}: {e}")
                                graded_labels.append("unknown")
            else:
                # Fallback for pipelines without batch support or no valid texts
                print("Using individual grading calls")
                graded_labels = []
                for j, perturbed_text in enumerate(perturbed_texts):
                    if perturbed_text is None:
                        graded_labels.append("unknown")
                    else:
                        try:
                            label_result = pipeline.grade(perturbed_text, topic)
                            graded_labels.append(label_result)
                        except Exception as e:
                            print(f"Error in grading {j+1}: {e}")
                            graded_labels.append("unknown")

            for (test, criteria), perturbed_text, label_result in zip(batch, perturbed_texts, graded_labels):
                # Skip failed perturbations
                if perturbed_text is None:
                    print(f"Skipping failed perturbation for test {test['id']} with criteria {criteria['name']}")
                    continue
                    
                name = criteria["name"]
                ai_assessment = "pass" if label_result == "acceptable" else "fail"

                user_assessment = test.get("ground_truth", "ungraded")
                expected_gt = user_assessment

                if expected_gt != "ungraded" and should_flip_label(name):
                    expected_gt = "unacceptable" if expected_gt == "acceptable" else "acceptable"

                validity = "approved" if (
                    (ai_assessment == "pass" and expected_gt == "acceptable") or
                    (ai_assessment == "fail" and expected_gt == "unacceptable")
                ) else "denied"

                pert_id = f"{test['id']}_{name}".replace(" ", "_").replace("-", "_").lower()

                perturbation = {
                    "id": pert_id,
                    "original_id": test["id"],
                    "title": perturbed_text,
                    "label": ai_assessment,
                    "type": name,
                    "topic": topic,
                    "ground_truth": expected_gt,
                    "validity": validity,
                    "created_at": datetime.utcnow()
                }

                db.collection("users").document(uid).collection("perturbations").document(pert_id).set(perturbation)
                log_action(uid, "generate_perturbation", perturbation)
                results.append(perturbation)

        return {"message": f"Generated {len(results)} perturbations", "perturbations": results}

    except Exception as e:
        raise Exception(f"Error generating perturbations: {str(e)}")


def get_perturbations_by_topic(uid: str, topic: str):
    try:
        perturbations_ref = db.collection("users").document(uid).collection("perturbations")
        query = perturbations_ref.where("topic", "==", topic)

        perturbations_docs = query.get()

        perturbations = []
        for doc in perturbations_docs:
            perturbation_data = doc.to_dict()
            perturbation_data["id"] = doc.id
            perturbations.append(perturbation_data)

        return {"perturbations": perturbations}

    except Exception as e:
        raise Exception(f"Error fetching perturbations: {str(e)}")
