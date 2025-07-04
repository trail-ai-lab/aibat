# app/core/model_registry.py

from app.pipelines.groq_pipeline import GroqPipeline
from app.pipelines.huggingface_pipeline import HuggingFaceBertPipeline
from app.pipelines.gcp_pipeline import GCPPipeline

MODEL_REGISTRY = {
    "groq-llama3": GroqPipeline("llama3-8b-8192"),
    "groq-gemma2": GroqPipeline("gemma2-9b-it"),
    "gcp-palm2": GCPPipeline(),
    "hf-bert": HuggingFaceBertPipeline(),
}

# Optional metadata for dropdown UI
MODEL_METADATA = [
    {"id": "groq-llama3", "name": "Groq - LLaMA3"},
    {"id": "groq-gemma2", "name": "Groq - Gemma2"},
    {"id": "gcp-palm2", "name": "GCP - PaLM 2"},
    {"id": "hf-bert", "name": "HuggingFace - BERT"}
]
