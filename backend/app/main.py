import json
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc

from app.agent_orchestrator import AgentOrchestrator
from app.auth import USERS_DB, create_token, decode_token, get_current_user, hash_password, verify_password
from app.database import AnalysisRecord, SessionLocal, User
from app.schemas import AnalysisRequest, AnalysisResponse

app = FastAPI(title="TrustLoop AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
agent_orchestrator = AgentOrchestrator()


def get_optional_user(request: Request) -> dict[str, Any] | None:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        return USERS_DB.get(email)
    except HTTPException:
        return None


def persist_analysis(email: str, language: str, result: dict[str, Any]) -> None:
    db = SessionLocal()
    try:
        db.add(
            AnalysisRecord(
                user_email=email,
                language=language,
                summary=result.get("summary", ""),
                result_json=json.dumps(result),
            )
        )
        db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/auth/signup")
def signup(payload: dict[str, str]):
    email = payload.get("email", "").strip().lower()
    username = payload.get("username", "").strip()
    password = payload.get("password", "")

    if not email or not username or len(password) < 6:
        raise HTTPException(status_code=400, detail="Invalid signup data")
    if email in USERS_DB:
        raise HTTPException(status_code=400, detail="User already exists")

    USERS_DB[email] = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
    }

    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.email == email).first()
        if not db_user:
            db.add(User(username=username, email=email, password_hash=hash_password(password), created_at=datetime.now(timezone.utc).isoformat()))
            db.commit()
    finally:
        db.close()

    token = create_token(email)
    return {"token": token, "user": {"username": username, "email": email}}


@app.post("/api/auth/login")
def login(payload: dict[str, str]):
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    user = USERS_DB.get(email)

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(email)
    return {"token": token, "user": {"username": user["username"], "email": email}}


@app.get("/api/auth/me")
def me(current_user: dict[str, Any] = Depends(get_current_user)):
    return {"username": current_user["username"], "email": current_user["email"]}


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_endpoint(payload: AnalysisRequest, request: Request):
    current_user = get_optional_user(request)
    try:
        result = agent_orchestrator.run_analysis(payload.language, payload.code, payload.requirements)
        if current_user:
            persist_analysis(current_user["email"], payload.language, result)
        return result
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@app.get("/api/history")
def history(current_user: dict[str, Any] = Depends(get_current_user)):
    db = SessionLocal()
    try:
        records = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.user_email == current_user["email"])
            .order_by(desc(AnalysisRecord.id))
            .all()
        )
        items = [
            {
                "id": record.id,
                "language": record.language,
                "summary": record.summary,
                "created_at": record.created_at,
            }
            for record in records
        ]
        return {"items": items, "user": current_user["email"]}
    finally:
        db.close()
