import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


LEDGER_STATUS_OPEN = "open"
LEDGER_STATUS_CLOSED = "closed"

MONTH_STATUS_OPEN = "open"
MONTH_STATUS_CLOSED = "closed"

MEMBER_ROLE_OWNER = "owner"
MEMBER_ROLE_MEMBER = "member"


class Profile(Base):
    """User profile. Username is the global unique identity."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    username_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verification_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    email_verification_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Ledger(Base):
    """A shared expense ledger owned by one member."""

    __tablename__ = "ledgers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=LEDGER_STATUS_OPEN, index=True
    )
    owner_username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    members: Mapped[list["LedgerMember"]] = relationship(
        "LedgerMember", back_populates="ledger", cascade="all, delete-orphan"
    )
    months: Mapped[list["LedgerMonth"]] = relationship(
        "LedgerMonth", back_populates="ledger", cascade="all, delete-orphan"
    )
    entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry", back_populates="ledger", cascade="all, delete-orphan",
        order_by="(LedgerEntry.entry_date, LedgerEntry.created_at)"
    )

    __table_args__ = (
        CheckConstraint(
            f"status IN ('{LEDGER_STATUS_OPEN}', '{LEDGER_STATUS_CLOSED}')",
            name="ck_ledgers_status",
        ),
    )


class LedgerMember(Base):
    """A username-identified member of a ledger."""

    __tablename__ = "ledger_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ledger_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=MEMBER_ROLE_MEMBER)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    ledger: Mapped["Ledger"] = relationship("Ledger", back_populates="members")

    __table_args__ = (
        UniqueConstraint("ledger_id", "username", name="uq_ledger_member_username"),
        CheckConstraint(
            f"role IN ('{MEMBER_ROLE_OWNER}', '{MEMBER_ROLE_MEMBER}')",
            name="ck_ledger_member_role",
        ),
    )


class LedgerMonth(Base):
    """Tracks each calendar month within a ledger (open or closed)."""

    __tablename__ = "ledger_months"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ledger_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=MONTH_STATUS_OPEN
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    closed_by: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    ledger: Mapped["Ledger"] = relationship("Ledger", back_populates="months")
    entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry", back_populates="month", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("ledger_id", "month", name="uq_ledger_month"),
        CheckConstraint(
            f"status IN ('{MONTH_STATUS_OPEN}', '{MONTH_STATUS_CLOSED}')",
            name="ck_ledger_month_status",
        ),
    )


class LedgerEntry(Base):
    """A single expense entry. entry_date must be today when submitted."""

    __tablename__ = "ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ledger_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    month_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledger_months.id", ondelete="CASCADE"), nullable=False, index=True
    )
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    paid_by: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_by: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    ledger: Mapped["Ledger"] = relationship("Ledger", back_populates="entries")
    month: Mapped["LedgerMonth"] = relationship("LedgerMonth", back_populates="entries")
    participants: Mapped[list["LedgerEntryParticipant"]] = relationship(
        "LedgerEntryParticipant", back_populates="entry", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_entry_amount_nonneg"),
    )


class LedgerEntryParticipant(Base):
    """Which members participated in (split) a ledger entry."""

    __tablename__ = "ledger_entry_participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledger_entries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    share_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    entry: Mapped["LedgerEntry"] = relationship("LedgerEntry", back_populates="participants")

    __table_args__ = (
        UniqueConstraint("entry_id", "username", name="uq_entry_participant"),
    )


class BudgetPlan(Base):
    """Monthly budget targets per category for a user."""

    __tablename__ = "budget_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    category: Mapped[str] = mapped_column(String(30), nullable=False)   # income|bills|expenses|savings|debt
    subcategory: Mapped[str] = mapped_column(String(100), nullable=False)
    budget_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("username", "month", "category", "subcategory", name="uq_budget_plan"),
        CheckConstraint("budget_amount >= 0", name="ck_budget_plan_amount"),
    )


class BudgetTransaction(Base):
    """A single financial transaction for personal budget tracking."""

    __tablename__ = "budget_transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tx_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)   # income|bills|expenses|savings|debt
    subcategory: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_budget_tx_amount"),
    )


class Goal(Base):
    """A savings goal for a user."""

    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    goal_date: Mapped[date] = mapped_column(Date, nullable=False)
    goal_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    starting_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    entries: Mapped[list["GoalEntry"]] = relationship("GoalEntry", back_populates="goal", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("goal_amount > 0", name="ck_goal_amount_pos"),
        CheckConstraint("starting_amount >= 0", name="ck_goal_starting_nonneg"),
    )


class GoalEntry(Base):
    """A contribution payment toward a savings goal."""

    __tablename__ = "goal_entries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    goal: Mapped["Goal"] = relationship("Goal", back_populates="entries")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_goal_entry_amount_pos"),
    )


class LedgerActivityLog(Base):
    """Audit trail of add/update/delete actions on ledger entries."""

    __tablename__ = "ledger_activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ledger_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # added / updated / deleted
    entry_description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    entry_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    entry_date: Mapped[str | None] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
