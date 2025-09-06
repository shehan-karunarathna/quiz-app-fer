# app/routers/analysis.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models.database import db

import os, json, joblib
import numpy as np
import pandas as pd

router = APIRouter()

# ---------------------------
# Model artifacts
# ---------------------------
ARTIFACT_DIR = os.environ.get("MODEL_ARTIFACT_DIR", "app/model_artifacts")
MODEL_PATH    = os.path.join(ARTIFACT_DIR, "quiz_reco_logreg.joblib")
META_PATH      = os.path.join(ARTIFACT_DIR, "metadata.json")

if not os.path.exists(MODEL_PATH):
      raise RuntimeError(f"Model not found at: {MODEL_PATH}. Did you copy artifacts?")
if not os.path.exists(META_PATH):
      raise RuntimeError(f"Metadata not found at: {META_PATH}")

# Load model + metadata once at import
model = joblib.load(MODEL_PATH)
with open(META_PATH, "r", encoding="utf-8") as f:
      metadata = json.load(f)

# metadata.json uses "labels"
LABELS = metadata.get("labels", [
      "BALANCED_IMPROVEMENT_NEEDED",
      "HIGH_CONTENT_GAP",
      "LOW_STRESS_GOOD_PROGRESS",
])
NUM_FEATURES = metadata.get(
      "num_features",
      ["avg_stress", "wrong_ratio", "avg_time", "time_over_15_ratio", "neg_emotion_ratio"]
)
CAT_FEATURES = metadata.get("cat_features", ["dominant_emotion"])

# ---------------------------
# Scoring constants
# ---------------------------
EMOTION_WEIGHTS = {
      "neutral": 1, "happy": 0, "sad": 3, "angry": 4,
      "fear": 5, "surprise": 0, "disgust": 4
}
NEG_EMOTIONS = {"sad", "angry", "fear", "disgust"}

LABEL_HEADLINE = {
      "LOW_STRESS_GOOD_PROGRESS": "Low stress and steady accuracy — great trajectory.",
      "BALANCED_IMPROVEMENT_NEEDED": "Balanced progress — a bit more speed and accuracy will help.",
      "HIGH_CONTENT_GAP": "Content gaps detected — focus on core concepts and guided practice.",
}

# ---------------------------
# Feature aggregation per (quiz, user)
# ---------------------------
def aggregate_user_quiz_features(quiz_id: int, user_id: str) -> Dict[str, Any]:
      attempts = list(db.responses.find({"quiz_id": quiz_id, "user_id": user_id}))
      if not attempts:
            return {}

      total = len(attempts)
      wrong = 0
      total_time = 0.0
      over15 = 0
      neg_count = 0

      emo_counts: Dict[str, int] = {}
      per_q_stress: List[float] = []

      for a in attempts:
            # dominant_emotion can be dict {"emotion": "..."} or a string
            dom_emo = "neutral"
            de = a.get("dominant_emotion")
            if isinstance(de, dict):
                  dom_emo = de.get("emotion", "neutral") or "neutral"
            elif isinstance(de, str):
                  dom_emo = de or "neutral"

            time_taken = float(a.get("time_taken", 0))
            is_correct = bool(a.get("is_correct", False))

            total_time += time_taken
            if time_taken > 15:
                  over15 += 1
            if not is_correct:
                  wrong += 1
            if dom_emo in NEG_EMOTIONS:
                  neg_count += 1

            emo_counts[dom_emo] = emo_counts.get(dom_emo, 0) + 1

            # stress score = base(by emotion) + 0.5 if time>15 + 1 if wrong
            base = EMOTION_WEIGHTS.get(dom_emo, 1)
            stress = base + (0.5 if time_taken > 15 else 0) + (0 if is_correct else 1)
            per_q_stress.append(stress)

      avg_stress = round(float(np.mean(per_q_stress)), 4) if per_q_stress else 0.0
      avg_time = round(total_time / total, 4) if total else 0.0
      wrong_ratio = round(wrong / total, 4) if total else 0.0
      time_over_15_ratio = round(over15 / total, 4) if total else 0.0
      neg_emotion_ratio = round(neg_count / total, 4) if total else 0.0

      dominant_emotion = max(emo_counts.items(), key=lambda kv: kv[1])[0] if emo_counts else "neutral"

      return {
            "features": {
                  "avg_stress": avg_stress,
                  "wrong_ratio": wrong_ratio,
                  "avg_time": avg_time,
                  "time_over_15_ratio": time_over_15_ratio,
                  "neg_emotion_ratio": neg_emotion_ratio,
                  "dominant_emotion": dominant_emotion,
            },
            "summary": {
                  "avg_stress_score": avg_stress,
                  "avg_time": avg_time,
                  "wrong_answers": wrong,
                  "emotion_counts": emo_counts if emo_counts else {},
                  "total_questions": total
            }
      }

