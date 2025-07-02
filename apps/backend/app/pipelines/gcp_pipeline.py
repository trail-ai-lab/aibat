# app/pipelines/gcp_pipeline.py

class GCPPipeline:
    def grade(self, input, topic=None):
        return "unacceptable"

    def custom_perturb(self, prompt):
        return f"gcp-palm2: {prompt}"
