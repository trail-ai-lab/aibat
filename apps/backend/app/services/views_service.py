# app/services/views_service.py

import os
import pandas as pd
from datetime import datetime
from app.core.firebase_client import db as _db
from app.utils.model_selector import get_model_pipeline
from app.utils.logs import log_action
from uuid import uuid4


DEFAULT_TOPICS = {
    "CU0": "Does the following contain the physics concept: Greater height means greater energy? Here is the sentence:",
    "CU5": "The sentence is acceptable if it contains the physics concept: The more mass, the more energy. If not, it is unacceptable. Here is the sentence:",
    "Food": "Does this sentence include a description of food and/or culture? Here is the sentence:"
}


def init_user_data(uid: str):
    topic_ref = _db.collection("users").document(uid).collection("topics")
    test_ref = _db.collection("users").document(uid).collection("tests")

    for topic, prompt in DEFAULT_TOPICS.items():
        # Save topic prompt
        topic_ref.document(topic).set({
            "prompt": prompt,
            "created_at": datetime.utcnow()
        })

        # Load CSV if available
        csv_path = os.path.join(os.getcwd(), "data", f"{topic}.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            df = pd.DataFrame({
                "input": [f"Sample test case for {topic}"],
                "output": ["acceptable"]
            })

        pipeline = get_model_pipeline(uid)

        for _, row in df.iterrows():
            title = row["input"]
            ground_truth = row["output"]
            label = pipeline.grade(title, topic)
            doc_id = uuid4().hex

            test_ref.document(doc_id).set({
                "id": doc_id,
                "title": title,
                "topic": topic,
                "label": label,
                "ground_truth": ground_truth,
                "validity": "approved" if label == ground_truth else "denied",
                "created_at": datetime.utcnow()
            })

    return {"message": "Initial tests and topics loaded!"}


def check_user_initialized(uid: str):
    topics = list(_db.collection("users").document(uid).collection("topics").stream())
    return {"initialized": len(topics) > 0}
