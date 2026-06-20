"""
Transactions Router – Full CRUD.

Endpoints:
  GET    /api/transactions              – List transactions (all users)
  POST   /api/transactions             – Create transaction (admin only)
  PUT    /api/transactions/{id}        – Update transaction (admin only)
  DELETE /api/transactions/{id}        – Delete transaction (admin only)

Changes from original:
  - Replaced raw sqlite3 cursor with SQLAlchemy ORM
  - Added POST, PUT, DELETE endpoints (previously missing)
  - Auth guard on write operations (backend RBAC, not just frontend)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from auth import require_role
from database import get_db
from models import TransactionCreate, TransactionModel, TransactionUpdate
from orm_models import Category, Transaction

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_or_create_category(db: Session, name: str, tx_type: str) -> Category:
    """Look up a category by name, creating it if it doesn't exist."""
    cat = db.query(Category).filter(Category.name == name).first()
    if not cat:
        cat = Category(name=name, type=tx_type.lower())
        db.add(cat)
        db.flush()
        logger.info("Created new category: %s (%s)", name, tx_type)
    return cat


def _row_to_model(tx: Transaction) -> TransactionModel:
    """Convert a Transaction ORM object to its Pydantic response model."""
    cat_name = tx.category.name if tx.category else "Uncategorized"
    cat_type = tx.category.type if tx.category else "expense"
    return TransactionModel(
        id=tx.id,
        date=tx.date,
        amount=tx.amount,
        description=tx.description,
        category_name=cat_name,
        type=cat_type,
    )


@router.get("/transactions", response_model=List[TransactionModel])
def get_transactions(
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
):
    """
    Return a paginated list of transactions ordered by date descending.
    No authentication required (read-only public data).
    """
    rows = (
        db.query(Transaction)
        .order_by(Transaction.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_row_to_model(tx) for tx in rows]


@router.post("/transactions", response_model=TransactionModel, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Create a new transaction. Admin only.

    - Amount is stored as positive for income, negative for expense.
    - Category is created automatically if it doesn't exist.
    - No source_hash is set (manually created transactions are not ETL records).
    """
    cat_type = "income" if payload.type.lower() == "income" else "expense"
    cat = _get_or_create_category(db, payload.category, cat_type)

    # Store income as positive, expense as negative (convention used throughout)
    stored_amount = payload.amount if cat_type == "income" else -abs(payload.amount)

    tx = Transaction(
        date=payload.date,
        amount=stored_amount,
        description=payload.description,
        category_id=cat.id,
        source_hash=None,  # Manually created — no ETL hash
    )
    db.add(tx)
    db.flush()
    logger.info("Transaction created: id=%d date=%s amount=%.2f", tx.id, tx.date, tx.amount)
    return _row_to_model(tx)


@router.put("/transactions/{transaction_id}", response_model=TransactionModel)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Update an existing transaction by ID. Admin only.
    Only provided fields are updated (partial update semantics).
    """
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id={transaction_id} not found.",
        )

    if payload.date is not None:
        tx.date = payload.date
    if payload.description is not None:
        tx.description = payload.description
    if payload.category is not None:
        tx_type = payload.type or (tx.category.type if tx.category else "expense")
        cat = _get_or_create_category(db, payload.category, tx_type)
        tx.category_id = cat.id
    if payload.amount is not None and payload.type is not None:
        cat_type = "income" if payload.type.lower() == "income" else "expense"
        tx.amount = payload.amount if cat_type == "income" else -abs(payload.amount)
    elif payload.amount is not None:
        # Keep same sign convention as before
        tx.amount = abs(payload.amount) if tx.amount >= 0 else -abs(payload.amount)

    db.flush()
    logger.info("Transaction updated: id=%d", transaction_id)
    return _row_to_model(tx)


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Delete a transaction by ID. Admin only.
    Returns 204 No Content on success.
    """
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id={transaction_id} not found.",
        )
    db.delete(tx)
    db.commit()
    logger.info("Transaction deleted: id=%d", transaction_id)
