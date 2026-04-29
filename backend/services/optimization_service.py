"""
Auto-Optimization Service
==========================
Runs every 48 hours per active campaign.
Analyzes metrics with Claude AI → generates recommendations → applies changes.
"""

import anthropic
import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def run_campaign_optimization(campaign_id: int, db: Session, triggered_by: str = "scheduler") -> dict:
    """
    Main optimization entry point.
    1. Pull latest metrics
    2. Ask Claude to analyze and recommend
    3. Apply changes to copy/audiences
    4. Log everything
    5. Create alert for user
    """
    import models

    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        return {"success": False, "error": "קמפיין לא נמצא"}

    # Create optimization log
    log = models.OptimizationLog(
        campaign_id=campaign_id,
        triggered_by=triggered_by,
        status="running",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        # Gather current metrics
        metrics = _gather_metrics(campaign, db)
        log.metrics_before = metrics

        # Get current copy
        copy_variants = [
            {"platform": v.platform, "type": v.variant_type, "content": v.content}
            for v in campaign.copy_variants[:12]
        ]

        # Ask Claude for analysis
        analysis_result = await _analyze_with_claude(campaign, metrics, copy_variants)

        log.analysis = analysis_result.get("analysis", "")
        log.recommendations = analysis_result.get("recommendations", [])

        # Apply approved changes
        changes_applied = await _apply_recommendations(
            campaign, analysis_result.get("recommendations", []), db
        )
        log.changes_applied = changes_applied

        # Update campaign
        campaign.last_optimized_at = datetime.utcnow()
        log.status = "done"
        log.completed_at = datetime.utcnow()

        # Create alert for user
        n_changes = len(changes_applied)
        alert = models.Alert(
            user_id=campaign.user_id,
            campaign_id=campaign_id,
            severity="success" if n_changes > 0 else "info",
            category="optimization",
            title=f"אופטימיזציה הושלמה — {campaign.name}",
            message=_build_alert_message(analysis_result, changes_applied),
            action_url=f"/campaigns/{campaign_id}",
        )
        db.add(alert)
        db.commit()

        return {"success": True, "changes": n_changes, "analysis": log.analysis}

    except Exception as e:
        log.status = "failed"
        log.analysis = str(e)
        db.commit()

        # Alert for failure
        alert = models.Alert(
            user_id=campaign.user_id,
            campaign_id=campaign_id,
            severity="error",
            category="optimization",
            title=f"שגיאה באופטימיזציה — {campaign.name}",
            message=f"האופטימיזציה האוטומטית נכשלה: {str(e)}",
            action_url=f"/campaigns/{campaign_id}",
        )
        db.add(alert)
        db.commit()
        return {"success": False, "error": str(e)}


async def _analyze_with_claude(campaign, metrics: dict, copy_variants: list) -> dict:
    """Use Claude to analyze metrics and generate optimization recommendations."""

    metrics_text = json.dumps(metrics, ensure_ascii=False, indent=2)
    copy_text = json.dumps(copy_variants[:6], ensure_ascii=False, indent=2)

    prompt = f"""אתה מומחה אופטימיזציה לקמפיינים דיגיטליים עם ניסיון של 10 שנים.
נתח את הקמפיין הבא וספק המלצות קונקרטיות.

**פרטי קמפיין:**
שם: {campaign.name}
מוצר: {campaign.product_name}
מטרה: {campaign.goal}
פלטפורמות: {", ".join(campaign.platforms or [])}

**מדדי ביצועים נוכחיים:**
{metrics_text}

**דוגמאות קופי נוכחי:**
{copy_text}

**ספק:**
1. ניתוח קצר (2-3 משפטים) — מה עובד, מה לא
2. רשימת המלצות קונקרטיות לשיפור

החזר JSON בלבד:
{{
  "analysis": "ניתוח קצר בעברית...",
  "performance_score": 7.5,
  "recommendations": [
    {{
      "type": "copy_update",
      "platform": "facebook",
      "priority": "high",
      "description": "עדכן את הכותרת — CTR נמוך מהממוצע",
      "suggested_content": "טקסט מוצע...",
      "expected_improvement": "שיפור CTR ב-15-25%"
    }}
  ]
}}

סוגי המלצות אפשריים: copy_update, audience_adjustment, budget_reallocation, schedule_change"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)


async def _apply_recommendations(campaign, recommendations: list, db) -> list:
    """Apply safe automatic changes. High-risk changes are only flagged."""
    import models

    applied = []

    for rec in recommendations:
        rec_type = rec.get("type")
        priority = rec.get("priority", "low")

        # Auto-apply: copy updates with suggested content
        if rec_type == "copy_update" and rec.get("suggested_content") and priority in ("high", "medium"):
            platform = rec.get("platform", "general")

            new_variant = models.CopyVariant(
                campaign_id=campaign.id,
                platform=platform,
                language=campaign.language,
                variant_type="headline",
                content=f"[🤖 אופטימיזציה] {rec['suggested_content']}",
                is_selected=False,
            )
            db.add(new_variant)
            applied.append({
                "type": "copy_added",
                "platform": platform,
                "description": rec.get("description"),
                "expected_improvement": rec.get("expected_improvement"),
            })

        # Log-only for budget/audience changes — require user approval
        elif rec_type in ("budget_reallocation", "audience_adjustment"):
            applied.append({
                "type": "recommendation_logged",
                "action": rec_type,
                "description": rec.get("description"),
                "requires_approval": True,
            })

    db.commit()
    return applied


def _gather_metrics(campaign, db) -> dict:
    """Aggregate latest metrics per platform."""
    import models

    result = {}
    for platform in (campaign.platforms or []):
        latest = db.query(models.CampaignMetrics).filter(
            models.CampaignMetrics.campaign_id == campaign.id,
            models.CampaignMetrics.platform == platform
        ).order_by(models.CampaignMetrics.recorded_at.desc()).first()

        if latest:
            result[platform] = {
                "impressions": latest.impressions,
                "clicks": latest.clicks,
                "ctr": latest.ctr,
                "cpc": latest.cpc,
                "spend": latest.spend,
                "conversions": latest.conversions,
                "roas": latest.roas,
                "frequency": latest.frequency,
            }
        else:
            result[platform] = {"status": "no_data", "message": "אין מדדים עדיין"}

    return result


def _build_alert_message(analysis_result: dict, changes_applied: list) -> str:
    score = analysis_result.get("performance_score", 0)
    analysis = analysis_result.get("analysis", "")
    auto_applied = [c for c in changes_applied if not c.get("requires_approval")]
    needs_approval = [c for c in changes_applied if c.get("requires_approval")]

    msg = f"ציון ביצועים: {score}/10\n{analysis}"
    if auto_applied:
        msg += f"\n\n✅ בוצעו {len(auto_applied)} שינויים אוטומטיים"
    if needs_approval:
        msg += f"\n\n⚠️ {len(needs_approval)} המלצות ממתינות לאישורך"
    return msg
