from pydantic import BaseModel
from typing import Optional, Literal

class TestSample(BaseModel):
    """Model for individual test samples"""
    id: Optional[str] = None
    topic: str
    input: str  # The test sentence/statement
    output: Literal["acceptable", "unacceptable"]  # Ground truth
    label: Literal["pass", "fail"]  # AI assessment result
    labeler: str = "adatest_default"
    description: Optional[str] = ""
    author: Optional[str] = ""
    model_score: Optional[str] = ""

class TestResponse(BaseModel):
    """Response model for test data"""
    id: str
    topic: str
    statement: str  # The input field renamed for frontend clarity
    ground_truth: Literal["acceptable", "unacceptable"]
    your_assessment: Literal["ungraded", "acceptable", "unacceptable"]
    ai_assessment: Literal["pass", "fail", "grading"]
    agreement: Optional[bool] = None  # Whether AI assessment matches ground truth
    labeler: str
    description: Optional[str] = ""
    author: Optional[str] = ""
    model_score: Optional[str] = ""
    is_builtin: Optional[bool] = False

class TopicTestsResponse(BaseModel):
    """Response model for topic-specific tests"""
    topic: str
    total_tests: int
    tests: list[TestResponse]

class CachedAssessment(BaseModel):
    """Model for cached AI assessments"""
    id: Optional[str] = None
    user_id: str
    topic: str
    model_id: str
    test_id: str
    statement: str
    ai_assessment: Literal["pass", "fail"]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None