"""
auth.py — Authentication routes using Supabase Auth
Handles: login, register, get current user, logout
"""
from fastapi import APIRouter, HTTPException  # type: ignore
from pydantic import BaseModel, EmailStr  # type: ignore
from database import get_supabase, SUPABASE_URL, SUPABASE_KEY

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Schemas ───
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "admin"

class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str
    full_name: str
    role: str


# ─── Routes ───

@router.post("/login")
def login(req: LoginRequest):
    """Login using Supabase Auth."""
    sb = get_supabase()
    try:
        res = sb.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
    except Exception as e:
        error_msg = str(e)
        if "Invalid login" in error_msg or "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Email atau password salah")
        raise HTTPException(status_code=400, detail=f"Login gagal: {error_msg}")

    user = res.user
    session = res.session

    if not user or not session:
        raise HTTPException(status_code=401, detail="Email atau password salah")

    # Get user profile from users table
    profile = sb.table("users").select("*").eq("email", user.email).maybe_single().execute()

    full_name = "User"
    role = "admin"
    if profile and profile.data:
        full_name = profile.data.get("full_name", "User")
        role = profile.data.get("role", "admin")

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user_id": user.id,
        "email": user.email,
        "full_name": full_name,
        "role": role
    }


@router.post("/register")
def register(req: RegisterRequest):
    """Register a new user via Supabase Auth + insert profile."""
    sb = get_supabase()

    # 1. Create user in Supabase Auth
    try:
        res = sb.auth.sign_up({
            "email": req.email,
            "password": req.password
        })
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Email sudah terdaftar")
        raise HTTPException(status_code=400, detail=f"Registrasi gagal: {error_msg}")

    user = res.user
    if not user:
        raise HTTPException(status_code=400, detail="Registrasi gagal")

    # 2. Insert profile into users table
    try:
        sb.table("users").upsert({
            "id": user.id,
            "email": req.email,
            "hashed_password": "supabase_auth",  # Password dikelola oleh Supabase Auth
            "full_name": req.full_name,
            "role": req.role
        }).execute()
    except Exception:
        pass  # Profile insert failed but auth user is created

    return {
        "message": "Registrasi berhasil! Silakan login.",
        "user_id": user.id,
        "email": req.email
    }


@router.get("/me")
def get_current_user(authorization: str = ""):
    """Get current user info from token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")

    token = authorization.replace("Bearer ", "")
    sb = get_supabase()

    try:
        res = sb.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token tidak valid atau sudah expired")

    user = res.user
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")

    # Get profile
    profile = sb.table("users").select("*").eq("email", user.email).maybe_single().execute()

    full_name = "User"
    role = "admin"
    if profile and profile.data:
        full_name = profile.data.get("full_name", "User")
        role = profile.data.get("role", "admin")

    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": full_name,
        "role": role
    }


@router.post("/logout")
def logout():
    """Logout (client-side token removal)."""
    return {"message": "Berhasil logout"}
