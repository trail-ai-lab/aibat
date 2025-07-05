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
