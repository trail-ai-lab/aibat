# app/pipelines/groq_pipeline.py

class GroqLlama3Pipeline:
    def grade(self, input, topic=None):
        return "acceptable"

    def custom_perturb(self, prompt):
        return f"groq-llama3: {prompt}"


class GroqMistralPipeline:
    def grade(self, input, topic=None):
        return "unacceptable"

    def custom_perturb(self, prompt):
        return f"groq-mistral: {prompt}"