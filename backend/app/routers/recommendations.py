from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from app.models.database import db 
router = APIRouter()



@router.get("/results/{user_id}")
async def get_quiz_results(user_id: int):  # accept as int if you want
    user_id_str = str(user_id)  # convert int to string
    recs = list(db.user_recommendations.find({"user_id": user_id_str}, {"_id": 0}))
    if not recs:
        raise HTTPException(status_code=404, detail="No recommendations found")

    for rec in recs:
        rec["recommendations"] = [rec.pop("recommendation")]
        rec["stress_score"] = rec.pop("avg_stress_score")
    return recs
