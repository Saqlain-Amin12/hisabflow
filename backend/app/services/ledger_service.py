"""Service layer for the Ledger module."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.ledger import (
    MEMBER_ROLE_MEMBER,
    MEMBER_ROLE_OWNER,
    MONTH_STATUS_CLOSED,
    MONTH_STATUS_OPEN,
    Ledger,
    LedgerActivityLog,
    LedgerEntry,
    LedgerEntryParticipant,
    LedgerMember,
    LedgerMonth,
    Profile,
)
from app.schemas.ledger import (
    AddEntryRequest,
    JoinLedgerRequest,
    LedgerCreate,
    LedgerUpdate,
    ProfileCreate,
    ProfileUpdate,
)


# ─── Profile ─────────────────────────────────────────────────────────────────

def get_profile_by_username(db: Session, username: str) -> Profile | None:
    return db.scalar(select(Profile).where(Profile.username == username.lower()))


def create_profile(db: Session, data: ProfileCreate) -> Profile:
    if get_profile_by_username(db, data.username):
        raise ValueError(f"Username '{data.username}' is already taken.")
    profile = Profile(
        username=data.username,
        display_name=data.display_name or data.username,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def change_username(db: Session, current_username: str, new_username: str) -> Profile:
    current_username = current_username.lower()
    new_username = new_username.lower()

    profile = get_profile_by_username(db, current_username)
    if not profile:
        raise ValueError("Profile not found.")

    # 30-day restriction
    if profile.username_changed_at:
        days_since = (datetime.now(timezone.utc) - profile.username_changed_at).days
        if days_since < 30:
            days_left = 30 - days_since
            raise ValueError(f"Username can only be changed every 30 days. {days_left} day(s) remaining.")

    if get_profile_by_username(db, new_username):
        raise ValueError(f"Username '{new_username}' is already taken.")

    # Update all references across the database
    from sqlalchemy import update as sql_update
    db.execute(sql_update(LedgerMember).where(LedgerMember.username == current_username).values(username=new_username))
    db.execute(sql_update(LedgerEntry).where(LedgerEntry.paid_by == current_username).values(paid_by=new_username))
    db.execute(sql_update(LedgerEntry).where(LedgerEntry.created_by == current_username).values(created_by=new_username))
    db.execute(sql_update(LedgerEntryParticipant).where(LedgerEntryParticipant.username == current_username).values(username=new_username))
    db.execute(sql_update(Ledger).where(Ledger.owner_username == current_username).values(owner_username=new_username))

    from app.models.ledger import LedgerMonth
    db.execute(sql_update(LedgerMonth).where(LedgerMonth.closed_by == current_username).values(closed_by=new_username))

    profile.username = new_username
    profile.username_changed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


def change_password(db: Session, username: str, current_password: str, new_password: str) -> Profile:
    import hashlib
    profile = get_profile_by_username(db, username)
    if not profile:
        raise ValueError("Profile not found.")
    if profile.password_hash != hashlib.sha256(current_password.encode()).hexdigest():
        raise ValueError("Current password is incorrect.")
    profile.password_hash = hashlib.sha256(new_password.encode()).hexdigest()
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, username: str, data: ProfileUpdate) -> Profile:
    profile = get_profile_by_username(db, username)
    if not profile:
        raise ValueError("Profile not found.")
    if data.display_name is not None:
        profile.display_name = data.display_name
    db.commit()
    db.refresh(profile)
    return profile


def upsert_profile(db: Session, data: ProfileCreate) -> Profile:
    """Create profile if not exists, else return existing."""
    existing = get_profile_by_username(db, data.username)
    if existing:
        return existing
    return create_profile(db, data)


# ─── Ledger ──────────────────────────────────────────────────────────────────

def _member_count(db: Session, ledger_id: uuid.UUID) -> int:
    return db.scalar(
        select(func.count()).select_from(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id
        )
    ) or 0


def _current_month_str() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m")


def list_ledgers(db: Session, username: str) -> list[dict]:
    """Return all ledgers where the user is a member."""
    member_rows = db.scalars(
        select(LedgerMember).where(LedgerMember.username == username.lower())
    ).all()
    ledger_ids = [m.ledger_id for m in member_rows]
    if not ledger_ids:
        return []

    ledgers = db.scalars(
        select(Ledger).where(Ledger.id.in_(ledger_ids)).order_by(Ledger.created_at.desc())
    ).all()

    result = []
    for ledger in ledgers:
        result.append({**ledger.__dict__, "member_count": _member_count(db, ledger.id)})
    return result


def get_ledger(db: Session, ledger_id: uuid.UUID) -> Ledger | None:
    return db.scalar(
        select(Ledger)
        .options(
            selectinload(Ledger.members),
            selectinload(Ledger.months),
            selectinload(Ledger.entries).selectinload(LedgerEntry.participants),
        )
        .where(Ledger.id == ledger_id)
    )


def create_ledger(db: Session, data: LedgerCreate) -> dict:
    username = data.owner_username.lower()

    # Ensure profile exists
    profile = get_profile_by_username(db, username)
    if not profile:
        raise ValueError(f"No profile found for '{username}'. Set up your username in Profile first.")

    ledger = Ledger(
        name=data.name.strip(),
        owner_username=username,
    )
    db.add(ledger)
    db.flush()  # get id before adding member

    # Add owner as first member
    owner_member = LedgerMember(
        ledger_id=ledger.id,
        username=username,
        display_name=profile.display_name or username,
        role=MEMBER_ROLE_OWNER,
    )
    db.add(owner_member)

    # Create the current month entry
    month = LedgerMonth(
        ledger_id=ledger.id,
        month=_current_month_str(),
        status=MONTH_STATUS_OPEN,
    )
    db.add(month)
    db.commit()
    db.refresh(ledger)
    return {**ledger.__dict__, "member_count": 1}


def rename_ledger(db: Session, ledger_id: uuid.UUID, data: LedgerUpdate, username: str) -> Ledger:
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise ValueError("Ledger not found.")
    if ledger.owner_username != username.lower():
        raise PermissionError("Only the owner can rename this ledger.")
    ledger.name = data.name.strip()
    db.commit()
    db.refresh(ledger)
    return ledger


def delete_ledger(db: Session, ledger_id: uuid.UUID, username: str) -> None:
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise ValueError("Ledger not found.")
    if ledger.owner_username != username.lower():
        raise PermissionError("Only the owner can delete this ledger.")
    db.delete(ledger)
    db.commit()


# ─── Members ─────────────────────────────────────────────────────────────────

def join_ledger(db: Session, ledger_id: uuid.UUID, data: JoinLedgerRequest) -> LedgerMember:
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise ValueError("Ledger not found.")

    username = data.username.lower()

    # Check if already a member
    existing = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == username,
        )
    )
    if existing:
        raise ValueError("You are already a member of this ledger.")

    # Upsert profile
    profile = upsert_profile(
        db,
        ProfileCreate(username=username, display_name=data.display_name),
    )

    member = LedgerMember(
        ledger_id=ledger_id,
        username=username,
        display_name=profile.display_name or username,
        role=MEMBER_ROLE_MEMBER,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def leave_ledger(db: Session, ledger_id: uuid.UUID, username: str) -> None:
    username = username.lower()
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise ValueError("Ledger not found.")
    if ledger.owner_username == username:
        raise PermissionError("Owner cannot leave. Transfer ownership or delete the ledger.")

    member = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == username,
        )
    )
    if not member:
        raise ValueError("You are not a member of this ledger.")
    db.delete(member)
    db.commit()


# ─── Months ──────────────────────────────────────────────────────────────────

def get_current_month(db: Session, ledger_id: uuid.UUID) -> LedgerMonth | None:
    month_str = _current_month_str()
    return db.scalar(
        select(LedgerMonth).where(
            LedgerMonth.ledger_id == ledger_id,
            LedgerMonth.month == month_str,
        )
    )


def list_months(db: Session, ledger_id: uuid.UUID) -> list[LedgerMonth]:
    return list(
        db.scalars(
            select(LedgerMonth)
            .where(LedgerMonth.ledger_id == ledger_id)
            .order_by(LedgerMonth.month.desc())
        ).all()
    )


def _log_activity(db: Session, ledger_id: uuid.UUID, username: str, action: str,
                   entry_description: str | None = None, entry_amount: float | None = None,
                   entry_date=None) -> None:
    db.add(LedgerActivityLog(
        ledger_id=ledger_id, username=username, action=action,
        entry_description=entry_description, entry_amount=entry_amount,
        entry_date=str(entry_date) if entry_date else None,
    ))


def get_activities(db: Session, ledger_id: uuid.UUID) -> list[LedgerActivityLog]:
    from sqlalchemy import desc
    return list(db.scalars(
        select(LedgerActivityLog)
        .where(LedgerActivityLog.ledger_id == ledger_id)
        .order_by(desc(LedgerActivityLog.created_at))
        .limit(100)
    ).all())


def add_entry(db: Session, ledger_id: uuid.UUID, data: AddEntryRequest) -> LedgerEntry:
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise ValueError("Ledger not found.")

    # Caller must be a member
    member = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == data.created_by.lower(),
        )
    )
    if not member:
        raise PermissionError("Only ledger members can add entries.")

    # Use entry date's month (allows past months)
    from datetime import date as date_type
    actual_date = data.entry_date if data.entry_date else date_type.today()
    month_str = actual_date.strftime("%Y-%m")
    month = db.scalar(
        select(LedgerMonth).where(
            LedgerMonth.ledger_id == ledger_id,
            LedgerMonth.month == month_str,
        )
    )
    # Auto-create month record if it doesn't exist yet
    if not month:
        month = LedgerMonth(ledger_id=ledger_id, month=month_str, status=MONTH_STATUS_OPEN)
        db.add(month)
        db.flush()

    entry = LedgerEntry(
        ledger_id=ledger_id,
        month_id=month.id,
        entry_date=actual_date,
        amount=data.total_amount,
        paid_by=data.paid_by.lower(),
        description=data.description.strip(),
        created_by=data.created_by.lower(),
    )
    db.add(entry)
    db.flush()

    for username_p, share_amt in data.shares.items():
        participant = LedgerEntryParticipant(
            entry_id=entry.id,
            username=username_p.lower(),
            share_amount=share_amt,
        )
        db.add(participant)

    _log_activity(db, ledger_id, data.created_by.lower(), "added",
                  data.description.strip(), data.total_amount, actual_date)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(db: Session, ledger_id: uuid.UUID, entry_id: uuid.UUID, data, username: str) -> LedgerEntry:
    username = username.lower()
    member = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == username,
        )
    )
    if not member:
        raise PermissionError("Only ledger members can edit entries.")

    entry = db.scalar(select(LedgerEntry).where(LedgerEntry.id == entry_id, LedgerEntry.ledger_id == ledger_id))
    if not entry:
        raise ValueError("Entry not found.")

    entry.amount = data.total_amount
    entry.description = data.description.strip()
    entry.paid_by = data.paid_by.lower()

    # Replace participants
    for p in list(entry.participants):
        db.delete(p)
    db.flush()

    for uname, share_amt in data.shares.items():
        db.add(LedgerEntryParticipant(entry_id=entry.id, username=uname.lower(), share_amount=share_amt))

    _log_activity(db, ledger_id, username, "updated",
                  data.description.strip(), data.total_amount, entry.entry_date)
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, ledger_id: uuid.UUID, entry_id: uuid.UUID, username: str) -> None:
    member = db.scalar(
        select(LedgerMember).where(LedgerMember.ledger_id == ledger_id, LedgerMember.username == username)
    )
    if not member:
        raise PermissionError("Only ledger members can delete entries.")
    entry = db.scalar(select(LedgerEntry).where(LedgerEntry.id == entry_id, LedgerEntry.ledger_id == ledger_id))
    if not entry:
        raise ValueError("Entry not found.")
    desc_saved, amt_saved, date_saved = entry.description, float(entry.amount), entry.entry_date
    db.delete(entry)
    _log_activity(db, ledger_id, username, "deleted", desc_saved, amt_saved, date_saved)
    db.commit()


def close_month(db: Session, ledger_id: uuid.UUID, username: str, month_str: str | None = None) -> LedgerMonth:
    username = username.lower()

    member = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == username,
        )
    )
    if not member:
        raise PermissionError("Only ledger members can close a month.")

    target_month = month_str or _current_month_str()
    month = db.scalar(
        select(LedgerMonth).where(
            LedgerMonth.ledger_id == ledger_id,
            LedgerMonth.month == target_month,
        )
    )
    if not month:
        raise ValueError(f"Month {target_month} not found for this ledger.")
    if month.status == MONTH_STATUS_CLOSED:
        raise ValueError("This month is already closed.")

    month.status = MONTH_STATUS_CLOSED
    month.closed_at = datetime.now(timezone.utc)
    month.closed_by = username

    db.commit()
    db.refresh(month)
    return month


def reopen_month(db: Session, ledger_id: uuid.UUID, username: str, month_str: str | None = None) -> LedgerMonth:
    username = username.lower()

    member = db.scalar(
        select(LedgerMember).where(
            LedgerMember.ledger_id == ledger_id,
            LedgerMember.username == username,
        )
    )
    if not member:
        raise PermissionError("Only ledger members can reopen a month.")

    target_month = month_str or _current_month_str()
    month = db.scalar(
        select(LedgerMonth).where(
            LedgerMonth.ledger_id == ledger_id,
            LedgerMonth.month == target_month,
        )
    )
    if not month:
        raise ValueError(f"Month {target_month} not found for this ledger.")
    if month.status == MONTH_STATUS_OPEN:
        raise ValueError("This month is already open.")

    month.status = MONTH_STATUS_OPEN
    month.closed_at = None
    month.closed_by = None
    db.commit()
    db.refresh(month)
    return month
