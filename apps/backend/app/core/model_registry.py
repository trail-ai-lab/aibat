# app/core/model_registry.py

from app.pipelines.groq_pipeline import GroqLlama3Pipeline, GroqMistralPipeline
from app.pipelines.huggingface_pipeline import HuggingFaceBertPipeline
from app.pipelines.gcp_pipeline import GCPPipeline

# LangGraph-compatible model interfaces
MODEL_REGISTRY = {
    "groq-llama3": GroqLlama3Pipeline(),
    "groq-mistral": GroqMistralPipeline(),
    "gcp-palm2": GCPPipeline(),
    "hf-bert": HuggingFaceBertPipeline(),
}

# Optional metadata for dropdown UI
MODEL_METADATA = [
    {"id": "groq-llama3", "name": "Groq - LLaMA3"},
    {"id": "groq-mistral", "name": "Groq - Mistral"},
    {"id": "gcp-palm2", "name": "GCP - PaLM 2"},
    {"id": "hf-bert", "name": "HuggingFace - BERT"}
]
