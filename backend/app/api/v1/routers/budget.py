"""Personal budget planner — plans & transactions."""

from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.ledger import BudgetPlan, BudgetTransaction, Goal, GoalEntry

router = APIRouter(prefix="/budget")

# ── Schemas ──────────────────────────────────────────────────────────────────

CATEGORIES = {"income", "bills", "expenses", "savings", "debt"}


class TxIn(BaseModel):
    tx_date: date
    amount: float = Field(..., ge=0)
    category: str
    subcategory: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=300)


class TxOut(BaseModel):
    id: str
    tx_date: date
    amount: float
    category: str
    subcategory: str
    notes: Optional[str]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class SummaryRow(BaseModel):
    category: str
    budget: float
    actual: float
    left: float


class SummaryOut(BaseModel):
    month: str
    rows: list[SummaryRow]
    total_left: float


class BreakdownRow(BaseModel):
    subcategory: str
    total: float
    pct: float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_category(cat: str):
    if cat not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(CATEGORIES)}")


def _tx_out(t: BudgetTransaction) -> dict:
    updated = getattr(t, "updated_at", None)
    return {"id": str(t.id), "tx_date": t.tx_date, "amount": float(t.amount),
            "category": t.category, "subcategory": t.subcategory, "notes": t.notes,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": updated.isoformat() if updated else None}


# ── Transactions ──────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=list[TxOut])
def list_transactions(
    username: str = Query(...),
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    q = select(BudgetTransaction).where(BudgetTransaction.username == username)
    if month:
        q = q.where(func.to_char(BudgetTransaction.tx_date, 'YYYY-MM') == month)
    q = q.order_by(BudgetTransaction.tx_date.desc(), BudgetTransaction.created_at.desc())
    rows = db.scalars(q).all()
    return [_tx_out(r) for r in rows]


@router.post("/transactions", response_model=TxOut, status_code=status.HTTP_201_CREATED)
def add_transaction(body: TxIn, username: str = Query(...), db: Session = Depends(get_db)):
    _validate_category(body.category)
    tx = BudgetTransaction(
        username=username,
        tx_date=body.tx_date,
        amount=body.amount,
        category=body.category,
        subcategory=body.subcategory,
        notes=body.notes,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return _tx_out(tx)


class TxUpdate(BaseModel):
    tx_date: date
    amount: float = Field(..., ge=0)
    notes: Optional[str] = Field(None, max_length=300)


@router.put("/transactions/{tx_id}", response_model=TxOut)
def update_transaction(tx_id: str, body: TxUpdate, username: str = Query(...), db: Session = Depends(get_db)):
    tx = db.scalar(select(BudgetTransaction).where(BudgetTransaction.id == uuid.UUID(tx_id), BudgetTransaction.username == username))
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    from datetime import datetime, timezone
    tx.tx_date = body.tx_date
    tx.amount = body.amount
    tx.notes = body.notes
    tx.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tx)
    return _tx_out(tx)


@router.delete("/transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(tx_id: str, username: str = Query(...), db: Session = Depends(get_db)):
    tx = db.scalar(select(BudgetTransaction).where(BudgetTransaction.id == uuid.UUID(tx_id), BudgetTransaction.username == username))
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    db.delete(tx)
    db.commit()


# ── Summary ───────────────────────────────────────────────────────────────────

@router.get("/summary/{month}", response_model=SummaryOut)
def get_summary(month: str, username: str = Query(...), db: Session = Depends(get_db)):
    plans = db.scalars(
        select(BudgetPlan).where(BudgetPlan.username == username, BudgetPlan.month == month)
    ).all()
    txs = db.scalars(
        select(BudgetTransaction).where(
            BudgetTransaction.username == username,
            func.to_char(BudgetTransaction.tx_date, 'YYYY-MM') == month,
        )
    ).all()

    budget_by_cat: dict[str, float] = {}
    for p in plans:
        budget_by_cat[p.category] = budget_by_cat.get(p.category, 0) + float(p.budget_amount)

    actual_by_cat: dict[str, float] = {}
    for t in txs:
        actual_by_cat[t.category] = actual_by_cat.get(t.category, 0) + float(t.amount)

    rows = []
    for cat in ["income", "bills", "expenses", "savings", "debt"]:
        b = budget_by_cat.get(cat, 0)
        a = actual_by_cat.get(cat, 0)
        rows.append(SummaryRow(category=cat, budget=b, actual=a, left=b - a))

    income_actual = actual_by_cat.get("income", 0)
    total_out = sum(actual_by_cat.get(c, 0) for c in ["bills", "expenses", "savings", "debt"])
    total_left = income_actual - total_out

    return SummaryOut(month=month, rows=rows, total_left=total_left)


@router.get("/breakdown/{month}", response_model=list[BreakdownRow])
def get_breakdown(month: str, username: str = Query(...), db: Session = Depends(get_db)):
    txs = db.scalars(
        select(BudgetTransaction).where(
            BudgetTransaction.username == username,
            func.to_char(BudgetTransaction.tx_date, 'YYYY-MM') == month,
        )
    ).all()

    totals: dict[str, float] = {}
    for t in txs:
        totals[t.subcategory] = totals.get(t.subcategory, 0) + float(t.amount)

    grand = sum(totals.values()) or 1
    result = [
        BreakdownRow(subcategory=k, total=v, pct=round(v / grand * 100, 2))
        for k, v in sorted(totals.items(), key=lambda x: -x[1])
    ]
    return result


# ── Goals ─────────────────────────────────────────────────────────────────────

class GoalIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_date: date
    goal_date: date
    goal_amount: float = Field(..., gt=0)
    starting_amount: float = Field(0, ge=0)


class GoalOut(BaseModel):
    id: str
    name: str
    start_date: date
    goal_date: date
    goal_amount: float
    starting_amount: float
    total_saved: float
    monthly_target: float
    progress_pct: float


class GoalEntryIn(BaseModel):
    goal_id: str
    entry_date: date
    amount: float = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=300)


class GoalEntryOut(BaseModel):
    id: str
    goal_id: str
    goal_name: str
    entry_date: date
    amount: float
    notes: Optional[str]


def _goal_out(g: Goal) -> dict:
    total_saved = g.starting_amount + sum(float(e.amount) for e in g.entries)
    goal_amt = float(g.goal_amount)
    start_amt = float(g.starting_amount)
    # months between start and goal date
    months = max(1, (g.goal_date.year - g.start_date.year) * 12 + (g.goal_date.month - g.start_date.month))
    monthly_target = (goal_amt - start_amt) / months
    progress_pct = round(min(total_saved / goal_amt * 100, 100), 2) if goal_amt > 0 else 0
    return {
        "id": str(g.id), "name": g.name,
        "start_date": g.start_date, "goal_date": g.goal_date,
        "goal_amount": goal_amt, "starting_amount": float(g.starting_amount),
        "total_saved": total_saved, "monthly_target": round(monthly_target, 2),
        "progress_pct": progress_pct,
    }


@router.get("/goals", response_model=list[GoalOut])
def list_goals(username: str = Query(...), db: Session = Depends(get_db)):
    goals = db.scalars(select(Goal).where(Goal.username == username).order_by(Goal.created_at)).all()
    return [_goal_out(g) for g in goals]


@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(body: GoalIn, username: str = Query(...), db: Session = Depends(get_db)):
    g = Goal(username=username, name=body.name, start_date=body.start_date,
              goal_date=body.goal_date, goal_amount=body.goal_amount, starting_amount=body.starting_amount)
    db.add(g)
    db.commit()
    db.refresh(g)
    return _goal_out(g)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: str, username: str = Query(...), db: Session = Depends(get_db)):
    g = db.scalar(select(Goal).where(Goal.id == uuid.UUID(goal_id), Goal.username == username))
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found.")
    db.delete(g)
    db.commit()


# ── Goal Entries ──────────────────────────────────────────────────────────────

@router.get("/goal-entries", response_model=list[GoalEntryOut])
def list_goal_entries(username: str = Query(...), db: Session = Depends(get_db)):
    entries = db.scalars(
        select(GoalEntry).where(GoalEntry.username == username)
        .order_by(GoalEntry.entry_date.desc(), GoalEntry.created_at.desc())
    ).all()
    goal_map = {str(g.id): g.name for g in db.scalars(select(Goal).where(Goal.username == username)).all()}
    return [{
        "id": str(e.id), "goal_id": str(e.goal_id),
        "goal_name": goal_map.get(str(e.goal_id), "—"),
        "entry_date": e.entry_date, "amount": float(e.amount), "notes": e.notes,
    } for e in entries]


@router.post("/goal-entries", response_model=GoalEntryOut, status_code=status.HTTP_201_CREATED)
def add_goal_entry(body: GoalEntryIn, username: str = Query(...), db: Session = Depends(get_db)):
    g = db.scalar(select(Goal).where(Goal.id == uuid.UUID(body.goal_id), Goal.username == username))
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found.")
    e = GoalEntry(goal_id=uuid.UUID(body.goal_id), username=username,
                  entry_date=body.entry_date, amount=body.amount, notes=body.notes)
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": str(e.id), "goal_id": str(e.goal_id), "goal_name": g.name,
            "entry_date": e.entry_date, "amount": float(e.amount), "notes": e.notes}


@router.delete("/goal-entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal_entry(entry_id: str, username: str = Query(...), db: Session = Depends(get_db)):
    e = db.scalar(select(GoalEntry).where(GoalEntry.id == uuid.UUID(entry_id), GoalEntry.username == username))
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found.")
    db.delete(e)
    db.commit()
