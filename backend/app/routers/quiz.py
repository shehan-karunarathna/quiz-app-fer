from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from pymongo.database import Database
from app.models.database import get_db
from app.services.fer_service import EmotionCapture

router = APIRouter()
emotion_capture = EmotionCapture()

# ——— Models ———
class QuizCreate(BaseModel):
    title: str
    question_count: int   # ✅ Add target question count


class QuestionIn(BaseModel):
    text: str
    options: Dict[str, str]
    correct: str
    topic: str


class QuestionOut(BaseModel):
    questionId: int
    text: str
    options: Dict[str, str]
    correct: str
    topic: str


class QuizOut(BaseModel):
    quizId: int
    title: str
    createdAt: datetime
    questions: List[QuestionOut]
    question_count: Optional[int] = None


# ——— 1) Create a new quiz ———
@router.post("", response_model=dict, tags=["Quizzes"])
@router.post("/", response_model=dict, tags=["Quizzes"])
def create_quiz(payload: QuizCreate, db: Database = Depends(get_db)):
    # auto-increment quizId
    last = db.quizzes.find_one(sort=[("quizId", -1)])
    next_id = (last["quizId"] if last else 0) + 1

    quiz_doc = {
        "quizId": next_id,
        "title": payload.title,
        "question_count": payload.question_count,   # ✅ store count
        "createdAt": datetime.utcnow(),
        "questions": []
    }
    db.quizzes.insert_one(quiz_doc)
    return {"quizId": next_id}


# ——— 2) Add a question to an existing quiz ———
@router.post("/{quiz_id}/questions", tags=["Quizzes"])
@router.post("/{quiz_id}/questions/", tags=["Quizzes"])
def add_question(quiz_id: int, payload: QuestionIn, db: Database = Depends(get_db)):
    quiz = db.quizzes.find_one({"quizId": quiz_id})
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    qlist = quiz.get("questions", [])
    next_qid = (qlist[-1]["questionId"] if qlist else 0) + 1

    qdoc = {
        "questionId": next_qid,
        "text": payload.text,
        "options": payload.options,
        "correct": payload.correct,
        "topic": payload.topic
    }

    db.quizzes.update_one(
        {"quizId": quiz_id},
        {"$push": {"questions": qdoc}}
    )
    return {"questionId": next_qid}


# ——— 3) List all quizzes ———
@router.get("", response_model=List[QuizOut], tags=["Quizzes"])
@router.get("/", response_model=List[QuizOut], tags=["Quizzes"])
def list_quizzes(db: Database = Depends(get_db)):
    docs = db.quizzes.find({}, {"_id": 0})
    return list(docs)


# ——— 4) Get one quiz by ID ———
@router.get("/{quiz_id}", response_model=QuizOut, tags=["Quizzes"])
@router.get("/{quiz_id}/", response_model=QuizOut, tags=["Quizzes"])
def get_quiz(quiz_id: int, db: Database = Depends(get_db)):
    quiz = db.quizzes.find_one({"quizId": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    # ✅ Safety: if old quizzes don’t have question_count, fallback to len(questions)
    if "question_count" not in quiz:
        quiz["question_count"] = len(quiz.get("questions", []))

    return quiz


# ——— 5) Submit answer (FER service integration) ———
@router.post("/submit-answer", tags=["Quizzes"])
async def submit_answer(
    quiz_id: int = Form(...),
    user_id: str = Form(...),
    question_id: int = Form(...),
    selected_answer: str = Form(...),
    is_correct: bool = Form(...),
    topic: str = Form(...),
    images: List[UploadFile] = File(...),
    time_taken: int = Form(...),
    db: Database = Depends(get_db)
):
    all_emotions = []
    for img in images:
        contents = await img.read()
        ems = emotion_capture.capture_emotions(contents)
        if not isinstance(ems, list):
            raise HTTPException(500, "Invalid emotion format")
        all_emotions.extend(ems)

    if not all_emotions:
        raise HTTPException(400, "No emotions detected")

    dominant = max(all_emotions, key=lambda e: e["confidence"])
    record = {
        "quiz_id": quiz_id,
        "user_id": user_id,
        "question_id": question_id,
        "selected_answer": selected_answer,
        "is_correct": is_correct,
        "topic": topic,
        "time_taken": time_taken,
        "emotion_samples": len(images),
        "averaged_emotions": all_emotions,
        "dominant_emotion": dominant,
        "timestamp": datetime.utcnow(),
        "analysis_metadata": {"model": "VGG-FER", "processing_time_ms": 1400}
    }
    db.responses.insert_one(record)
    return {
        "status": "success",
        "dominant_emotion": dominant,
        "sample_size": len(images)
    }


@router.get("/results/{user_id}")
def get_user_results(user_id: str, db: Database = Depends(get_db)):
    scores = list(db.stress_scores.find({"user_id": user_id}))
    recommendations = list(db.user_recommendations.find({"user_id": user_id}))

    results = []
    for score in scores:
        rec = next((r for r in recommendations if r["quiz_id"] == score["quiz_id"]), {})
        results.append({
            "quiz_id": score["quiz_id"],
            "stress_score": score["stress_score"],
            "recommendations": rec.get("recommendations", [])
        })

    return results

