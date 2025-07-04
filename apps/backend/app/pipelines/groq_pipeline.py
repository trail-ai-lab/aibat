# app/pipelines/groq_pipeline.py

import os
import requests
import json
from typing import Optional

class GroqLlama3Pipeline:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama3-8b-8192"
        
    def grade(self, statement: str, topic_prompt: Optional[str] = None) -> str:
        """
        Grade a statement using Groq's LLaMA3 model.
        Returns either "acceptable" or "unacceptable".
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Construct the grading prompt similar to the old project
        if topic_prompt:
            instruction = f"{topic_prompt} {statement}"
        else:
            instruction = f"Is this statement acceptable or unacceptable? {statement}"
        
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
            "max_tokens": 10,  # We only need a short response
            "temperature": 0.6,
            "top_p": 0.9,
            "stop": None
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            prediction = result["choices"][0]["message"]["content"].strip().lower()
            
            # Ensure we return only acceptable or unacceptable
            if "acceptable" in prediction and "unacceptable" not in prediction:
                return "acceptable"
            elif "unacceptable" in prediction:
                return "unacceptable"
            else:
                # Default to unacceptable if unclear
                return "unacceptable"
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling Groq API: {e}")
            # Return a default value in case of API error
            return "unacceptable"
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response: {e}")
            return "unacceptable"

    def custom_perturb(self, prompt):
        return f"groq-llama3: {prompt}"


class GroqMistralPipeline:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "mixtral-8x7b-32768"
        
    def grade(self, statement: str, topic_prompt: Optional[str] = None) -> str:
        """
        Grade a statement using Groq's Mistral model.
        Returns either "acceptable" or "unacceptable".
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Construct the grading prompt similar to the old project
        if topic_prompt:
            instruction = f"{topic_prompt} {statement}"
        else:
            instruction = f"Is this statement acceptable or unacceptable? {statement}"
        
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
            "max_tokens": 10,  # We only need a short response
            "temperature": 0.6,
            "top_p": 0.9,
            "stop": None
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            prediction = result["choices"][0]["message"]["content"].strip().lower()
            
            # Ensure we return only acceptable or unacceptable
            if "acceptable" in prediction and "unacceptable" not in prediction:
                return "acceptable"
            elif "unacceptable" in prediction:
                return "unacceptable"
            else:
                # Default to unacceptable if unclear
                return "unacceptable"
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling Groq API: {e}")
            # Return a default value in case of API error
            return "unacceptable"
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response: {e}")
            return "unacceptable"

    def custom_perturb(self, prompt):
        return f"groq-mistral: {prompt}"