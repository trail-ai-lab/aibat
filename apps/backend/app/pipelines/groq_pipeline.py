# app/pipelines/groq_pipeline.py

import os
import requests
from typing import Optional

class GroqPipeline:
    def __init__(self, model: str):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = model
        
    def grade(self, statement: str, topic_prompt: Optional[str] = None) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        instruction = f"{topic_prompt} {statement}" if topic_prompt else f"Is this statement acceptable or unacceptable? {statement}"

        messages = [
            {
                "role": "system",
                "content": "Always only answer with 'acceptable' or 'unacceptable'. Do not provide any explanation or additional text."
            },
            {
                "role": "user",
                "content": instruction
            }
        ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 10,
            "temperature": 0.6,
            "top_p": 0.9,
        }

        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            prediction = result["choices"][0]["message"]["content"].strip().lower()

            # Handle known outputs explicitly
            if prediction == "acceptable":
                return "acceptable"
            elif prediction == "unacceptable":
                return "unacceptable"
            else:
                print(f"Unexpected model response: '{prediction}'")
                return "unknown"
        except requests.exceptions.RequestException as e:
            print(f"Error calling Groq API: {e}")
            return "unknown"
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response: {e}")
            return "unknown"


    def custom_perturb(self, prompt: str) -> str:
        return f"{self.model}: {prompt}"
