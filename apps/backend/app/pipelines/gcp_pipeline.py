# app/pipelines/gcp_pipeline.py

import os
import json
import tempfile
from typing import Optional, Union
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

    def custom_perturb(self, prompt: str) -> Union[str, None]:
        """
        Generate a perturbed version of text based on the given prompt
        """
        # Check if credentials are properly set up
        if not self.credentials_set or not self.model:
            print("GCP credentials not properly configured, returning None")
            return None
            
        try:
            # System message to ensure the model applies the transformation correctly
            system_message = "You are a text perturbation assistant. Apply the requested transformation to the given text. Only return the transformed text without any explanations or additional commentary."
            
            # Combine system message with user prompt
            full_prompt = f"{system_message}\n\n{prompt}"
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": 150,
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            )
            
            # Extract and return the perturbed text
            perturbed_text = response.text.strip()
            return perturbed_text
            
        except Exception as e:
            print(f"Error calling Vertex AI API for perturbation: {e}")
            return None

    def batch_perturb(self, prompts: list) -> list:
        """
        Generate multiple perturbations in a single API call for better efficiency
        Returns list of perturbed texts (or None for failures) in the same order as input prompts
        """
        if not self.credentials_set or not self.model:
            print("GCP credentials not properly configured for batch perturbation")
            return [None] * len(prompts)
        
        if not prompts:
            return []
        
        try:
            # Create a single prompt that processes all perturbations
            batch_prompt = "Process the following perturbation requests. For each numbered request, apply the specified transformation and return only the transformed text on a new line. Format your response as:\n1. [transformed text 1]\n2. [transformed text 2]\n...\n\nRequests:\n"
            
            for i, prompt in enumerate(prompts, 1):
                batch_prompt += f"{i}. {prompt}\n"

            # System message
            system_message = "You are a text perturbation assistant. Process multiple perturbation requests and return only the transformed texts, numbered as requested. Do not provide explanations."
            
            # Combine system message with user prompt
            full_prompt = f"{system_message}\n\n{batch_prompt}"
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": min(4000, len(prompts) * 50),
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            )
            
            response_text = response.text.strip()
            
            # Parse the numbered responses
            perturbed_texts = []
            lines = response_text.split('\n')
            
            # Create a mapping of line numbers to responses
            response_map = {}
            for line in lines:
                line = line.strip()
                if line and line[0].isdigit():
                    # Extract number and text
                    parts = line.split('.', 1)
                    if len(parts) == 2:
                        try:
                            num = int(parts[0].strip())
                            text = parts[1].strip()
                            response_map[num] = text
                        except ValueError:
                            continue
            
            # Build results in the correct order
            for i in range(1, len(prompts) + 1):
                if i in response_map:
                    perturbed_texts.append(response_map[i])
                else:
                    print(f"Missing response for batch perturbation {i}")
                    perturbed_texts.append(None)
            
            return perturbed_texts
            
        except Exception as e:
            print(f"Error in GCP batch perturbation: {e}")
            return [None] * len(prompts)

    def batch_grade(self, statements: list, topic: str) -> list:
        """
        Grade multiple statements in a single API call for better efficiency
        Returns list of grades ("acceptable"/"unacceptable"/"unknown") in the same order as input
        """
        if not self.credentials_set or not self.model:
            print("GCP credentials not properly configured for batch grading")
            return ["unknown"] * len(statements)
        
        if not statements:
            return []
        
        try:
            # Create a single prompt that processes all gradings
            batch_prompt = f"Grade the following statements as 'acceptable' or 'unacceptable' for the topic: {topic}\n\nFormat your response as:\n1. acceptable/unacceptable\n2. acceptable/unacceptable\n...\n\nStatements to grade:\n"
            
            for i, statement in enumerate(statements, 1):
                batch_prompt += f"{i}. {statement}\n"

            # System message
            system_message = "Grade each statement as 'acceptable' or 'unacceptable'. Return only the grades in numbered format. Do not provide explanations."
            
            # Combine system message with user prompt
            full_prompt = f"{system_message}\n\n{batch_prompt}"
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": min(1000, len(statements) * 10),
                    "temperature": 0.6,
                    "top_p": 0.9,
                }
            )
            
            response_text = response.text.strip()
            
            # Parse the numbered responses
            grades = []
            lines = response_text.split('\n')
            
            # Create a mapping of line numbers to grades
            grade_map = {}
            for line in lines:
                line = line.strip()
                if line and line[0].isdigit():
                    # Extract number and grade
                    parts = line.split('.', 1)
                    if len(parts) == 2:
                        try:
                            num = int(parts[0].strip())
                            grade = parts[1].strip().lower()
                            if grade in ["acceptable", "unacceptable"]:
                                grade_map[num] = grade
                        except ValueError:
                            continue
            
            # Build results in the correct order
            for i in range(1, len(statements) + 1):
                if i in grade_map:
                    grades.append(grade_map[i])
                else:
                    print(f"Missing or invalid grade for statement {i}")
                    grades.append("unknown")
            
            return grades
            
        except Exception as e:
            print(f"Error in GCP batch grading: {e}")
            return ["unknown"] * len(statements)
