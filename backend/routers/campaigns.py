from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
import models
import auth

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignCreate(BaseModel):
    name: str
    goal: str
    product_name: str
    product_description: str
    target_audience: str
    budget: Optional[str] = None
    language: str = "he"
    platforms: list[str] = ["facebook", "google", "tiktok"]


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    target_audience: Optional[str] = None
    budget: Optional[str] = None
    language: Optional[str] = None
    platforms: Optional[list[str]] = None
    status: Optional[str] = None


@router.post("/")
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = models.Campaign(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return _serialize(campaign)


@router.get("/")
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaigns = db.query(models.Campaign).filter(
        models.Campaign.user_id == current_user.id
    ).order_by(models.Campaign.created_at.desc()).all()
    return [_serialize(c) for c in campaigns]


@router.get("/{campaign_id}")
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = _get_owned(campaign_id, current_user.id, db)
    result = _serialize(campaign)
    result["copy_variants"] = [
        {
            "id": v.id, "platform": v.platform, "language": v.language,
            "variant_type": v.variant_type, "content": v.content, "is_selected": v.is_selected
        }
        for v in campaign.copy_variants
    ]
    result["audiences"] = [
        {
            "id": a.id, "platform": a.platform, "name": a.name,
            "age_min": a.age_min, "age_max": a.age_max, "genders": a.genders,
            "interests": a.interests, "behaviors": a.behaviors, "locations": a.locations
        }
        for a in campaign.audiences
    ]
    result["assets"] = [
        {
            "id": a.id, "original_filename": a.original_filename,
            "file_type": a.file_type, "resized_variants": a.resized_variants
        }
        for a in campaign.assets
    ]
    return result


@router.put("/{campaign_id}")
def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = _get_owned(campaign_id, current_user.id, db)
    for field, value in data.dict(exclude_none=True).items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)
    return _serialize(campaign)


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = _get_owned(campaign_id, current_user.id, db)
    db.delete(campaign)
    db.commit()
    return {"message": "הקמפיין נמחק"}


def _get_owned(campaign_id: int, user_id: int, db: Session) -> models.Campaign:
    c = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.user_id == user_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")
    return c


def _serialize(c: models.Campaign) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "goal": c.goal,
        "product_name": c.product_name,
        "product_description": c.product_description,
        "target_audience": c.target_audience,
        "budget": c.budget,
        "language": c.language,
        "platforms": c.platforms,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
