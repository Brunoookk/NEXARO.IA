import base64
import hashlib
import hmac
import io
import json
import os
import re
import secrets
from datetime import datetime
from pathlib import Path
from typing import Optional

import PyPDF2
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from groq import AsyncGroq
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from database import Base, engine, get_db
from models import AuthSession, Conversation, Message, PasswordReset, SavedItem, User, UserSettings

load_dotenv(Path(__file__).resolve().parent / ".env")
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NEXARO IA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PASSWORD_SECRET = os.getenv("PASSWORD_SECRET", os.getenv("SECRET_KEY", "nexaro-local-secret")).encode()
SYSTEM_PROMPT = "Voce e a NEXARO IA. Responda com clareza, seguranca, objetividade e no idioma do usuario."


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    avatar_url: Optional[str] = Field(default=None, max_length=200000)


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    product_updates: Optional[bool] = None


class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="Nova conversa", max_length=255)


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    favorite: Optional[bool] = None
    pinned: Optional[bool] = None


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=12000)


class SavedItemCreate(BaseModel):
    message_id: Optional[str] = None
    title: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    content: str = Field(min_length=1, max_length=20000)


class ImportMessage(BaseModel):
    role: str
    content: str


class ImportConversation(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    favorite: bool = False
    pinned: bool = False
    messages: list[ImportMessage] = []


def clean_text(value: str, limit: int = 20000) -> str:
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", value or "")
    return value.strip()[:limit]


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt + PASSWORD_SECRET, 260000)
    return f"pbkdf2_sha256${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_b64, digest_b64 = stored.split("$", 2)
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt + PASSWORD_SECRET, 260000)
        return hmac.compare_digest(digest, expected)
    except Exception:
        return False


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_token() -> str:
    return secrets.token_urlsafe(48)


def serialize_user(user: User, db: Session) -> dict:
    message_count = db.query(Message).join(Conversation).filter(Conversation.user_id == user.id).count()
    conversation_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "plan": user.plan,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_access_at": user.last_access_at.isoformat() if user.last_access_at else None,
        "stats": {
            "total_conversations": conversation_count,
            "total_messages": message_count,
            "total_prompts": db.query(Message).join(Conversation).filter(Conversation.user_id == user.id, Message.role == "user").count(),
        },
    }


def serialize_settings(settings: UserSettings) -> dict:
    return {
        "theme": settings.theme,
        "language": settings.language,
        "notifications": settings.notifications,
        "security_alerts": settings.security_alerts,
        "product_updates": settings.product_updates,
    }


