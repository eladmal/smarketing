from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import auth
from services.platform_service import (
    get_oauth_url, exchange_code_for_tokens,
    get_account_info, get_platforms_info,
    publish_campaign_to_platform
)

router = APIRouter(prefix="/integrations", tags=["integrations"])

PLATFORMS = ["facebook", "instagram", "google", "tiktok"]


@router.get("/platforms")
def list_platforms(current_user: models.User = Depends(auth.get_current_user)):
    """Return all platforms with display info (no credentials)."""
    return get_platforms_info()


@router.get("/connections")
def list_connections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Return all platform connection statuses for the current user."""
    connections = {p: {"platform": p, "status": "disconnected"} for p in PLATFORMS}

    existing = db.query(models.PlatformConnection).filter(
        models.PlatformConnection.user_id == current_user.id
    ).all()

    for conn in existing:
        connections[conn.platform] = {
            "platform": conn.platform,
            "status": conn.status,
            "account_name": conn.account_name,
            "account_id": conn.account_id,
            "connected_at": conn.connected_at.isoformat() if conn.connected_at else None,
            "token_expires_at": conn.token_expires_at.isoformat() if conn.token_expires_at else None,
        }

    return list(connections.values())


@router.get("/connect/{platform}")
def get_connect_url(
    platform: str,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get OAuth URL to initiate connection for a platform."""
    if platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail="פלטפורמה לא נתמכת")

    result = get_oauth_url(platform, current_user.id)
    return result


@router.post("/callback/{platform}")
async def oauth_callback(
    platform: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Handle OAuth callback — exchange code for tokens and save connection."""
    if platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail="פלטפורמה לא נתמכת")

    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="קוד אימות חסר")

    try:
        tokens = await exchange_code_for_tokens(platform, code, current_user.id)
        account_info = await get_account_info(platform, tokens["access_token"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה בחיבור: {str(e)}")

    # Upsert connection
    conn = db.query(models.PlatformConnection).filter(
        models.PlatformConnection.user_id == current_user.id,
        models.PlatformConnection.platform == platform,
    ).first()

    if not conn:
        conn = models.PlatformConnection(user_id=current_user.id, platform=platform)
        db.add(conn)

    conn.status = "connected"
    conn.access_token = tokens.get("access_token")
    conn.refresh_token = tokens.get("refresh_token")
    conn.token_expires_at = tokens.get("expires_at")
    conn.account_id = account_info.get("account_id")
    conn.account_name = account_info.get("account_name")
    conn.connected_at = datetime.utcnow()
    conn.updated_at = datetime.utcnow()

    db.commit()

    # Alert
    db.add(models.Alert(
        user_id=current_user.id,
        severity="success",
        category="platform",
        title=f"{platform} חובר בהצלחה",
        message=f"חשבון '{account_info.get('account_name')}' מחובר ומוכן לפרסום",
    ))
    db.commit()

    return {
        "status": "connected",
        "platform": platform,
        "account_name": account_info.get("account_name"),
    }


@router.delete("/disconnect/{platform}")
def disconnect_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Disconnect a platform."""
    conn = db.query(models.PlatformConnection).filter(
        models.PlatformConnection.user_id == current_user.id,
        models.PlatformConnection.platform == platform,
    ).first()

    if conn:
        conn.status = "disconnected"
        conn.access_token = None
        conn.refresh_token = None
        db.commit()

    return {"status": "disconnected", "platform": platform}


@router.post("/publish/{campaign_id}")
async def publish_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Publish a campaign to all its connected platforms."""
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    results = {}
    external_ids = dict(campaign.external_ids or {})

    for platform in (campaign.platforms or []):
        conn = db.query(models.PlatformConnection).filter(
            models.PlatformConnection.user_id == current_user.id,
            models.PlatformConnection.platform == platform,
            models.PlatformConnection.status == "connected",
        ).first()

        if not conn:
            results[platform] = {"success": False, "error": f"{platform} לא מחובר"}
            continue

        result = await publish_campaign_to_platform(
            platform=platform,
            access_token=conn.access_token,
            account_id=conn.account_id or "",
            campaign_data={"id": campaign.id, "name": campaign.name, "goal": campaign.goal}
        )
        results[platform] = result

        if result.get("success"):
            external_ids[platform] = result.get("external_id")

    campaign.external_ids = external_ids
    if any(r.get("success") for r in results.values()):
        campaign.status = "live"

    db.commit()

    db.add(models.Alert(
        user_id=current_user.id,
        campaign_id=campaign_id,
        severity="success" if campaign.status == "live" else "warning",
        category="platform",
        title=f"קמפיין '{campaign.name}' פורסם",
        message="\n".join([f"{p}: {'✅' if r.get('success') else '❌'} {r.get('message', r.get('error', ''))}" for p, r in results.items()]),
        action_url=f"/campaigns/{campaign_id}",
    ))
    db.commit()

    return {"campaign_id": campaign_id, "status": campaign.status, "results": results}
