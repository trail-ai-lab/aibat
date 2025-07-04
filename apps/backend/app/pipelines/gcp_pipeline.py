# app/pipelines/gcp_pipeline.py

import os
import json
import tempfile
from typing import Optional
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel
import vertexai

class GCPPipeline:
    def __init__(self, model: str = "gemini-2.5-flash"):
        # Initialize Vertex AI
        self.model_name = model
        self.project_id = "aibat-c447f"  # From the credentials
        self.location = "us-central1"  # Default location for Vertex AI
        self.model = None
        self.credentials_set = False
        
        # Set up credentials from environment variable
        self._setup_credentials()
        
    def _setup_credentials(self):
        """Set up Google Cloud credentials from environment variable"""
        try:
            credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            if credentials_json:
                # Parse the JSON credentials
                credentials_dict = json.loads(credentials_json)
                self.project_id = credentials_dict.get("project_id", self.project_id)
                
                # Create a temporary file with the credentials
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                    json.dump(credentials_dict, temp_file)
                    temp_credentials_path = temp_file.name
                
                # Set the environment variable for Google Cloud authentication
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_credentials_path
                
                # Initialize Vertex AI
                vertexai.init(project=self.project_id, location=self.location)
                
                # Initialize the generative model
                self.model = GenerativeModel(self.model_name)
                self.credentials_set = True
                print(f"Successfully initialized GCP pipeline with model {self.model_name}")
                
            else:
                print("Warning: GOOGLE_APPLICATION_CREDENTIALS_JSON not found in environment variables")
                
        except Exception as e:
            print(f"Error setting up GCP credentials: {e}")
            self.credentials_set = False
        
    def grade(self, statement: str, topic_prompt: Optional[str] = None) -> str:
        # Check if credentials are properly set up
        if not self.credentials_set or not self.model:
            print("GCP credentials not properly configured, returning unknown")
            return "unknown"
            
        try:
            # Construct the prompt
            if topic_prompt:
                instruction = f"{topic_prompt} {statement}"
            else:
                instruction = f"Is this statement acceptable or unacceptable? {statement}"
            
            # System message to ensure consistent output
            system_message = "Always only answer with 'acceptable' or 'unacceptable'. Do not provide any explanation or additional text."
            
            # Combine system message with user instruction
            full_prompt = f"{system_message}\n\n{instruction}"
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": 10,
                    "temperature": 0.6,
                    "top_p": 0.9,
                }
            )
            
            # Extract and process the response
            prediction = response.text.strip().lower()
            
            # Handle known outputs explicitly
            if prediction == "acceptable":
                return "acceptable"
            elif prediction == "unacceptable":
                return "unacceptable"
            else:
                print(f"Unexpected model response: '{prediction}'")
                return "unknown"
                
        except Exception as e:
            print(f"Error calling Vertex AI API: {e}")
            return "unknown"

    def custom_perturb(self, prompt: str) -> str:
        return f"{self.model_name}: {prompt}"
