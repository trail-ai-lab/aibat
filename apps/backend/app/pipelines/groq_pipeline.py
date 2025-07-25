# app/pipelines/groq_pipeline.py

import os
import re
import time
import json
import requests
from typing import Optional, Union

class GroqRateLimiter:
    """Global rate limiter for Groq API - 30 RPM = 1 call every 2 seconds"""
    _last_call_time = 0
    _min_interval = 2.0  # 2 seconds between calls for 30 RPM
    
    @classmethod
    def wait_if_needed(cls):
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        time_since_last = current_time - cls._last_call_time
        
        if time_since_last < cls._min_interval:
            sleep_time = cls._min_interval - time_since_last
            print(f"Rate limiter: waiting {sleep_time:.2f}s before next API call")
            time.sleep(sleep_time)
        
        cls._last_call_time = time.time()

class GroqPipeline:
    def __init__(self, model: str):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = model
        self.rate_limiter = GroqRateLimiter()
    
    def _parse_retry_after(self, error_response: dict) -> float:
        """Parse retry-after time from Groq error response"""
        try:
            error_message = error_response.get("error", {}).get("message", "")
            # Look for "Please try again in XXXms" pattern
            match = re.search(r"try again in (\d+(?:\.\d+)?)ms", error_message)
            if match:
                return float(match.group(1)) / 1000.0  # Convert ms to seconds
        except Exception:
            pass
        return 2.0  # Default fallback
    
    def _make_api_call(self, payload: dict, operation: str) -> Union[dict, None]:
        """Make API call with proper rate limiting and retry logic"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Apply global rate limiting
        self.rate_limiter.wait_if_needed()
        
        try:
            print(f"Making Groq API call for {operation}")
            response = requests.post(self.base_url, headers=headers, json=payload)
            
            if response.status_code == 429:
                # Parse the retry-after time from the error response
                try:
                    error_data = response.json()
                    retry_after = self._parse_retry_after(error_data)
                    print(f"Rate limit hit, retrying after {retry_after}s")
                    time.sleep(retry_after)
                    
                    # Retry once
                    response = requests.post(self.base_url, headers=headers, json=payload)
                except Exception as e:
                    print(f"Error parsing rate limit response: {e}")
                    return None
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error calling Groq API for {operation}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
            return None
        except Exception as e:
            print(f"Unexpected error in API call for {operation}: {e}")
            return None
        
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

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 10,
            "temperature": 0.6,
            "top_p": 0.9,
        }

        result = self._make_api_call(payload, f"grading: {statement[:50]}...")
        
        if result is None:
            print(f"API call failed for grading: {statement[:50]}...")
            return "unknown"
        
        try:
            prediction = result["choices"][0]["message"]["content"].strip().lower()

            # Handle known outputs explicitly
            if prediction == "acceptable":
                print(f"Graded as acceptable: {statement[:50]}...")
                return "acceptable"
            elif prediction == "unacceptable":
                print(f"Graded as unacceptable: {statement[:50]}...")
                return "unacceptable"
            else:
                print(f"Unexpected model response: '{prediction}' for statement: {statement[:50]}...")
                return "unknown"
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response for grading: {e}")
            return "unknown"


    def custom_perturb(self, prompt: str) -> Union[str, None]:
        """
        Generate a perturbed version of text based on the given prompt
        Returns None if perturbation fails
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        messages = [
            {
                "role": "system",
                "content": "You are a text perturbation assistant. Apply the requested transformation to the given text. Only return the transformed text without any explanations or additional commentary."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 150,
            "temperature": 0.7,
            "top_p": 0.9,
        }

        # Extract original text for comparison
        original_text = prompt.split(": ", 1)[-1] if ": " in prompt else prompt

        result = self._make_api_call(payload, f"perturbation: {prompt[:100]}...")
        
        if result is None:
            print(f"API call failed for perturbation: {prompt[:100]}...")
            return None
        
        try:
            perturbed_text = result["choices"][0]["message"]["content"].strip()
            
            # Check if the perturbation actually changed the text
            if perturbed_text == original_text:
                print(f"Warning: Perturbation returned same text as original: {original_text}")
            else:
                print(f"Successfully perturbed: '{original_text}' -> '{perturbed_text}'")
            
            return perturbed_text
            
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response for perturbation: {e}")
            return None

    def batch_perturb(self, prompts: list) -> list:
        """
        Generate multiple perturbations in a single API call for better efficiency
        Returns list of perturbed texts (or None for failures) in the same order as input prompts
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        if not prompts:
            return []
        
        # Create a single prompt that processes all perturbations
        batch_prompt = "Process the following perturbation requests. For each numbered request, apply the specified transformation and return only the transformed text on a new line. Format your response as:\n1. [transformed text 1]\n2. [transformed text 2]\n...\n\nRequests:\n"
        
        for i, prompt in enumerate(prompts, 1):
            batch_prompt += f"{i}. {prompt}\n"

        messages = [
            {
                "role": "system",
                "content": "You are a text perturbation assistant. Process multiple perturbation requests and return only the transformed texts, numbered as requested. Do not provide explanations. Only return the transformed text, and make sure it is different from the original."
            },
            {
                "role": "user",
                "content": batch_prompt
            }
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": min(4000, len(prompts) * 50),  # Estimate tokens needed
            "temperature": 0.7,
            "top_p": 0.9,
        }

        result = self._make_api_call(payload, f"batch perturbation ({len(prompts)} items)")
        
        if result is None:
            print(f"Batch API call failed for {len(prompts)} perturbations")
            return [None] * len(prompts)
        
        try:
            response_text = result["choices"][0]["message"]["content"].strip()
            
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
                    original_text = prompts[i-1].split(": ", 1)[-1] if ": " in prompts[i-1] else prompts[i-1]
                    perturbed_text = response_map[i]
                    
                    if perturbed_text == original_text:
                        print(f"Warning: Batch perturbation {i} returned same text as original")
                    else:
                        print(f"Batch perturbation {i} successful: '{original_text[:30]}...' -> '{perturbed_text[:30]}...'")
                    
                    perturbed_texts.append(perturbed_text)
                else:
                    print(f"Missing response for batch perturbation {i}")
                    perturbed_texts.append(None)
            
            return perturbed_texts
            
        except (KeyError, IndexError) as e:
            print(f"Error parsing batch perturbation response: {e}")
            return [None] * len(prompts)

    def batch_grade(self, statements: list, topic: str) -> list:
        """
        Grade multiple statements in a single API call for better efficiency
        Returns list of grades ("acceptable"/"unacceptable"/"unknown") in the same order as input
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        if not statements:
            return []
        
        # Create a single prompt that processes all gradings
        batch_prompt = f"Grade the following statements as 'acceptable' or 'unacceptable' for the topic: {topic}\n\nFormat your response as:\n1. acceptable/unacceptable\n2. acceptable/unacceptable\n...\n\nStatements to grade:\n"
        
        for i, statement in enumerate(statements, 1):
            batch_prompt += f"{i}. {statement}\n"

        messages = [
            {
                "role": "system",
                "content": "Grade each statement as 'acceptable' or 'unacceptable'. Return only the grades in numbered format. Do not provide explanations."
            },
            {
                "role": "user",
                "content": batch_prompt
            }
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": min(1000, len(statements) * 10),  # Estimate tokens needed
            "temperature": 0.6,
            "top_p": 0.9,
        }

        result = self._make_api_call(payload, f"batch grading ({len(statements)} items)")
        
        if result is None:
            print(f"Batch grading API call failed for {len(statements)} statements")
            return ["unknown"] * len(statements)
        
        try:
            response_text = result["choices"][0]["message"]["content"].strip()
            
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
                    grade = grade_map[i]
                    print(f"Batch graded statement {i} as {grade}: '{statements[i-1][:50]}...'")
                    grades.append(grade)
                else:
                    print(f"Missing or invalid grade for statement {i}: '{statements[i-1][:50]}...'")
                    grades.append("unknown")
            
            return grades
            
        except (KeyError, IndexError) as e:
            print(f"Error parsing batch grading response: {e}")
            return ["unknown"] * len(statements)
    
    def generate(self, existing_statements: list, topic_prompt: str, criteria: str = "base", num_statements: int = 5) -> list:
        """
        Generate new statements based on existing statements and criteria
        Similar to the old LlamaGeneratorPipeline implementation
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Prepare the context from existing statements
        context_statements = "\n".join([f"- {stmt}" for stmt in existing_statements[:10]])  # Use up to 10 examples
        
        # Define criteria prompts similar to the old implementation
        criteria_prompts = {
            'base': "Generate new test statements similar to the examples provided. Create variations that test the same concept but with different wording or context.",
            'paraphrase': "Generate paraphrased versions of the example statements using different words but maintaining the same meaning.",
            'synonyms': "Generate new statements by replacing key words with synonyms in the example statements.",
            'antonyms': "Generate new statements by replacing key words with antonyms to create opposite meanings from the examples.",
            'negation': "Generate new statements by adding negation (like 'not') to make the statements express the opposite of the examples.",
            'spanish': "Generate Spanish translations or Spanish versions of similar statements to the examples.",
            'english': "Generate English versions or translations of similar statements to the examples.",
            'spanglish': "Generate Spanglish (mixed English-Spanish) versions of similar statements to the examples.",
            'nouns': "Generate new statements by changing only the nouns in the example statements while keeping the structure.",
            'cognates': "Generate new statements using cognates (words that sound similar in different languages) based on the examples.",
            'colloquial': "Generate new statements using colloquial or informal language based on the examples.",
            'loan_word': "Generate new statements incorporating loanwords (words borrowed from other languages) based on the examples.",
            'dialect': "Generate new statements using different dialects or regional variations based on the examples."
        }
        
        # Get the appropriate prompt for the criteria
        generation_instruction = criteria_prompts.get(criteria, criteria_prompts['base'])
        
        # Construct the full prompt
        full_prompt = f"""Based on the following topic and example statements, {generation_instruction}

Topic Context: {topic_prompt}

Example Statements:
{context_statements}

Generate {num_statements} new statements that are similar in style and content to the examples. Each statement should be on a new line and start with a number (1., 2., etc.). Do not include explanations or additional text."""

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that generates test statements. Only provide the requested statements, one per line, numbered. Do not include explanations or additional commentary."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
            "top_p": 0.9,
        }

        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            generated_text = result["choices"][0]["message"]["content"].strip()
            
            # Parse the generated statements
            statements = []
            lines = generated_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    # Remove numbering and clean up
                    clean_statement = line
                    # Remove common prefixes like "1.", "2.", "-", "•", etc.
                    import re
                    clean_statement = re.sub(r'^\d+\.\s*', '', clean_statement)
                    clean_statement = re.sub(r'^[-•]\s*', '', clean_statement)
                    clean_statement = clean_statement.strip()
                    
                    if clean_statement and len(clean_statement) > 10:  # Basic quality filter
                        statements.append(clean_statement)
            
            # Ensure we don't return more than requested
            return statements[:num_statements]
            
        except requests.exceptions.RequestException as e:
            print(f"Error calling Groq API for generation: {e}")
            return []
        except (KeyError, IndexError) as e:
            print(f"Error parsing Groq API response for generation: {e}")
            return []