# ---------------------------
# Hybrid decision (model + rules)
# ---------------------------
def decide_final_label(feats: Dict[str, Any], raw_label: str, raw_conf: float) -> Dict[str, Any]:
      """
      Hybrid logic:
         1) Extreme content gap → HIGH_CONTENT_GAP
         2) Very strong performance → LOW_STRESS_GOOD_PROGRESS
         3) Low confidence → middle class, unless rules fired
         4) Otherwise → model label
      """
      wrong_ratio = float(feats.get("wrong_ratio", 0))
      avg_time      = float(feats.get("avg_time", 0))
      t_ratio       = float(feats.get("time_over_15_ratio", 0))
      avg_stress   = float(feats.get("avg_stress", 0))

      # Strong content-gap overrides
      if wrong_ratio >= 0.8:
            return {"final_label": "HIGH_CONTENT_GAP", "overridden_by_rules": True}
      if wrong_ratio >= 0.6 and (avg_time >= 20 or t_ratio >= 0.4 or avg_stress >= 2.5):
            return {"final_label": "HIGH_CONTENT_GAP", "overridden_by_rules": True}

      # Very strong performance
      if wrong_ratio <= 0.2 and avg_stress < 2.0 and t_ratio <= 0.3:
            return {"final_label": "LOW_STRESS_GOOD_PROGRESS", "overridden_by_rules": True}

      # Low confidence → safer middle class
      if raw_conf < 0.65 and raw_label not in {"HIGH_CONTENT_GAP", "LOW_STRESS_GOOD_PROGRESS"}:
            return {"final_label": "BALANCED_IMPROVEMENT_NEEDED", "overridden_by_rules": True}

      return {"final_label": raw_label, "overridden_by_rules": False}

# ---------------------------
# Tailored recommendation builder
# ---------------------------
def build_recommendation(label: str, feats: Dict[str, Any]) -> List[str]:
      wrong_ratio = feats.get("wrong_ratio", 0.0)
      t_ratio       = feats.get("time_over_15_ratio", 0.0)
      avg_stress   = feats.get("avg_stress", 0.0)
      avg_time      = feats.get("avg_time", 0.0)
      dom_emo       = feats.get("dominant_emotion", "neutral")
      neg_ratio    = feats.get("neg_emotion_ratio", 0.0)

      recos: List[str] = []
      recos.append(LABEL_HEADLINE.get(label, "Keep practicing — steady, focused improvement works best."))

      # Accuracy guidance
      if wrong_ratio >= 0.7:
            recos.append("Revisit core topics first — do 10–15 targeted questions per concept.")
            recos.append("Use worked examples, then attempt similar items without looking at solutions.")
      elif wrong_ratio >= 0.4:
            recos.append("Focus on weak areas — add 2–3 short practice blocks per day (10 questions each).")
      else:
            recos.append("Maintain your accuracy with spaced review (2–3 short sessions per week).")

      # Timing guidance
      if t_ratio >= 0.6:
            recos.append("Practice with strict timeboxing (15s/question) to build speed under light pressure.")
      elif t_ratio >= 0.3:
            recos.append("Add a light timer (15–20s/question) to improve pacing.")
      else:
            recos.append("Your pacing looks good — keep the same rhythm.")

      # Stress / emotion guidance
      if avg_stress >= 4.0 or neg_ratio >= 0.5:
            recos.append("Insert short breaks and breathing exercises between sets (60–90s).")
      if dom_emo in {"fear", "angry", "disgust", "sad"}:
            recos.append("Start each session with 2 easy warm‑up questions to build momentum.")
      if dom_emo in {"happy", "surprise", "neutral"} and wrong_ratio < 0.4 and t_ratio < 0.3:
            recos.append("You’re in a good flow — gradually introduce mixed‑difficulty sets.")

      # Concrete micro‑plan
      recos.append(f"Weekly plan: 3×20‑min sessions • average time ≈ {avg_time:.0f}s/question • review misses next day.")
      return recos

