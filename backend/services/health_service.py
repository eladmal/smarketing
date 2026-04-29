"""
Campaign Health Monitoring Service
=====================================
Checks campaigns in real-time for issues:
- Budget exhaustion
- Low CTR / high frequency
- Platform errors
- Stalled delivery
- Token expiration
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional


HEALTH_THRESHOLDS = {
    "min_ctr": 0.5,           # CTR below 0.5% = warning
    "max_frequency": 4.0,     # Frequency above 4 = warning (ad fatigue)
    "min_roas": 1.0,          # ROAS below 1.0 = losing money
    "max_cpc_multiplier": 3,  # CPC 3x above campaign average = warning
    "stale_hours": 24,        # No new metrics in 24h = warning
    "token_expire_days": 3,   # Token expiring in 3 days = warning
}


async def run_health_check(campaign_id: int, db: Session) -> dict:
    """
    Full health check for a single campaign.
    Returns health status and creates alerts for issues found.
    """
    import models

    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        return {"status": "error", "issues": []}

    issues = []
    warnings = []

    # 1. Check metrics freshness
    freshness_issues = _check_metrics_freshness(campaign, db)
    issues.extend(freshness_issues)

    # 2. Check performance KPIs
    kpi_issues = _check_kpis(campaign, db)
    warnings.extend([i for i in kpi_issues if i["severity"] == "warning"])
    issues.extend([i for i in kpi_issues if i["severity"] == "error"])

    # 3. Check platform connections
    connection_issues = _check_platform_connections(campaign, db)
    issues.extend(connection_issues)

    # 4. Check copy completeness
    copy_issues = _check_copy_completeness(campaign, db)
    warnings.extend(copy_issues)

    # Determine overall status
    if issues:
        status = "error"
    elif warnings:
        status = "warning"
    else:
        status = "healthy"

    # Update campaign health status
    campaign.health_status = status
    campaign.last_health_check = datetime.utcnow()

    # Create alerts for new issues
    all_problems = issues + warnings
    for problem in all_problems:
        _create_health_alert(campaign, problem, db)

    db.commit()

    return {
        "status": status,
        "issues": issues,
        "warnings": warnings,
        "checked_at": datetime.utcnow().isoformat(),
    }


def _check_metrics_freshness(campaign, db) -> list:
    """Alert if no metrics data has been recorded recently."""
    import models

    if campaign.status not in ("live", "exported"):
        return []

    issues = []
    for platform in (campaign.platforms or []):
        latest = db.query(models.CampaignMetrics).filter(
            models.CampaignMetrics.campaign_id == campaign.id,
            models.CampaignMetrics.platform == platform
        ).order_by(models.CampaignMetrics.recorded_at.desc()).first()

        if not latest:
            continue

        age_hours = (datetime.utcnow() - latest.recorded_at).total_seconds() / 3600
        if age_hours > HEALTH_THRESHOLDS["stale_hours"]:
            issues.append({
                "severity": "warning",
                "code": "stale_metrics",
                "platform": platform,
                "title": f"מדדי {platform} לא עודכנו",
                "message": f"לא התקבלו נתונים חדשים מ-{platform} מזה {int(age_hours)} שעות",
            })
    return issues


def _check_kpis(campaign, db) -> list:
    """Check performance KPIs against thresholds."""
    import models

    issues = []
    for platform in (campaign.platforms or []):
        latest = db.query(models.CampaignMetrics).filter(
            models.CampaignMetrics.campaign_id == campaign.id,
            models.CampaignMetrics.platform == platform
        ).order_by(models.CampaignMetrics.recorded_at.desc()).first()

        if not latest or latest.impressions < 100:
            continue

        if latest.ctr < HEALTH_THRESHOLDS["min_ctr"] and latest.impressions > 500:
            issues.append({
                "severity": "warning",
                "code": "low_ctr",
                "platform": platform,
                "title": f"CTR נמוך ב-{platform}",
                "message": f"אחוז הקליקים עומד על {latest.ctr:.2f}% — מתחת לסף המינימום של {HEALTH_THRESHOLDS['min_ctr']}%",
            })

        if latest.frequency > HEALTH_THRESHOLDS["max_frequency"]:
            issues.append({
                "severity": "warning",
                "code": "high_frequency",
                "platform": platform,
                "title": f"עייפות מודעה ב-{platform}",
                "message": f"תדירות: {latest.frequency:.1f}x — הקהל כבר ראה את המודעה יותר מדי פעמים. מומלץ לחדש קריאייטיב",
            })

        if latest.roas > 0 and latest.roas < HEALTH_THRESHOLDS["min_roas"]:
            issues.append({
                "severity": "error",
                "code": "negative_roas",
                "platform": platform,
                "title": f"ROAS שלילי ב-{platform}",
                "message": f"החזר על הוצאות פרסום: {latest.roas:.2f} — מוציאים יותר ממה שמכניסים",
            })

    return issues


def _check_platform_connections(campaign, db) -> list:
    """Check that required platform tokens are valid and not expiring."""
    import models

    issues = []
    for platform in (campaign.platforms or []):
        conn = db.query(models.PlatformConnection).filter(
            models.PlatformConnection.user_id == campaign.user_id,
            models.PlatformConnection.platform == platform,
        ).first()

        if not conn or conn.status != "connected":
            issues.append({
                "severity": "warning",
                "code": "platform_not_connected",
                "platform": platform,
                "title": f"{platform} לא מחובר",
                "message": f"חשבון {platform} לא מחובר — קמפיין לא יפורסם אוטומטית",
            })
            continue

        if conn.token_expires_at:
            days_left = (conn.token_expires_at - datetime.utcnow()).days
            if days_left <= HEALTH_THRESHOLDS["token_expire_days"]:
                issues.append({
                    "severity": "warning",
                    "code": "token_expiring",
                    "platform": platform,
                    "title": f"חיבור {platform} עומד לפוג",
                    "message": f"הטוקן של {platform} יפוג בעוד {days_left} ימים — יש לחבר מחדש",
                })

    return issues


def _check_copy_completeness(campaign, db) -> list:
    """Verify all platforms have copy."""
    import models

    issues = []
    for platform in (campaign.platforms or []):
        count = db.query(models.CopyVariant).filter(
            models.CopyVariant.campaign_id == campaign.id,
            models.CopyVariant.platform == platform
        ).count()

        if count == 0:
            issues.append({
                "severity": "warning",
                "code": "missing_copy",
                "platform": platform,
                "title": f"חסר קופי ל-{platform}",
                "message": f"לא נוצר טקסט שיווקי לפלטפורמת {platform}",
            })

    return issues


def _create_health_alert(campaign, issue: dict, db) -> None:
    """Create a de-duplicated alert for the issue."""
    import models

    # Don't duplicate alerts created in last 6 hours
    recent = db.query(models.Alert).filter(
        models.Alert.campaign_id == campaign.id,
        models.Alert.category == "health",
        models.Alert.title == issue["title"],
        models.Alert.created_at > datetime.utcnow() - timedelta(hours=6)
    ).first()

    if recent:
        return

    db.add(models.Alert(
        user_id=campaign.user_id,
        campaign_id=campaign.id,
        severity=issue["severity"],
        category="health",
        title=issue["title"],
        message=issue["message"],
        action_url=f"/campaigns/{campaign.id}",
    ))
