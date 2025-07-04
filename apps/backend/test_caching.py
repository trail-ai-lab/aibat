#!/usr/bin/env python3
"""
Simple test script to verify the AI assessment caching system
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.services.assessment_cache_service import (
    cache_assessment,
    get_cached_assessment,
    get_cached_assessments_for_topic,
    cache_multiple_assessments,
    clear_cached_assessments_for_topic_model
)

def test_caching_system():
    """Test the caching system functionality"""
    print("Testing AI Assessment Caching System")
    print("=" * 50)
    
    # Test data
    user_id = "test_user_123"
    topic = "CU0"
    model_id = "groq-llama3"
    test_id = "test_001"
    statement = "This is a test statement"
    ai_assessment = "pass"
    
    # Test 1: Cache a single assessment
    print("Test 1: Caching single assessment...")
    success = cache_assessment(user_id, topic, model_id, test_id, statement, ai_assessment)
    print(f"Cache result: {'SUCCESS' if success else 'FAILED'}")
    
    # Test 2: Retrieve cached assessment
    print("\nTest 2: Retrieving cached assessment...")
    cached_result = get_cached_assessment(user_id, topic, model_id, test_id)
    print(f"Retrieved assessment: {cached_result}")
    print(f"Match: {'SUCCESS' if cached_result == ai_assessment else 'FAILED'}")
    
    # Test 3: Cache multiple assessments
    print("\nTest 3: Caching multiple assessments...")
    multiple_assessments = [
        {"test_id": "test_002", "statement": "Statement 2", "ai_assessment": "fail"},
        {"test_id": "test_003", "statement": "Statement 3", "ai_assessment": "pass"},
        {"test_id": "test_004", "statement": "Statement 4", "ai_assessment": "fail"}
    ]
    cached_count = cache_multiple_assessments(user_id, topic, model_id, multiple_assessments)
    print(f"Cached {cached_count} assessments")
    
    # Test 4: Get all cached assessments for topic
    print("\nTest 4: Getting all cached assessments for topic...")
    all_cached = get_cached_assessments_for_topic(user_id, topic, model_id)
    print(f"Found {len(all_cached)} cached assessments:")
    for test_id, assessment in all_cached.items():
        print(f"  {test_id}: {assessment}")
    
    # Test 5: Test different model (should return empty)
    print("\nTest 5: Testing different model...")
    different_model_cached = get_cached_assessments_for_topic(user_id, topic, "groq-mistral")
    print(f"Found {len(different_model_cached)} cached assessments for different model")
    
    # Test 6: Cache for different model
    print("\nTest 6: Caching for different model...")
    success = cache_assessment(user_id, topic, "groq-mistral", test_id, statement, "fail")
    print(f"Cache result for different model: {'SUCCESS' if success else 'FAILED'}")
    
    # Test 7: Verify separate caches
    print("\nTest 7: Verifying separate caches...")
    llama_cached = get_cached_assessment(user_id, topic, "groq-llama3", test_id)
    mistral_cached = get_cached_assessment(user_id, topic, "groq-mistral", test_id)
    print(f"Llama assessment: {llama_cached}")
    print(f"Mistral assessment: {mistral_cached}")
    print(f"Different assessments: {'SUCCESS' if llama_cached != mistral_cached else 'FAILED'}")
    
    # Test 8: Clear cache for specific model
    print("\nTest 8: Clearing cache for specific model...")
    clear_success = clear_cached_assessments_for_topic_model(user_id, topic, "groq-llama3")
    print(f"Clear result: {'SUCCESS' if clear_success else 'FAILED'}")
    
    # Test 9: Verify cache cleared
    print("\nTest 9: Verifying cache cleared...")
    cleared_cached = get_cached_assessments_for_topic(user_id, topic, "groq-llama3")
    mistral_still_cached = get_cached_assessments_for_topic(user_id, topic, "groq-mistral")
    print(f"Llama cache after clear: {len(cleared_cached)} assessments")
    print(f"Mistral cache after clear: {len(mistral_still_cached)} assessments")
    print(f"Selective clear: {'SUCCESS' if len(cleared_cached) == 0 and len(mistral_still_cached) > 0 else 'FAILED'}")
    
    print("\n" + "=" * 50)
    print("Caching system test completed!")

if __name__ == "__main__":
    test_caching_system()