def serialize_message(message: Message) -> dict:
    return {
        "id": message.id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def serialize_conversation(conversation: Conversation, include_messages: bool = False) -> dict:
    data = {
        "id": conversation.id,
        "title": conversation.title,
        "favorite": conversation.favorite,
        "pinned": conversation.pinned,
        "created_at": conversation.created_at.isoformat() if conversation.created_at else None,
        "updated_at": conversation.updated_at.isoformat() if conversation.updated_at else None,
        "message_count": len(conversation.messages),
        "pdf_filename": conversation.pdf_filename,
        "pdf_pages": conversation.pdf_pages,
    }
    if include_messages:
        data["messages"] = [serialize_message(message) for message in conversation.messages]
    return data


def require_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Autenticacao obrigatoria")
    token = authorization.removeprefix("Bearer ").strip()
    session = db.query(AuthSession).filter(AuthSession.token_hash == token_hash(token), AuthSession.is_active.is_(True)).first()
    if not session:
        raise HTTPException(status_code=401, detail="Sessao invalida")
    user = db.query(User).filter(User.id == session.user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario inativo")
    session.last_seen_at = datetime.utcnow()
    user.last_access_at = datetime.utcnow()
    db.commit()
    return user


def get_or_create_settings(db: Session, user_id: str) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_groq_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY nao configurada")
    return AsyncGroq(api_key=api_key)


def get_user_conversation(db: Session, user_id: str, conversation_id: str) -> Conversation:
    conversation = (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    return conversation


@app.get("/")
def root():
    return {"status": "NEXARO IA API running"}


@app.post("/auth/register")
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado")
    user = User(name=clean_text(payload.name, 120), email=email, password_hash=hash_password(payload.password), last_access_at=datetime.utcnow())
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(UserSettings(user_id=user.id))
    token = create_token()
    db.add(AuthSession(user_id=user.id, token_hash=token_hash(token), user_agent=request.headers.get("user-agent", ""), ip_address=request.client.host if request.client else ""))
    db.commit()
    return {"token": token, "user": serialize_user(user, db), "settings": serialize_settings(get_or_create_settings(db, user.id))}


@app.post("/auth/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip(), User.is_active.is_(True)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    token = create_token()
    user.last_access_at = datetime.utcnow()
    db.add(AuthSession(user_id=user.id, token_hash=token_hash(token), user_agent=request.headers.get("user-agent", ""), ip_address=request.client.host if request.client else ""))
    db.commit()
    return {"token": token, "user": serialize_user(user, db), "settings": serialize_settings(get_or_create_settings(db, user.id))}


@app.post("/auth/logout")
def logout(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    if authorization.startswith("Bearer "):
        db.query(AuthSession).filter(AuthSession.token_hash == token_hash(authorization.removeprefix("Bearer ").strip())).update({"is_active": False})
        db.commit()
    return {"ok": True}


@app.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip(), User.is_active.is_(True)).first()
    if not user:
        return {"ok": True}
    token = create_token()
    db.add(PasswordReset(user_id=user.id, token_hash=token_hash(token)))
    db.commit()
    return {"ok": True, "reset_token": token if os.getenv("ENVIRONMENT", "local") != "production" else None}


@app.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = db.query(PasswordReset).filter(PasswordReset.token_hash == token_hash(payload.token), PasswordReset.used.is_(False)).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Token invalido")
    user = db.query(User).filter(User.id == reset.user_id).first()
    user.password_hash = hash_password(payload.password)
    reset.used = True
    db.query(AuthSession).filter(AuthSession.user_id == user.id).update({"is_active": False})
    db.commit()
    return {"ok": True}


@app.get("/me")
def me(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return {"user": serialize_user(user, db), "settings": serialize_settings(get_or_create_settings(db, user.id))}


@app.patch("/me")
def update_me(payload: ProfileUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if payload.name is not None:
        user.name = clean_text(payload.name, 120)
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(user)
    return serialize_user(user, db)


@app.post("/me/change-password")
def change_password(payload: ChangePasswordRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}


@app.delete("/me")
def delete_account(user: User = Depends(require_user), db: Session = Depends(get_db)):
    user.is_active = False
    db.query(AuthSession).filter(AuthSession.user_id == user.id).update({"is_active": False})
    db.commit()
    return {"ok": True}


@app.get("/settings")
def get_settings(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return serialize_settings(get_or_create_settings(db, user.id))


@app.patch("/settings")
def update_settings(payload: SettingsUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    settings = get_or_create_settings(db, user.id)
    if payload.theme in {"dark", "light"}:
        settings.theme = payload.theme
    if payload.language:
        settings.language = clean_text(payload.language, 20)
    for attr in ["notifications", "security_alerts", "product_updates"]:
        value = getattr(payload, attr)
        if value is not None:
            setattr(settings, attr, value)
    db.commit()
    db.refresh(settings)
    return serialize_settings(settings)


@app.get("/sessions")
def list_sessions(user: User = Depends(require_user), db: Session = Depends(get_db)):
    sessions = db.query(AuthSession).filter(AuthSession.user_id == user.id).order_by(AuthSession.created_at.desc()).all()
    return [{"id": s.id, "user_agent": s.user_agent, "ip_address": s.ip_address, "is_active": s.is_active, "created_at": s.created_at.isoformat(), "last_seen_at": s.last_seen_at.isoformat()} for s in sessions]


@app.get("/conversations")
def list_conversations(q: str = "", date_group: str = "", user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(Conversation).options(joinedload(Conversation.messages)).filter(Conversation.user_id == user.id)
    if q:
        search = f"%{clean_text(q, 120)}%"
        query = query.filter(or_(Conversation.title.ilike(search), Conversation.messages.any(Message.content.ilike(search))))
    conversations = query.order_by(Conversation.pinned.desc(), Conversation.updated_at.desc()).all()
    if date_group:
        conversations = [item for item in conversations if group_date(item.updated_at or item.created_at) == date_group]
    return [serialize_conversation(item, include_messages=False) for item in conversations]


def group_date(value: datetime) -> str:
    today = datetime.utcnow().date()
    delta = (today - value.date()).days
    if delta <= 0:
        return "Hoje"
    if delta == 1:
        return "Ontem"
    if delta <= 7:
        return "Ultimos 7 dias"
    return "Ultimos 30 dias"


@app.post("/conversations")
def create_conversation(payload: ConversationCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversation = Conversation(user_id=user.id, title=clean_text(payload.title or "Nova conversa", 255) or "Nova conversa")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return serialize_conversation(conversation, include_messages=True)


@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    return serialize_conversation(get_user_conversation(db, user.id, conversation_id), include_messages=True)


@app.patch("/conversations/{conversation_id}")
def update_conversation(conversation_id: str, payload: ConversationUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversation = get_user_conversation(db, user.id, conversation_id)
    if payload.title is not None:
        conversation.title = clean_text(payload.title, 255)
    if payload.favorite is not None:
        conversation.favorite = payload.favorite
    if payload.pinned is not None:
        conversation.pinned = payload.pinned
    conversation.updated_at = datetime.utcnow()
    db.commit()
    return serialize_conversation(conversation, include_messages=True)


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversation = get_user_conversation(db, user.id, conversation_id)
    db.delete(conversation)
    db.commit()
    return {"ok": True}


@app.post("/conversations/{conversation_id}/duplicate")
def duplicate_conversation(conversation_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    original = get_user_conversation(db, user.id, conversation_id)
    copy = Conversation(user_id=user.id, title=f"{original.title} copia", favorite=original.favorite, pinned=False, pdf_context=original.pdf_context, pdf_filename=original.pdf_filename, pdf_pages=original.pdf_pages)
    db.add(copy)
    db.flush()
    for message in original.messages:
        db.add(Message(conversation_id=copy.id, role=message.role, content=message.content))
    db.commit()
    db.refresh(copy)
    return serialize_conversation(copy, include_messages=True)


@app.get("/conversations-export")
def export_conversations(user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [serialize_conversation(item, include_messages=True) for item in conversations]


@app.post("/conversations-import")
def import_conversations(payload: list[ImportConversation], user: User = Depends(require_user), db: Session = Depends(get_db)):
    created = []
    for item in payload[:100]:
        conversation = Conversation(user_id=user.id, title=clean_text(item.title, 255), favorite=item.favorite, pinned=item.pinned)
        db.add(conversation)
        db.flush()
        for message in item.messages[:500]:
            if message.role not in {"user", "assistant"}:
                continue
            db.add(Message(conversation_id=conversation.id, role=message.role, content=clean_text(message.content, 20000)))
        created.append(conversation)
    db.commit()
    return {"imported": len(created)}


@app.post("/upload/pdf")
async def upload_pdf(conversation_id: str, file: UploadFile = File(...), user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversation = get_user_conversation(db, user.id, conversation_id)
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF sao suportados")
    contents = await file.read()
    if len(contents) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF acima do limite de 12MB")
    reader = PyPDF2.PdfReader(io.BytesIO(contents))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)[:12000]
    conversation.pdf_context = clean_text(text, 12000)
    conversation.pdf_filename = clean_text(file.filename, 255)
    conversation.pdf_pages = len(reader.pages)
    conversation.updated_at = datetime.utcnow()
    db.commit()
    return {"filename": conversation.pdf_filename, "pages": conversation.pdf_pages, "chars_extracted": len(conversation.pdf_context)}


@app.post("/chat/stream")
async def chat_stream(payload: ChatRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    conversation = get_user_conversation(db, user.id, payload.conversation_id) if payload.conversation_id else Conversation(user_id=user.id, title=clean_text(payload.message, 60) or "Nova conversa")
    if not payload.conversation_id:
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = clean_text(payload.message, 12000)
    history = db.query(Message).filter(Message.conversation_id == conversation.id).order_by(Message.created_at.asc()).all()
    system = SYSTEM_PROMPT
    if conversation.pdf_context:
        system += f"\n\nPDF anexado: {conversation.pdf_filename}\n{conversation.pdf_context}"
    messages = [{"role": "system", "content": system}] + [{"role": item.role, "content": item.content} for item in history] + [{"role": "user", "content": user_message}]

    async def generate():
        full_response = ""
        try:
            stream = await get_groq_client().chat.completions.create(model="llama-3.3-70b-versatile", messages=messages, stream=True, max_tokens=2048, temperature=0.7)
            yield f"data: {json.dumps({'conversation_id': conversation.id})}\n\n"
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response += delta
                    yield f"data: {json.dumps({'token': delta})}\n\n"
            db.add(Message(conversation_id=conversation.id, role="user", content=user_message))
            db.add(Message(conversation_id=conversation.id, role="assistant", content=clean_text(full_response, 20000)))
            if conversation.title == "Nova conversa":
                conversation.title = clean_text(user_message, 60) or "Nova conversa"
            conversation.updated_at = datetime.utcnow()
            db.commit()
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/saved")
def list_saved(q: str = "", category: str = "", user: User = Depends(require_user), db: Session = Depends(get_db)):
    query = db.query(SavedItem).filter(SavedItem.user_id == user.id)
    if q:
        search = f"%{clean_text(q, 120)}%"
        query = query.filter(or_(SavedItem.title.ilike(search), SavedItem.content.ilike(search), SavedItem.category.ilike(search)))
    if category:
        query = query.filter(SavedItem.category == clean_text(category, 80))
    items = query.order_by(SavedItem.created_at.desc()).all()
    return [{"id": item.id, "message_id": item.message_id, "title": item.title, "category": item.category, "content": item.content, "created_at": item.created_at.isoformat()} for item in items]


@app.post("/saved")
def create_saved(payload: SavedItemCreate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    item = SavedItem(user_id=user.id, message_id=payload.message_id, title=clean_text(payload.title, 160), category=clean_text(payload.category, 80), content=clean_text(payload.content, 20000))
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "message_id": item.message_id, "title": item.title, "category": item.category, "content": item.content, "created_at": item.created_at.isoformat()}


@app.delete("/saved/{item_id}")
def delete_saved(item_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    item = db.query(SavedItem).filter(SavedItem.id == item_id, SavedItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item nao encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


@app.get("/dashboard")
def dashboard(user: User = Depends(require_user), db: Session = Depends(get_db)):
    settings = get_or_create_settings(db, user.id)
    return {
        "user": serialize_user(user, db),
        "settings": serialize_settings(settings),
        "saved_count": db.query(SavedItem).filter(SavedItem.user_id == user.id).count(),
        "active_sessions": db.query(AuthSession).filter(AuthSession.user_id == user.id, AuthSession.is_active.is_(True)).count(),
    }
