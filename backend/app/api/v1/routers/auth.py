"""Authentication router — register, login, forgot/reset password, Google OAuth."""

import hashlib
import re
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import dns.resolver
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.db.database import get_db
from app.models.ledger import Profile

router = APIRouter(prefix="/auth")


_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

_DISPOSABLE_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
    "throwaway.email", "yopmail.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
    "guerrillamail.net", "guerrillamail.org", "spam4.me", "trashmail.com",
    "trashmail.me", "trashmail.net", "dispostable.com", "fakeinbox.com",
    "mailnull.com", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
    "tempr.email", "discard.email", "cfl.fr", "spamfree24.org",
    "maildrop.cc", "spamwc.de", "mt2015.com", "mt2014.com",
    "no-spam.ws", "spamevader.com",
}


def _validate_email(email: str) -> None:
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address format.")

    domain = email.split("@")[1].lower()

    if domain in _DISPOSABLE_DOMAINS:
        raise HTTPException(status_code=422, detail="Disposable email addresses are not allowed.")

    try:
        dns.resolver.resolve(domain, "MX")
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
        raise HTTPException(status_code=422, detail="Email domain does not exist or cannot receive mail.")
    except Exception:
        pass  # DNS timeout or network error — allow through to avoid blocking real users


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _send_email(to: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["From"] = f"HisabFlow <{settings.smtp_user}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.smtp_user, settings.smtp_pass)
        server.sendmail(settings.smtp_user, to, msg.as_string())


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=6)
    display_name: str | None = Field(None, max_length=100)


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class GoogleCallbackRequest(BaseModel):
    code: str


class AuthResponse(BaseModel):
    username: str
    display_name: str | None
    email: str | None

    model_config = {"from_attributes": True}


def _send_verification_email(email: str, display_name: str, token: str) -> None:
    verify_link = f"{settings.app_url}/verify-email?token={token}"
    html = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e7ff">
      <div style="background:linear-gradient(135deg,#4a7af5,#3b6ce0);padding:28px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">Verify Your Email</h2>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Hi <strong>{display_name}</strong>, click the button below to verify your email address.
          This link expires in <strong>24 hours</strong>.
        </p>
        <a href="{verify_link}" style="display:inline-block;padding:13px 28px;background:#4a7af5;color:#fff;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none">
          Verify Email Address
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
          If you didn't create a HisabFlow account, you can ignore this email.
        </p>
      </div>
    </div>"""
    _send_email(email, "HisabFlow: Verify Your Email Address", html)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    email = data.email.strip().lower()

    _validate_email(email)

    if db.scalar(select(Profile).where(Profile.username == username)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")
    if db.scalar(select(Profile).where(Profile.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    token = secrets.token_urlsafe(32)
    profile = Profile(
        username=username,
        email=email,
        password_hash=_hash(data.password),
        display_name=data.display_name or username,
        email_verified=False,
        email_verification_token=token,
        email_verification_expires=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(profile)
    db.commit()

    try:
        _send_verification_email(email, profile.display_name or username, token)
    except Exception:
        raise HTTPException(status_code=500, detail="Account created but failed to send verification email. Check SMTP settings.")

    return {"ok": True, "message": "Account created. Please check your email to verify your address before logging in."}


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    identifier = data.username_or_email.strip().lower()
    profile = db.scalar(
        select(Profile).where(
            or_(Profile.username == identifier, Profile.email == identifier)
        )
    )
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No account found. Please register first.")
    if not profile.password_hash or profile.password_hash != _hash(data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password.")
    if not profile.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED")
    return profile


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    profile = db.scalar(select(Profile).where(Profile.email_verification_token == data.token))
    if not profile:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    now = datetime.now(timezone.utc)
    expires = profile.email_verification_expires
    if expires is None or (expires.tzinfo is None and expires.replace(tzinfo=timezone.utc) < now) or (expires.tzinfo is not None and expires < now):
        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    profile.email_verified = True
    profile.email_verification_token = None
    profile.email_verification_expires = None
    db.commit()
    return {"ok": True}


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    identifier = data.email.strip().lower()
    profile = db.scalar(select(Profile).where(
        or_(Profile.email == identifier, Profile.username == identifier)
    ))

    # Always return success to prevent email enumeration
    if not profile or profile.email_verified:
        return {"ok": True}

    token = secrets.token_urlsafe(32)
    profile.email_verification_token = token
    profile.email_verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    try:
        _send_verification_email(profile.email, profile.display_name or profile.username, token)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send verification email. Check SMTP settings.")

    return {"ok": True}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    profile = db.scalar(select(Profile).where(Profile.email == email))

    # Always return success to prevent email enumeration
    if not profile:
        return {"ok": True}

    token = secrets.token_urlsafe(32)
    profile.reset_token = token
    profile.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()

    reset_link = f"{settings.app_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e7ff">
      <div style="background:linear-gradient(135deg,#4a7af5,#3b6ce0);padding:28px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">Reset Your Password</h2>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Hi <strong>{profile.display_name or profile.username}</strong>, click the button below to reset your password.
          This link expires in <strong>30 minutes</strong>.
        </p>
        <a href="{reset_link}" style="display:inline-block;padding:13px 28px;background:#4a7af5;color:#fff;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
          If you didn't request this, ignore this email.
        </p>
      </div>
    </div>"""

    try:
        _send_email(email, "HisabFlow: Reset Your Password", html)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP settings.")

    return {"ok": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    profile = db.scalar(select(Profile).where(Profile.reset_token == data.token))
    if not profile:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    now = datetime.now(timezone.utc)
    expires = profile.reset_token_expires
    if expires is None or (expires.tzinfo is None and expires.replace(tzinfo=timezone.utc) < now) or (expires.tzinfo is not None and expires < now):
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    profile.password_hash = _hash(data.new_password)
    profile.reset_token = None
    profile.reset_token_expires = None
    db.commit()
    return {"ok": True}


@router.post("/google", response_model=AuthResponse)
def google_auth(data: GoogleCallbackRequest, db: Session = Depends(get_db)):
    # Exchange code for tokens
    token_res = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": data.code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Google authentication failed.")

    access_token = token_res.json().get("access_token")

    # Get user info from Google
    user_res = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google user info.")

    guser = user_res.json()
    google_id = guser.get("id")
    email = guser.get("email", "").lower()
    name = guser.get("name") or guser.get("given_name") or email.split("@")[0]

    # Find existing user by google_id or email
    profile = db.scalar(select(Profile).where(Profile.google_id == google_id))
    if not profile and email:
        profile = db.scalar(select(Profile).where(Profile.email == email))

    if profile:
        # Link google_id if not already linked
        if not profile.google_id:
            profile.google_id = google_id
            db.commit()
        return profile

    # Create new user
    base_username = email.split("@")[0].lower().replace(".", "_")
    username = base_username
    counter = 1
    while db.scalar(select(Profile).where(Profile.username == username)):
        username = f"{base_username}{counter}"
        counter += 1

    profile = Profile(
        username=username,
        email=email,
        google_id=google_id,
        display_name=name,
        password_hash=None,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
