# app/services/onboard_service.py

import os
import pandas as pd
from datetime import datetime
from app.utils.model_selector import get_model_pipeline
from app.core.topic_config import DEFAULT_TOPICS
from app.core.firebase_client import db as _db
from app.services.topics_service import add_topic
from app.models.schemas import AddTopicInput, TopicTestInput
from uuid import uuid4

def ensure_user_onboarded(uid: str):
    user_doc = _db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    if user_data.get("onboardingComplete"):
        return {"message": "Already onboarded"}

    # Run onboarding logic
    init_user_data(uid)

    # Mark onboarding complete
    _db.collection("users").document(uid).set({
        "onboardingComplete": True,
        "onboarded_at": datetime.utcnow()
    }, merge=True)

    return {"message": "User onboarded"}

def init_user_data(uid: str):
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    data_dir = os.path.abspath(data_dir)

    for topic, prompt in DEFAULT_TOPICS.items():
        # Load CSV
        csv_path = os.path.join(data_dir, f"NTX_{topic}.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            df = pd.DataFrame({
                "input": [f"Sample test case for {topic}"],
                "output": ["acceptable"]
            })

        # Build test list with ground_truth only
        test_inputs = []
        for _, row in df.iterrows():
            title = row.get("input") or row.get("title")
            ground_truth = "ungraded"  # By default, user assessments are marked as ungraded
            if not title:
                continue

            test_inputs.append(TopicTestInput(
                test=title,
                ground_truth=ground_truth
            ))

        # Call add_topic with default=True
        add_topic(uid, AddTopicInput(
            topic=topic,
            prompt_topic=prompt,
            tests=test_inputs,
            default=True
        ))

    return {"message": "Default topics and tests initialized from CSV."}


