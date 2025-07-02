# app/core/firebase_client.py
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Only initialize once
if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"]))
    firebase_admin.initialize_app(cred)

# Global Firestore client
db = firestore.client()
