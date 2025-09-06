from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware  # ✅ Add this
from app.routers import quiz, recommendations, login, admin_login, analysis

app = FastAPI()

# ✅ Add Session Middleware BEFORE routers
app.add_middleware(SessionMiddleware, secret_key="dev-secret")  # Replace with secure key

# ✅ CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow only your frontend origin in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routers
app.include_router(
    quiz.router,
    prefix="/api/quiz",
    tags=["Quiz"]
)



app.include_router(
    recommendations.router,
    prefix="/api/recommendations",
    tags=["Recommendations"]
)

app.include_router(
    login.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    admin_login.router,
    prefix="/api/admin",
    tags=["Admin"]
)
app.include_router(
    quiz.router,
    prefix="/api/quizzes",
    tags=["Quizzes"]
) 
app.include_router(
    analysis.router,
    prefix="/api/quizzes",
    tags=["Analysis"]
)





# ✅ Health Check Endpoint
@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "working",
        "message": "Service is operational",
        "endpoints": {
            "submit_answer": "/api/quiz/submit-answer",
            "get_recommendations": "/api/recommendations/{user_id}",
            "login": "/api/auth/login",
            "admin_login": "/api/admin/login"

        }
    }
