# app/core/criteria_config.py

"""
Centralized configuration for criteria/perturbation types and prompts
"""

# Default criteria configurations (what we call "criteria" in UI, "perturbations" in backend)
DEFAULT_CRITERIA_CONFIGS = {
    "AIBAT": ["spelling", "negation", "synonyms", "paraphrase", "acronyms", "antonyms", "spanish"],
    "Mini-AIBAT": ["spelling", "synonyms", "paraphrase", "acronyms", "spanish"],
    "M-AIBAT": ["spanish", "spanglish", "english", "nouns", "spelling", "cognates", "dialect", "loan_word"],
    "Large-AIBAT": ["spelling", "negation", "synonyms", "paraphrase", "acronyms", "antonyms", "spanish", "spanglish", "english", "nouns", "cognates", "dialect", "loan_word", "colloquial"]
}

# Prompts for perturbation generation (used in analyze AI behavior)
PERTURBATION_PROMPTS = {
    "spelling": "Introduce minor spelling errors or typos in this text while keeping the meaning clear",
    "negation": "Add negation words (like 'not', 'never', 'no') to change the meaning of this text",
    "synonyms": "Replace key words with synonyms in this text while maintaining the same meaning",
    "paraphrase": "Rephrase this text using different words while maintaining the same meaning",
    "acronyms": "Replace words with their acronyms or expand acronyms to full words in this text",
    "antonyms": "Replace key words with their antonyms to change the meaning of this text",
    "spanish": "Translate key words or phrases in this text to Spanish while keeping the rest in English",
    "spanglish": "Mix English and Spanish words naturally in this text",
    "english": "Translate this text to clear English while maintaining the meaning",
    "nouns": "Replace the nouns in this text with similar nouns while keeping the structure",
    "cognates": "Replace words with cognates (similar-sounding words from other languages) in this text",
    "dialect": "Rewrite this text using a different dialect or regional variation",
    "loan_word": "Incorporate loanwords (words borrowed from other languages) into this text",
    "colloquial": "Rewrite this text using colloquial or informal language"
}

# Prompts for statement generation (used in generate statements)
GENERATION_PROMPTS = {
    "base": "Generate new test statements similar to the examples provided. Create variations that test the same concept but with different wording or context.",
    "paraphrase": "Generate paraphrased versions of the example statements using different words but maintaining the same meaning.",
    "synonyms": "Generate new statements by replacing key words with synonyms in the example statements.",
    "antonyms": "Generate new statements by replacing key words with antonyms to create opposite meanings from the examples.",
    "negation": "Generate new statements by adding negation (like 'not') to make the statements express the opposite of the examples.",
    "spanish": "Generate Spanish translations or Spanish versions of similar statements to the examples.",
    "english": "Generate English versions or translations of similar statements to the examples.",
    "spanglish": "Generate Spanglish (mixed English-Spanish) versions of similar statements to the examples.",
    "nouns": "Generate new statements by changing only the nouns in the example statements while keeping the structure.",
    "cognates": "Generate new statements using cognates (words that sound similar in different languages) based on the examples.",
    "colloquial": "Generate new statements using colloquial or informal language based on the examples.",
    "loan_word": "Generate new statements incorporating loanwords (words borrowed from other languages) based on the examples.",
    "dialect": "Generate new statements using different dialects or regional variations based on the examples."
}

# Criteria types that typically flip the label (change acceptable to unacceptable and vice versa)
LABEL_FLIPPING_CRITERIA = ["negation", "antonyms"]

def get_default_criteria_configs():
    result = []
    for config_name, types in DEFAULT_CRITERIA_CONFIGS.items():
        result.append({
            "config": config_name,
            "types": [
                {
                    "name": t,
                    "prompt": PERTURBATION_PROMPTS.get(t, "No prompt defined")
                } for t in types
            ]
        })
    return result

def get_criteria_prompt(criteria_name: str, for_generation: bool = False):
    """
    Get the appropriate prompt for a criteria type
    
    Args:
        criteria_name: Name of the criteria type
        for_generation: If True, return generation prompt; if False, return perturbation prompt
    
    Returns:
        The prompt string for the criteria
    """
    if for_generation:
        return GENERATION_PROMPTS.get(criteria_name, f"Generate new statements based on {criteria_name}")
    else:
        return PERTURBATION_PROMPTS.get(criteria_name, f"Apply {criteria_name} perturbation to this text")

def should_flip_label(criteria_name: str):
    """
    Check if a criteria type should flip the label (acceptable <-> unacceptable)
    """
    return criteria_name in LABEL_FLIPPING_CRITERIA