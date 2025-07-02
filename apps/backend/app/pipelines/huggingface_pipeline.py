# app/pipelines/huggingface_pipeline.py

class HuggingFaceBertPipeline:
    def grade(self, input, topic=None):
        return "acceptable"

    def custom_perturb(self, prompt):
        return f"hf-bert: {prompt}"
