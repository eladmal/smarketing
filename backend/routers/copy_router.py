from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
import auth
from services.claude_service import generate_campaign_copy, improve_copy

router = APIRouter(prefix="/copy", tags=["copy"])


class GenerateCopyRequest(BaseModel):
    campaign_id: int
    tone: Optional[str] = None


class ImproveCopyRequest(BaseModel):
    copy_id: int
    feedback: str


class SaveCopyRequest(BaseModel):
    campaign_id: int
    platform: str
    language: str
    variant_type: str
    content: str


@router.post("/generate")
async def generate_copy(
    req: GenerateCopyRequest,
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
        result = await generate_campaign_copy(
            product_name=campaign.product_name,
            product_description=campaign.product_description,
            business_name=current_user.business_name or current_user.full_name,
            goal=campaign.goal,
            target_audience=campaign.target_audience,
            platforms=campaign.platforms,
            language=campaign.language,
            tone=req.tone
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בייצור קופי: {str(e)}")

    # Save generated variants to DB
    saved = []
    db.query(models.CopyVariant).filter(
        models.CopyVariant.campaign_id == campaign.id
    ).delete()

    for platform, data in result.items():
        for i, variant in enumerate(data.get("variants", []), 1):
            for vtype in ["headline", "body", "cta"]:
                content = variant.get(vtype, "")
                if content:
                    cv = models.CopyVariant(
                        campaign_id=campaign.id,
                        platform=platform,
                        language=campaign.language,
                        variant_type=vtype,
                        content=content,
                        is_selected=(i == 1)
                    )
                    db.add(cv)
                    saved.append({
                        "platform": platform,
                        "variant_num": i,
                        "type": vtype,
                        "content": content
                    })

    db.commit()
    return {"status": "success", "platforms": list(result.keys()), "raw": result}


@router.post("/improve")
async def improve_copy_endpoint(
    req: ImproveCopyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    copy_variant = db.query(models.CopyVariant).join(models.Campaign).filter(
        models.CopyVariant.id == req.copy_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not copy_variant:
        raise HTTPException(status_code=404, detail="קופי לא נמצא")

    campaign = copy_variant.campaign
    improved = await improve_copy(
        original_copy=copy_variant.content,
        platform=copy_variant.platform,
        goal=campaign.goal,
        feedback=req.feedback
    )

    copy_variant.content = improved
    db.commit()
    return {"id": copy_variant.id, "content": improved}


@router.post("/save")
def save_copy(
    req: SaveCopyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == req.campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    cv = models.CopyVariant(
        campaign_id=req.campaign_id,
        platform=req.platform,
        language=req.language,
        variant_type=req.variant_type,
        content=req.content
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return {"id": cv.id, "content": cv.content}


@router.delete("/{copy_id}")
def delete_copy(
    copy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    cv = db.query(models.CopyVariant).join(models.Campaign).filter(
        models.CopyVariant.id == copy_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not cv:
        raise HTTPException(status_code=404, detail="לא נמצא")
    db.delete(cv)
    db.commit()
    return {"message": "נמחק"}
