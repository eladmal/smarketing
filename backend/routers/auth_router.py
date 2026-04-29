from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
import models
import auth

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str | None = None
    business_type: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    business_name: str | None
    business_type: str | None

    class Config:
        from_attributes = True


@router.post("/register", response_model=dict)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="אימייל כבר רשום במערכת")

    user = models.User(
        email=req.email,
        hashed_password=auth.hash_password(req.password),
        full_name=req.full_name,
        business_name=req.business_name,
        business_type=req.business_type
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.from_orm(user).dict()}


@router.post("/login", response_model=dict)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.from_orm(user).dict()}


@router.get("/me", response_model=UserResponse)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    for field in ["full_name", "business_name", "business_type"]:
        if field in data:
            setattr(current_user, field, data[field])
    db.commit()
    db.refresh(current_user)
    return current_user
