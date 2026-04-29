from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import auth
from services.health_service import run_health_check
from services.optimization_service import run_campaign_optimization

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/campaign/{campaign_id}")
def campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get full analytics for a campaign."""
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="קמפיין לא נמצא")

    # Latest metrics per platform
    metrics = {}
    for platform in (campaign.platforms or []):
        latest = db.query(models.CampaignMetrics).filter(
            models.CampaignMetrics.campaign_id == campaign_id,
            models.CampaignMetrics.platform == platform
        ).order_by(models.CampaignMetrics.recorded_at.desc()).first()
        if latest:
            metrics[platform] = {
                "impressions": latest.impressions,
                "clicks": latest.clicks,
                "ctr": latest.ctr,
                "cpc": latest.cpc,
                "cpm": latest.cpm,
                "spend": latest.spend,
                "conversions": latest.conversions,
                "roas": latest.roas,
                "reach": latest.reach,
                "frequency": latest.frequency,
                "recorded_at": latest.recorded_at.isoformat(),
            }

    # Optimization history
    opt_logs = db.query(models.OptimizationLog).filter(
        models.OptimizationLog.campaign_id == campaign_id
    ).order_by(models.OptimizationLog.started_at.desc()).limit(10).all()

    return {
        "campaign_id": campaign_id,
        "health_status": campaign.health_status,
        "last_health_check": campaign.last_health_check.isoformat() if campaign.last_health_check else None,
        "last_optimized_at": campaign.last_optimized_at.isoformat() if campaign.last_optimized_at else None,
        "metrics": metrics,
        "optimization_history": [
            {
                "id": log.id,
                "status": log.status,
                "triggered_by": log.triggered_by,
                "analysis": log.analysis,
                "changes_count": len(log.changes_applied or []),
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
            }
            for log in opt_logs
        ]
    }


@router.post("/health-check/{campaign_id}")
async def trigger_health_check(
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

    result = await run_health_check(campaign_id, db)
    return result


@router.post("/optimize/{campaign_id}")
async def trigger_optimization(
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

    result = await run_campaign_optimization(campaign_id, db, triggered_by="manual")
    return result


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Dashboard overview stats."""
    campaigns = db.query(models.Campaign).filter(
        models.Campaign.user_id == current_user.id
    ).all()

    healthy = sum(1 for c in campaigns if c.health_status == "healthy")
    warning = sum(1 for c in campaigns if c.health_status == "warning")
    error = sum(1 for c in campaigns if c.health_status == "error")
    live = sum(1 for c in campaigns if c.status == "live")

    unread_alerts = db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False
    ).count()

    return {
        "total_campaigns": len(campaigns),
        "live_campaigns": live,
        "healthy": healthy,
        "warning": warning,
        "error": error,
        "unread_alerts": unread_alerts,
    }
