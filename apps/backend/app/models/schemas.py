from pydantic import BaseModel
from typing import List, Optional, Literal


# ----------- Topic Management -----------

class TopicTestInput(BaseModel):
    test: str
    ground_truth: str

class AddTopicInput(BaseModel):
    topic: str
    prompt_topic: str
    tests: List[TopicTestInput]
    default: bool = False

class DeleteTopicInput(BaseModel):
    topic: str

class TestPromptInput(BaseModel):
    prompt: str
    test: str

class EditTopicInput(BaseModel):
    old_topic: str
    new_topic: str
    prompt: str

# ----------- Test Management -----------

class TestStatement(BaseModel):
    title: str
    ground_truth: str

class AddTestsRequest(BaseModel):
    topic: str
    tests: List[TestStatement]

class DeleteTestsRequest(BaseModel):
    test_ids: List[str]

class GradeTestsRequest(BaseModel):
    test_ids: List[str]

class EditTestRequest(BaseModel):
    id: str
    title: Optional[str] = None
    ground_truth: Optional[str] = None

class EditTestsRequest(BaseModel):
    tests: List[EditTestRequest]

class AssessmentInput(BaseModel):
    test_id: str
    assessment: Literal["acceptable", "unacceptable"]


# ----------- Core Data Models -----------

class TestSample(BaseModel):
    id: Optional[str] = None
    topic: str
    input: str
    output: Literal["acceptable", "unacceptable"]
    label: Literal["pass", "fail"]
    labeler: str = "adatest_default"
    description: Optional[str] = ""
    author: Optional[str] = ""
    model_score: Optional[str] = ""


class TestResponse(BaseModel):
    id: str
    topic: str
    statement: str
    ground_truth: Literal["ungraded", "acceptable", "unacceptable"]
    ai_assessment: Literal["pass", "fail", "grading"]
    agreement: Optional[bool] = None
    labeler: str
    description: Optional[str] = ""
    author: Optional[str] = ""
    model_score: Optional[str] = ""
    is_builtin: Optional[bool] = False


class TopicTestsResponse(BaseModel):
    topic: str
    total_tests: int
    tests: List[TestResponse]


class CachedAssessment(BaseModel):
    id: Optional[str] = None
    user_id: str
    topic: str
    model_id: str
    test_id: str
    statement: str
    ai_assessment: Literal["pass", "fail"]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ----------- LLM Models Management -----------

class ModelSelectInput(BaseModel):
    id: str