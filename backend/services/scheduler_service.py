"""
Background Scheduler
=====================
- Every 48 hours: run AI optimization on all live campaigns
- Every 30 minutes: health check on all active campaigns
- Every 6 hours: pull fresh metrics from connected platforms
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

logger = logging.getLogger("smarketing.scheduler")
scheduler = AsyncIOScheduler(timezone="Asia/Jerusalem")


def start_scheduler():
    if scheduler.running:
        return

    # Health check every 30 minutes
    scheduler.add_job(
        _run_health_checks_all,
        trigger=IntervalTrigger(minutes=30),
        id="health_check",
        name="Campaign Health Check",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # Metrics pull every 6 hours
    scheduler.add_job(
        _pull_metrics_all,
        trigger=IntervalTrigger(hours=6),
        id="metrics_pull",
        name="Pull Platform Metrics",
        replace_existing=True,
        misfire_grace_time=600,
    )

    # AI Optimization every 48 hours
    scheduler.add_job(
        _run_optimizations_all,
        trigger=IntervalTrigger(hours=48),
        id="auto_optimization",
        name="AI Auto-Optimization",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.start()
    logger.info("✅ Smarketing Scheduler started")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()


async def _run_health_checks_all():
    """Health check for all active campaigns."""
    from database import SessionLocal
    from services.health_service import run_health_check
    import models

    db = SessionLocal()
    try:
        campaigns = db.query(models.Campaign).filter(
            models.Campaign.status.in_(["live", "exported", "ready"])
        ).all()

        logger.info(f"Running health checks on {len(campaigns)} campaigns")
        for campaign in campaigns:
            try:
                await run_health_check(campaign.id, db)
            except Exception as e:
                logger.error(f"Health check failed for campaign {campaign.id}: {e}")
    finally:
        db.close()


async def _pull_metrics_all():
    """Pull fresh metrics from all connected platforms."""
    from database import SessionLocal
    from services.platform_service import fetch_campaign_metrics
    import models

    db = SessionLocal()
    try:
        campaigns = db.query(models.Campaign).filter(
            models.Campaign.status == "live"
        ).all()

        for campaign in campaigns:
            for platform in (campaign.platforms or []):
                conn = db.query(models.PlatformConnection).filter(
                    models.PlatformConnection.user_id == campaign.user_id,
                    models.PlatformConnection.platform == platform,
                    models.PlatformConnection.status == "connected",
                ).first()

                if not conn:
                    continue

                external_id = (campaign.external_ids or {}).get(platform)
                try:
                    raw = await fetch_campaign_metrics(platform, conn.access_token, external_id or "")
                    metric = models.CampaignMetrics(
                        campaign_id=campaign.id,
                        platform=platform,
                        impressions=raw.get("impressions", 0),
                        clicks=raw.get("clicks", 0),
                        conversions=raw.get("conversions", 0),
                        spend=raw.get("spend", 0.0),
                        ctr=raw.get("ctr", 0.0),
                        cpc=raw.get("cpc", 0.0),
                        cpm=raw.get("cpm", 0.0),
                        roas=raw.get("roas", 0.0),
                        reach=raw.get("reach", 0),
                        frequency=raw.get("frequency", 0.0),
                        raw_data=raw,
                    )
                    db.add(metric)
                except Exception as e:
                    logger.error(f"Metrics pull failed for {platform}/{campaign.id}: {e}")

        db.commit()
        logger.info("Metrics pull completed")
    finally:
        db.close()


async def _run_optimizations_all():
    """Run AI optimization on all campaigns due for optimization."""
    from database import SessionLocal
    from services.optimization_service import run_campaign_optimization
    from datetime import timedelta
    import models

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=47)
        campaigns = db.query(models.Campaign).filter(
            models.Campaign.status.in_(["live", "ready"]),
            (models.Campaign.last_optimized_at == None) |
            (models.Campaign.last_optimized_at < cutoff)
        ).all()

        logger.info(f"Running optimization on {len(campaigns)} campaigns")
        for campaign in campaigns:
            try:
                await run_campaign_optimization(campaign.id, db, triggered_by="scheduler")
            except Exception as e:
                logger.error(f"Optimization failed for campaign {campaign.id}: {e}")
    finally:
        db.close()
