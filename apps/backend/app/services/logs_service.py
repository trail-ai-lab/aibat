# app/services/logs_service.py

import os
import csv
from datetime import datetime
from uuid import uuid4
from app.core.firebase_client import db as _db


def log_action(uid: str, body):
    log_id = uuid4().hex
    log_entry = {
        "id": log_id,
        "test_ids": body.test_ids,
        "action": body.action,
        "timestamp": datetime.utcnow().isoformat()
    }
    _db.collection("users").document(uid).collection("logs").document(log_id).set(log_entry)
    return {"message": "Log successfully added!"}


def save_log(uid: str, name: str):
    save_dir = os.path.join(os.getcwd(), "logs", f"{name}_{uid}")
    os.makedirs(save_dir, exist_ok=True)

    # Export logs
    logs_ref = _db.collection("users").document(uid).collection("logs")
    logs = [doc.to_dict() for doc in logs_ref.stream()]
    with open(os.path.join(save_dir, "log.csv"), mode="w", newline='') as file:
        writer = csv.DictWriter(file, fieldnames=["id", "test_ids", "action", "timestamp"])
        writer.writeheader()
        writer.writerows(logs)

    # Export tests
    tests_ref = _db.collection("users").document(uid).collection("tests")
    tests = [doc.to_dict() for doc in tests_ref.stream()]
    with open(os.path.join(save_dir, "tests.csv"), mode="w", newline='') as file:
        writer = csv.DictWriter(file, fieldnames=tests[0].keys() if tests else [])
        writer.writeheader()
        writer.writerows(tests)

    # Export perturbations
    perts_ref = _db.collection("users").document(uid).collection("perturbations")
    perts = [doc.to_dict() for doc in perts_ref.stream()]
    with open(os.path.join(save_dir, "perturbations.csv"), mode="w", newline='') as file:
        writer = csv.DictWriter(file, fieldnames=perts[0].keys() if perts else [])
        writer.writeheader()
        writer.writerows(perts)

    # Clear logs after export
    for doc in logs_ref.stream():
        doc.reference.delete()

    return {"message": "Data saved to CSV successfully!"}


def clear_logs(uid: str):
    logs_ref = _db.collection("users").document(uid).collection("logs")
    for doc in logs_ref.stream():
        doc.reference.delete()
    return {"message": "All logs cleared!"}
