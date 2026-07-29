import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ─── Profile ────────────────────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not cleaned.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens and underscores.")
        return cleaned


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)


class ProfileRead(BaseModel):
    id: uuid.UUID
    username: str
    display_name: Optional[str]
    email: Optional[str]
    username_changed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChangeUsernameRequest(BaseModel):
    new_username: str = Field(..., min_length=2, max_length=50)

    @field_validator("new_username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        import re
        if not re.match(r'^[a-z0-9_-]+$', v.lower()):
            raise ValueError("Username: letters, numbers, underscores only.")
        return v.lower()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# ─── Ledger ─────────────────────────────────────────────────────────────────

class LedgerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    owner_username: str = Field(..., min_length=2, max_length=50)


class LedgerUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class LedgerMemberRead(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class LedgerRead(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    owner_username: str
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Entry ──────────────────────────────────────────────────────────────────

class EntryParticipantRead(BaseModel):
    username: str
    share_amount: float

    model_config = {"from_attributes": True}


class AddEntryRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=300)
    total_amount: float = Field(default=0, ge=0)
    paid_by: str = Field(..., min_length=2, max_length=50)
    created_by: str = Field(..., min_length=2, max_length=50)
    participants: list[str]
    shares: dict[str, float]  # username -> share_amount
    entry_date: Optional[date] = None  # defaults to today if not provided


class UpdateEntryRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=300)
    total_amount: float = Field(default=0, ge=0)
    paid_by: str = Field(..., min_length=2, max_length=50)
    participants: list[str]
    shares: dict[str, float]
    username: str  # requester (must be member)


class LedgerEntryRead(BaseModel):
    id: uuid.UUID
    entry_date: date
    amount: float
    description: Optional[str]
    paid_by: str
    created_by: str
    created_at: datetime
    participants: list[EntryParticipantRead] = []

    model_config = {"from_attributes": True}


# ─── LedgerMonth ────────────────────────────────────────────────────────────

class LedgerMonthRead(BaseModel):
    id: uuid.UUID
    ledger_id: uuid.UUID
    month: str
    status: str
    closed_at: Optional[datetime]
    closed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Detail (includes entries + months) ──────────────────────────────────────

class LedgerDetailRead(LedgerRead):
    members: list[LedgerMemberRead] = []
    entries: list[LedgerEntryRead] = []
    months: list[LedgerMonthRead] = []


class CloseMonthRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    month: Optional[str] = None  # e.g. "2026-06", defaults to current month


# ─── Join Ledger ─────────────────────────────────────────────────────────────

class JoinLedgerRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    display_name: str = Field(..., min_length=2, max_length=100)


class ActivityLogRead(BaseModel):
    id: uuid.UUID
    username: str
    action: str
    entry_description: Optional[str]
    entry_amount: Optional[float]
    entry_date: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
