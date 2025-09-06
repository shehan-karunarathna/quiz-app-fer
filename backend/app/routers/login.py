# app/routers/login.py
from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pymongo.database import Database
from app.models.database import get_db

router = APIRouter()

@router.post("/login")
async def login(
    request: Request,  # ✅ Needed to access session
    username: str = Form(...),
    password: str = Form(...),
    db: Database = Depends(get_db)
):
    student = db.students.find_one({"username": username})

    if not student or student["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # ✅ Store user ID and name in session
    request.session["user_id"] = student["user_id"]
    request.session["name"] = student["name"]

    return {
        "status": "success",
        "user_id": student["user_id"],
        "name": student["name"]
    }
