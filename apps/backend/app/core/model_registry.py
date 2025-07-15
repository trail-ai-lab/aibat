# app/core/model_registry.py

from app.pipelines.groq_pipeline import GroqPipeline
from app.pipelines.gcp_pipeline import GCPPipeline
from app.core.model_config import DEFAULT_MODEL_ID

MODEL_REGISTRY = {
    "groq-llama3": GroqPipeline("llama3-8b-8192"),
    "groq-gemma2": GroqPipeline("gemma2-9b-it"),
    # "gcp-gemini-2.5-flash": GCPPipeline("gemini-2.5-flash")
}

MODEL_METADATA = [
    {"id": "groq-llama3", "name": "Groq - LLaMA3"},
    {"id": "groq-gemma2", "name": "Groq - Gemma2"},
    # {"id": "gcp-gemini-2.5-flash", "name": "GCP - Gemini 2.5 Flash"}
]

def get_model_metadata_by_id(model_id: str) -> dict:
    return next((m for m in MODEL_METADATA if m["id"] == model_id), None)

def get_default_model_metadata() -> dict:
    return get_model_metadata_by_id(DEFAULT_MODEL_ID) or MODEL_METADATA[0]
