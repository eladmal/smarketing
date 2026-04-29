from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
import auth
from services.claude_service import generate_audience_suggestions

router = APIRouter(prefix="/audiences", tags=["audiences"])


class GenerateAudienceRequest(BaseModel):
    campaign_id: int


class AudienceCreate(BaseModel):
    campaign_id: int
    platform: str
    name: str
    age_min: int = 18
    age_max: int = 65
    genders: list[str] = ["all"]
    locations: list[str] = []
    interests: list[str] = []
    behaviors: list[str] = []
    languages: list[str] = []
    custom_audiences: Optional[str] = None


@router.post("/generate")
async def generate_audiences(
    req: GenerateAudienceRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == req.campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    try:
        result = await generate_audience_suggestions(
            product_name=campaign.product_name,
            product_description=campaign.product_description,
            goal=campaign.goal,
            platforms=campaign.platforms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בייצור קהלים: {str(e)}")

    db.query(models.Audience).filter(
        models.Audience.campaign_id == campaign.id
    ).delete()

    saved = []
    for platform, aud_data in result.items():
        audience = models.Audience(
            campaign_id=campaign.id,
            platform=platform,
            name=f"קהל {platform} - {campaign.name}",
            age_min=aud_data.get("age_min", 18),
            age_max=aud_data.get("age_max", 65),
            genders=aud_data.get("genders", ["all"]),
            locations=aud_data.get("locations", []),
            interests=aud_data.get("interests", []),
            behaviors=aud_data.get("behaviors", []),
            languages=aud_data.get("languages", []),
            custom_audiences=str(aud_data.get("special_audiences", ""))
        )
        db.add(audience)
        saved.append({
            "platform": platform,
            "data": aud_data
        })

    db.commit()
    return {"status": "success", "audiences": saved, "raw": result}


@router.post("/")
def create_audience(
    data: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == data.campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    audience = models.Audience(**data.dict())
    db.add(audience)
    db.commit()
    db.refresh(audience)
    return audience


@router.get("/campaign/{campaign_id}")
def list_audiences(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    return campaign.audiences


@router.delete("/{audience_id}")
def delete_audience(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    aud = db.query(models.Audience).join(models.Campaign).filter(
        models.Audience.id == audience_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not aud:
        raise HTTPException(status_code=404, detail="לא נמצא")
    db.delete(aud)
    db.commit()
    return {"message": "נמחק"}
