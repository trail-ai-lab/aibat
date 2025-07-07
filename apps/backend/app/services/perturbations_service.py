# apps/backend/app/services/perturbations_service.py
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

def generate_perturbations(uid: str, topic: str, test_ids: list, batch_size: int = 5):
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

        task_list = [
            (test_lookup[test_id], criteria)
            for test_id in test_ids if test_id in test_lookup
            for criteria in criteria_types
        ]

        for i in range(0, len(task_list), batch_size):
            batch = task_list[i:i + batch_size]

            pert_prompts = [f"{criteria['prompt']}: {test['title']}" for test, criteria in batch]
            perturbed_texts = [pipeline.custom_perturb(p) for p in pert_prompts]
            graded_labels = [pipeline.grade(p, topic) for p in perturbed_texts]

            for (test, criteria), perturbed_text, label_result in zip(batch, perturbed_texts, graded_labels):
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