# ---------------------------
# API
# ---------------------------
@router.get("/model-info")
def model_info():
      return {
            "model": "LogisticRegression pipeline (scikit-learn)",
            "labels": LABELS,
            "num_features": NUM_FEATURES,
            "cat_features": CAT_FEATURES,
      }

@router.post("/analyze/{quiz_id}")
def analyze_quiz(quiz_id: int):
      # Quiz title
      quiz = db.quizzes.find_one({"quizId": quiz_id}, {"_id": 0, "title": 1})
      if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
      quiz_title = quiz.get("title", f"Quiz {quiz_id}")

      # Distinct user ids for this quiz
      user_ids = db.responses.distinct("user_id", {"quiz_id": quiz_id})
      if not user_ids:
            raise HTTPException(status_code=404, detail="No responses found for this quiz")

      # Model classes order (for confidence extraction)
      if hasattr(model, "named_steps") and "classifier" in model.named_steps:
            model_classes = model.named_steps["classifier"].classes_.tolist()
      else:
            model_classes = getattr(model, "classes_", LABELS)

      results = []

      for uid in user_ids:
            agg = aggregate_user_quiz_features(quiz_id, uid)
            if not agg:
                  continue

            feats = agg["features"]
            row = {**{k: feats[k] for k in NUM_FEATURES},
                       **{k: feats[k] for k in CAT_FEATURES}}
            X = pd.DataFrame([row])

            # Raw prediction
            raw_pred = model.predict(X)[0]
            proba = model.predict_proba(X)[0]
            if raw_pred in model_classes:
                  raw_conf = float(proba[model_classes.index(raw_pred)])
            else:
                  raw_conf = float(np.max(proba))

            # Hybrid decision
            hybrid = decide_final_label(feats, raw_pred, raw_conf)
            final_label = hybrid["final_label"]
            overridden = bool(hybrid["overridden_by_rules"])

            # Tailored recommendations
            recommendations = build_recommendation(final_label, feats)
            recommendation_text = " ".join(recommendations)

            summary = agg["summary"]

            # Store per-user summary (keep both raw & final to aid debugging)
            db.quiz_summary_scores.update_one(
                  {"user_id": uid, "quiz_id": quiz_id},
                  {"$set": {
                        "avg_stress_score": summary["avg_stress_score"],
                        "avg_time": summary["avg_time"],
                        "wrong_answers": summary["wrong_answers"],
                        "emotion_counts": summary["emotion_counts"],
                        "total_questions": summary["total_questions"],
                        "raw_model_label": raw_pred,
                        "raw_model_confidence": round(raw_conf, 4),
                        "model_label": final_label,                     # final label for UI
                        "overridden_by_rules": overridden,
                        "recommendation": recommendation_text,
                        "recommendations": recommendations,
                  }},
                  upsert=True
            )

            # Store final recommendation doc used by frontend
            db.user_recommendations.update_one(
                  {"user_id": uid, "quiz_id": quiz_id},
                  {"$set": {
                        "quiz_title": quiz_title,
                        "avg_stress_score": summary["avg_stress_score"],
                        "model_label": final_label,                     # final label for UI
                        "raw_model_label": raw_pred,
                        "model_confidence": round(raw_conf, 4),
                        "overridden_by_rules": overridden,
                        "recommendation": recommendation_text,
                        "recommendations": recommendations
                  }},
                  upsert=True
            )

            results.append({
                  "user_id": uid,
                  "quiz_id": quiz_id,
                  "quiz_title": quiz_title,
                  "features": feats,
                  "raw_model_label": raw_pred,
                  "model_label": final_label,
                  "model_confidence": round(raw_conf, 4),
                  "overridden_by_rules": overridden,
                  "recommendation": recommendation_text,
                  "recommendations": recommendations
            })

      return {
            "message": f"Analysis completed for quiz {quiz_id}",
            "results": results
      }
