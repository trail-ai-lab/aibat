# app/core/model_registry.py

from app.pipelines.groq_pipeline import GroqPipeline
from app.pipelines.gcp_pipeline import GCPPipeline

MODEL_REGISTRY = {
    "groq-llama3": GroqPipeline("llama3-8b-8192"),
    "groq-gemma2": GroqPipeline("gemma2-9b-it"),
    "gcp-gemini-2.5-flash": GCPPipeline("gemini-2.5-flash")
}

# Optional metadata for dropdown UI
MODEL_METADATA = [
    {"id": "groq-llama3", "name": "Groq - LLaMA3"},
    {"id": "groq-gemma2", "name": "Groq - Gemma2"},
    {"id": "gcp-gemini-2.5-flash", "name": "GCP - Gemini 2.5 Flash"}
]
