"""
Auth Router – User Registration, Login, and Profile.

Endpoints:
  POST /api/auth/register  – Create a new user account
  POST /api/auth/login     – Authenticate and receive a JWT
  GET  /api/auth/me        – Return the current user's profile
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from models import TokenResponse, UserLogin, UserProfile, UserRegister
from orm_models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user account.

    - email must be unique
    - password is hashed with bcrypt before storage
    - role defaults to 'viewer'; set to 'admin' explicitly if needed
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{payload.email}' already exists.",
        )

    if payload.role not in ("viewer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'viewer' or 'admin'.",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()  # Get the generated ID before commit
    logger.info("New user registered: %s (role=%s)", user.email, user.role)

    return UserProfile(id=user.id, email=user.email, role=user.role)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a signed JWT access token.

    Returns a 401 for both wrong email and wrong password
    (deliberately vague to prevent user enumeration).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(subject=user.email, role=user.role)
    logger.info("User logged in: %s", user.email)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
    )


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return UserProfile(id=current_user.id, email=current_user.email, role=current_user.role)
