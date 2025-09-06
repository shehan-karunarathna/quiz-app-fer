
from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pymongo.database import Database
from app.models.database import get_db

router = APIRouter()

@router.post("/login")
async def admin_login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Database = Depends(get_db)
):
    lecturer = db.lecturers.find_one({"email": email})

    if not lecturer or lecturer["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ Store lecturer ID and name in session
    request.session["lecturer_id"] = str(lecturer["_id"])  # use _id as lecturer_id
    request.session["name"] = lecturer["name"]

    return {
        "status": "success",
        "lecturer_id": str(lecturer["_id"]),
        "name": lecturer["name"]
    }
