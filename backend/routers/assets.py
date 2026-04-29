from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import aiofiles
from database import get_db
import models
import auth
from services.image_service import resize_for_all_platforms, get_platform_sizes_info
from services.export_service import create_campaign_export

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/assets")
EXPORT_DIR = os.getenv("EXPORT_DIR", "exports")
router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/platform-sizes")
def platform_sizes():
    return get_platform_sizes_info()


@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    campaign_id: Optional[int] = Form(None),
    platforms: str = Form("facebook,instagram,google,tiktok"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך. השתמש ב-JPG, PNG, WEBP")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    requested_platforms = [p.strip() for p in platforms.split(",")]
    output_dir = os.path.join(UPLOAD_DIR, "resized", uuid.uuid4().hex[:8])
    resized = resize_for_all_platforms(file_path, requested_platforms, output_dir)

    asset = models.Asset(
        user_id=current_user.id,
        campaign_id=campaign_id,
        original_filename=file.filename,
        file_path=file_path,
        file_type="image",
        resized_variants=resized
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "id": asset.id,
        "original_filename": asset.original_filename,
        "file_type": asset.file_type,
        "resized_variants": resized
    }


@router.get("/")
def list_assets(
    campaign_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Asset).filter(models.Asset.user_id == current_user.id)
    if campaign_id:
        query = query.filter(models.Asset.campaign_id == campaign_id)
    assets = query.order_by(models.Asset.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "original_filename": a.original_filename,
            "file_type": a.file_type,
            "campaign_id": a.campaign_id,
            "resized_variants": a.resized_variants,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in assets
    ]


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    asset = db.query(models.Asset).filter(
        models.Asset.id == asset_id,
        models.Asset.user_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="נכס לא נמצא")

    if os.path.exists(asset.file_path):
        os.remove(asset.file_path)

    db.delete(asset)
    db.commit()
    return {"message": "נמחק"}


@router.post("/export/{campaign_id}")
def export_campaign(
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

    copy_variants = [
        {
            "platform": cv.platform,
            "language": cv.language,
            "variant_type": cv.variant_type,
            "content": cv.content,
            "is_selected": cv.is_selected
        }
        for cv in campaign.copy_variants
    ]

    audiences = [
        {
            "platform": a.platform,
            "name": a.name,
            "age_min": a.age_min,
            "age_max": a.age_max,
            "genders": a.genders,
            "locations": a.locations,
            "interests": a.interests,
            "behaviors": a.behaviors
        }
        for a in campaign.audiences
    ]

    asset_paths = []
    for asset in campaign.assets:
        for variant in (asset.resized_variants or []):
            if isinstance(variant, dict) and variant.get("path"):
                asset_paths.append(variant)

    zip_path = create_campaign_export(
        campaign_name=campaign.name,
        copy_variants=copy_variants,
        audiences=audiences,
        asset_paths=asset_paths
    )

    campaign.status = "exported"
    db.commit()

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=os.path.basename(zip_path)
    )
