# AI Assessment Caching Implementation

## Overview

This implementation adds a comprehensive caching system for AI assessments to avoid redundant processing when users select topics or change models. The system ensures that:

1. **First-time topic selection**: Performs AI grading and saves results in the database
2. **Subsequent topic selections**: Checks cache first, shows cached data if available
3. **Model changes**: Maintains separate caches per model, fetches new assessments when model changes
4. **Efficient storage**: Uses Firestore collections to store cached assessments per user/topic/model combination

## Architecture

### Backend Components

#### 1. Database Schema (`apps/backend/app/models/schemas.py`)
- Added `CachedAssessment` model for storing cached AI assessments
- Includes fields: user_id, topic, model_id, test_id, statement, ai_assessment, timestamps

#### 2. Assessment Cache Service (`apps/backend/app/services/assessment_cache_service.py`)
- `get_cached_assessment()`: Retrieve single cached assessment
- `get_cached_assessments_for_topic()`: Get all cached assessments for topic+model
- `cache_assessment()`: Store single assessment in cache
- `cache_multiple_assessments()`: Bulk cache multiple assessments
- `clear_cached_assessments_for_topic_model()`: Clear cache for specific topic+model

#### 3. Updated Tests Service (`apps/backend/app/services/tests_service.py`)
- Modified `get_tests_by_topic()` to check cache before performing AI grading
- Updated `create_topic()` to cache assessments when creating new topics
- Added `clear_topic_cache()` function for manual cache clearing

#### 4. API Endpoints (`apps/backend/app/api/v1/endpoints/tests.py`)
- Added `POST /api/v1/tests/cache/clear/{topic_name}` endpoint for cache management

### Frontend Components

#### 1. Updated Tests Hook (`apps/frontend/src/hooks/use-tests.ts`)
- Added `modelId` parameter to track current model
- Automatically refetches tests when model changes
- Provides feedback when model changes trigger refetch

#### 2. Updated Dashboard (`apps/frontend/src/app/(protected)/dashboard/page.tsx`)
- Integrates with `useModels` hook to track current model
- Passes current model to `useTests` hook for automatic refetching

#### 3. API Functions (`apps/frontend/src/lib/api/tests.ts`)
- Added `clearTopicCache()` function for manual cache clearing

## Data Flow

### First Time Topic Selection
1. User selects topic from sidebar
2. Frontend calls `fetchTestsByTopic(topic)`
3. Backend checks cache for current user/topic/model combination
4. Cache is empty, so AI grading is performed
5. Results are cached in Firestore `assessment_cache` collection
6. Results are returned to frontend and displayed

### Subsequent Topic Selections (Same Model)
1. User selects same topic again
2. Frontend calls `fetchTestsByTopic(topic)`
3. Backend finds cached assessments for user/topic/model
4. Cached results are returned immediately (no AI processing)
5. Frontend displays cached results

### Model Change
1. User changes model in model selector
2. `useModels` hook updates `selectedModel`
3. `useTests` hook detects model change via `useEffect`
4. Frontend automatically calls `fetchTestsByTopic(topic)` with new model context
5. Backend checks cache for new user/topic/model combination
6. If no cache exists, AI grading is performed with new model
7. New results are cached separately from previous model's cache
8. Results are returned and displayed

## Database Structure

### Firestore Collections
```
users/{userId}/assessment_cache/{cacheId}
{
  user_id: string,
  topic: string,
  model_id: string,
  test_id: string,
  statement: string,
  ai_assessment: "pass" | "fail",
  created_at: timestamp,
  updated_at: timestamp
}
```

### Cache Key Strategy
- Document ID format: `{topic}_{model_id}_{test_id}`
- Ensures unique cache entries per topic/model/test combination
- Allows efficient querying by topic and model

## Benefits

1. **Performance**: Eliminates redundant AI processing for previously assessed topics
2. **Cost Reduction**: Reduces API calls to AI services (Groq, etc.)
3. **User Experience**: Faster loading times for previously visited topics
4. **Model Flexibility**: Separate caches per model allow users to compare different models
5. **Scalability**: Firestore-based storage scales with user base

## Usage Examples

### Scenario 1: User explores topics with Groq Llama
1. Select "CU0" topic → AI grading performed, cached for "groq-llama3"
2. Select "CU5" topic → AI grading performed, cached for "groq-llama3"  
3. Return to "CU0" topic → Cached results shown instantly

### Scenario 2: User changes models
1. Currently viewing "CU0" with "groq-llama3" (cached)
2. Change model to "groq-mistral" → New AI grading performed, cached for "groq-mistral"
3. Change back to "groq-llama3" → Original cached results shown
4. Change to "groq-mistral" → Mistral cached results shown

### Scenario 3: User creates new topic
1. Create topic "My Custom Topic" → AI grading performed during creation
2. Results automatically cached for current model
3. Future visits to topic show cached results

## Testing

A test script is provided at `apps/backend/test_caching.py` to verify:
- Single assessment caching
- Multiple assessment caching
- Cache retrieval
- Model-specific caching
- Cache clearing functionality

Run with: `python apps/backend/test_caching.py`

## Future Enhancements

1. **Cache Expiration**: Add TTL (time-to-live) for cache entries
2. **Cache Statistics**: Track cache hit/miss rates
3. **Bulk Cache Management**: Admin interface for cache management
4. **Cache Warming**: Pre-populate cache for common topics/models
5. **Cache Compression**: Optimize storage for large datasets