from pydantic import BaseModel 
from typing import List, Dict

class Emotion(BaseModel):
    label: str
    confidence: float

class QuizResponseCreate(BaseModel):
    user_id: int
    question_id: int
    selected_answer: str
    is_correct: bool
    topic: str

class QuizResponse(QuizResponseCreate):
    emotions: List[Emotion]
    image_path: str
    timestamp: str

class Recommendation(BaseModel):
    topic: str
    message: str
    severity: str