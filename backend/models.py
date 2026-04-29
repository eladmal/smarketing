from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    business_name = Column(String)
    business_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    campaigns = relationship("Campaign", back_populates="owner")
    assets = relationship("Asset", back_populates="owner")
    platform_connections = relationship("PlatformConnection", back_populates="owner")
    alerts = relationship("Alert", back_populates="owner")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    goal = Column(String)
    product_name = Column(String)
    product_description = Column(Text)
    target_audience = Column(Text)
    budget = Column(String)
    language = Column(String, default="he")
    platforms = Column(JSON, default=["facebook", "google", "tiktok"])
    status = Column(String, default="draft")  # draft, ready, exported, live
    health_status = Column(String, default="unknown")  # healthy, warning, error, unknown
    last_health_check = Column(DateTime, nullable=True)
    last_optimized_at = Column(DateTime, nullable=True)
    external_ids = Column(JSON, default={})   # {facebook: "123", google: "456"}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="campaigns")
    copy_variants = relationship("CopyVariant", back_populates="campaign")
    audiences = relationship("Audience", back_populates="campaign")
    assets = relationship("Asset", back_populates="campaign")
    metrics = relationship("CampaignMetrics", back_populates="campaign")
    optimization_logs = relationship("OptimizationLog", back_populates="campaign")
    alerts = relationship("Alert", back_populates="campaign")


class PlatformConnection(Base):
    """OAuth connection per user per platform."""
    __tablename__ = "platform_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)          # facebook, google, tiktok, instagram
    status = Column(String, default="disconnected")    # connected, disconnected, error
    access_token = Column(Text, nullable=True)         # encrypted in production
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    account_id = Column(String, nullable=True)         # ad account id
    account_name = Column(String, nullable=True)       # human-readable account name
    scopes = Column(JSON, default=[])
    extra_data = Column(JSON, default={})              # platform-specific metadata
    connected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="platform_connections")


class CampaignMetrics(Base):
    """Snapshot of campaign performance metrics (pulled from platforms)."""
    __tablename__ = "campaign_metrics"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    platform = Column(String)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    spend = Column(Float, default=0.0)
    ctr = Column(Float, default=0.0)     # click-through rate
    cpc = Column(Float, default=0.0)     # cost per click
    cpm = Column(Float, default=0.0)     # cost per 1000 impressions
    roas = Column(Float, default=0.0)    # return on ad spend
    reach = Column(Integer, default=0)
    frequency = Column(Float, default=0.0)
    raw_data = Column(JSON, default={})

    campaign = relationship("Campaign", back_populates="metrics")


class OptimizationLog(Base):
    """Log of every AI optimization run."""
    __tablename__ = "optimization_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    triggered_by = Column(String, default="scheduler")  # scheduler, manual
    status = Column(String, default="pending")           # pending, running, done, failed
    analysis = Column(Text, nullable=True)               # AI analysis text
    recommendations = Column(JSON, default=[])           # list of changes
    changes_applied = Column(JSON, default=[])           # what was actually changed
    metrics_before = Column(JSON, default={})
    metrics_after = Column(JSON, default={})
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="optimization_logs")


class Alert(Base):
    """System alerts — health issues, optimization results, platform errors."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    severity = Column(String, default="info")    # info, warning, error, success
    category = Column(String)                    # health, optimization, platform, system
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="alerts")
    campaign = relationship("Campaign", back_populates="alerts")


class CopyVariant(Base):
    __tablename__ = "copy_variants"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    platform = Column(String)
    language = Column(String)
    variant_type = Column(String)
    content = Column(Text, nullable=False)
    is_selected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="copy_variants")


class Audience(Base):
    __tablename__ = "audiences"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    platform = Column(String)
    name = Column(String)
    age_min = Column(Integer, default=18)
    age_max = Column(Integer, default=65)
    genders = Column(JSON, default=["all"])
    locations = Column(JSON, default=[])
    interests = Column(JSON, default=[])
    behaviors = Column(JSON, default=[])
    languages = Column(JSON, default=[])
    custom_audiences = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="audiences")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    original_filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    resized_variants = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="assets")
    campaign = relationship("Campaign", back_populates="assets")
