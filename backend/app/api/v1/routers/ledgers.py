"""REST API router for Ledgers and Profiles."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ledger import (
    ActivityLogRead,
    AddEntryRequest,
    ChangePasswordRequest,
    ChangeUsernameRequest,
    CloseMonthRequest,
    JoinLedgerRequest,
    LedgerCreate,
    LedgerDetailRead,
    LedgerEntryRead,
    LedgerMemberRead,
    LedgerMonthRead,
    LedgerRead,
    LedgerUpdate,
    ProfileCreate,
    ProfileRead,
    ProfileUpdate,
    UpdateEntryRequest,
)
from app.services import ledger_service

router = APIRouter(prefix="/ledgers")
profile_router = APIRouter(prefix="/profiles")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _http(exc: Exception) -> HTTPException:
    if isinstance(exc, PermissionError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ─── Profile endpoints ───────────────────────────────────────────────────────

@profile_router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    try:
        return ledger_service.create_profile(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@profile_router.get("/{username}", response_model=ProfileRead)
def get_profile(username: str, db: Session = Depends(get_db)):
    profile = ledger_service.get_profile_by_username(db, username)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@profile_router.patch("/{username}", response_model=ProfileRead)
def update_profile(username: str, data: ProfileUpdate, db: Session = Depends(get_db)):
    try:
        return ledger_service.update_profile(db, username, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@profile_router.post("/{username}/change-username", response_model=ProfileRead)
def change_username(username: str, data: ChangeUsernameRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.change_username(db, username, data.new_username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@profile_router.post("/{username}/change-password", response_model=ProfileRead)
def change_password(username: str, data: ChangePasswordRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.change_password(db, username, data.current_password, data.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ─── Ledger list / create ────────────────────────────────────────────────────

@router.get("", response_model=list[LedgerRead])
def list_ledgers(username: str, db: Session = Depends(get_db)):
    return ledger_service.list_ledgers(db, username)


@router.post("", response_model=LedgerRead, status_code=status.HTTP_201_CREATED)
def create_ledger(data: LedgerCreate, db: Session = Depends(get_db)):
    try:
        return ledger_service.create_ledger(db, data)
    except (ValueError, PermissionError) as e:
        raise _http(e)


# ─── Single ledger ───────────────────────────────────────────────────────────

@router.get("/{ledger_id}", response_model=LedgerDetailRead)
def get_ledger(ledger_id: uuid.UUID, db: Session = Depends(get_db)):
    ledger = ledger_service.get_ledger(db, ledger_id)
    if not ledger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ledger not found.")
    return {
        **ledger.__dict__,
        "member_count": len(ledger.members),
        "members": ledger.members,
        "entries": ledger.entries,
        "months": ledger.months,
    }


@router.patch("/{ledger_id}", response_model=LedgerRead)
def rename_ledger(
    ledger_id: uuid.UUID,
    data: LedgerUpdate,
    username: str,
    db: Session = Depends(get_db),
):
    try:
        ledger = ledger_service.rename_ledger(db, ledger_id, data, username)
        from app.services.ledger_service import _member_count
        return {**ledger.__dict__, "member_count": _member_count(db, ledger_id)}
    except (ValueError, PermissionError) as e:
        raise _http(e)


@router.delete("/{ledger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ledger(ledger_id: uuid.UUID, username: str, db: Session = Depends(get_db)):
    try:
        ledger_service.delete_ledger(db, ledger_id, username)
    except (ValueError, PermissionError) as e:
        raise _http(e)


# ─── Members ─────────────────────────────────────────────────────────────────

@router.post("/{ledger_id}/join", response_model=LedgerMemberRead, status_code=status.HTTP_201_CREATED)
def join_ledger(ledger_id: uuid.UUID, data: JoinLedgerRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.join_ledger(db, ledger_id, data)
    except (ValueError, PermissionError) as e:
        raise _http(e)


@router.delete("/{ledger_id}/members/{username}", status_code=status.HTTP_204_NO_CONTENT)
def leave_ledger(ledger_id: uuid.UUID, username: str, db: Session = Depends(get_db)):
    try:
        ledger_service.leave_ledger(db, ledger_id, username)
    except (ValueError, PermissionError) as e:
        raise _http(e)


# ─── Entries ─────────────────────────────────────────────────────────────────

@router.post("/{ledger_id}/entries", response_model=LedgerEntryRead, status_code=status.HTTP_201_CREATED)
def add_entry(ledger_id: uuid.UUID, data: AddEntryRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.add_entry(db, ledger_id, data)
    except (ValueError, PermissionError) as e:
        raise _http(e)


@router.delete("/{ledger_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(ledger_id: uuid.UUID, entry_id: uuid.UUID, username: str, db: Session = Depends(get_db)):
    try:
        ledger_service.delete_entry(db, ledger_id, entry_id, username)
    except (ValueError, PermissionError) as e:
        raise _http(e)


@router.patch("/{ledger_id}/entries/{entry_id}", response_model=LedgerEntryRead)
def update_entry(ledger_id: uuid.UUID, entry_id: uuid.UUID, data: UpdateEntryRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.update_entry(db, ledger_id, entry_id, data, data.username)
    except (ValueError, PermissionError) as e:
        raise _http(e)


# ─── Activity Log ────────────────────────────────────────────────────────────

@router.get("/{ledger_id}/activities", response_model=list[ActivityLogRead])
def get_activities(ledger_id: uuid.UUID, db: Session = Depends(get_db)):
    return ledger_service.get_activities(db, ledger_id)


# ─── Months ──────────────────────────────────────────────────────────────────

@router.get("/{ledger_id}/months", response_model=list[LedgerMonthRead])
def list_months(ledger_id: uuid.UUID, db: Session = Depends(get_db)):
    return ledger_service.list_months(db, ledger_id)


@router.post("/{ledger_id}/months/close", response_model=LedgerMonthRead)
def close_month(ledger_id: uuid.UUID, data: CloseMonthRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.close_month(db, ledger_id, data.username, data.month)
    except (ValueError, PermissionError) as e:
        raise _http(e)


@router.post("/{ledger_id}/months/reopen", response_model=LedgerMonthRead)
def reopen_month(ledger_id: uuid.UUID, data: CloseMonthRequest, db: Session = Depends(get_db)):
    try:
        return ledger_service.reopen_month(db, ledger_id, data.username, data.month)
    except (ValueError, PermissionError) as e:
        raise _http(e)
