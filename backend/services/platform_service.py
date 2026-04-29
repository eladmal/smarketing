"""
Platform Integration Service
=============================
Each platform class is ready for real API keys.
When credentials are available, replace the stub methods
with real API calls — the interface stays identical.

OAuth flow per platform:
  1. get_oauth_url()      → redirect user to platform
  2. handle_callback()    → exchange code for tokens
  3. get_account_info()   → fetch ad account details
  4. publish_campaign()   → create campaign on platform
  5. get_metrics()        → pull performance data
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode


# ─── Platform Configuration ────────────────────────────────────────────────

PLATFORM_CONFIG = {
    "facebook": {
        "name": "פייסבוק",
        "app_id": os.getenv("FACEBOOK_APP_ID", ""),
        "app_secret": os.getenv("FACEBOOK_APP_SECRET", ""),
        "oauth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "scopes": ["ads_management", "ads_read", "business_management", "pages_read_engagement"],
        "color": "#1877F2",
        "icon": "facebook",
        "docs_url": "https://developers.facebook.com/docs/marketing-api",
    },
    "instagram": {
        "name": "אינסטגרם",
        "app_id": os.getenv("FACEBOOK_APP_ID", ""),      # Instagram uses Facebook App
        "app_secret": os.getenv("FACEBOOK_APP_SECRET", ""),
        "oauth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "scopes": ["ads_management", "instagram_basic", "instagram_content_publish"],
        "color": "#E1306C",
        "icon": "instagram",
        "docs_url": "https://developers.facebook.com/docs/instagram-api",
    },
    "google": {
        "name": "גוגל",
        "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/adwords"],
        "color": "#4285F4",
        "icon": "google",
        "docs_url": "https://developers.google.com/google-ads/api",
    },
    "tiktok": {
        "name": "טיקטוק",
        "app_id": os.getenv("TIKTOK_APP_ID", ""),
        "app_secret": os.getenv("TIKTOK_APP_SECRET", ""),
        "oauth_url": "https://business-api.tiktok.com/portal/auth",
        "token_url": "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
        "scopes": ["advertiser.management", "campaign.management"],
        "color": "#010101",
        "icon": "tiktok",
        "docs_url": "https://business-api.tiktok.com/portal/docs",
    },
}

REDIRECT_BASE = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ─── OAuth URL Generators ───────────────────────────────────────────────────

def get_oauth_url(platform: str, user_id: int) -> dict:
    """Generate OAuth authorization URL for the given platform."""
    cfg = PLATFORM_CONFIG.get(platform)
    if not cfg:
        raise ValueError(f"Unknown platform: {platform}")

    state = f"{user_id}:{platform}"
    redirect_uri = f"{REDIRECT_BASE}/integrations/callback/{platform}"

    if platform in ("facebook", "instagram"):
        if not cfg.get("app_id"):
            return {"ready": False, "message": "Facebook App ID לא מוגדר — ראה הוראות הגדרה"}
        params = {
            "client_id": cfg["app_id"],
            "redirect_uri": redirect_uri,
            "scope": ",".join(cfg["scopes"]),
            "state": state,
            "response_type": "code",
        }
        return {"ready": True, "url": f"{cfg['oauth_url']}?{urlencode(params)}"}

    elif platform == "google":
        if not cfg.get("client_id"):
            return {"ready": False, "message": "Google Client ID לא מוגדר — ראה הוראות הגדרה"}
        params = {
            "client_id": cfg["client_id"],
            "redirect_uri": redirect_uri,
            "scope": " ".join(cfg["scopes"]),
            "state": state,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
        }
        return {"ready": True, "url": f"{cfg['oauth_url']}?{urlencode(params)}"}

    elif platform == "tiktok":
        if not cfg.get("app_id"):
            return {"ready": False, "message": "TikTok App ID לא מוגדר — ראה הוראות הגדרה"}
        params = {
            "app_id": cfg["app_id"],
            "redirect_uri": redirect_uri,
            "state": state,
        }
        return {"ready": True, "url": f"{cfg['oauth_url']}?{urlencode(params)}"}

    return {"ready": False, "message": "פלטפורמה לא נתמכת"}


# ─── Token Exchange ─────────────────────────────────────────────────────────

async def exchange_code_for_tokens(platform: str, code: str, user_id: int) -> dict:
    """Exchange OAuth code for access/refresh tokens."""
    import httpx
    cfg = PLATFORM_CONFIG[platform]
    redirect_uri = f"{REDIRECT_BASE}/integrations/callback/{platform}"

    if platform in ("facebook", "instagram"):
        async with httpx.AsyncClient() as client:
            resp = await client.get(cfg["token_url"], params={
                "client_id": cfg["app_id"],
                "client_secret": cfg["app_secret"],
                "redirect_uri": redirect_uri,
                "code": code,
            })
        data = resp.json()
        return {
            "access_token": data.get("access_token"),
            "expires_at": datetime.utcnow() + timedelta(seconds=data.get("expires_in", 5184000)),
        }

    elif platform == "google":
        async with httpx.AsyncClient() as client:
            resp = await client.post(cfg["token_url"], data={
                "client_id": cfg["client_id"],
                "client_secret": cfg["client_secret"],
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "code": code,
            })
        data = resp.json()
        return {
            "access_token": data.get("access_token"),
            "refresh_token": data.get("refresh_token"),
            "expires_at": datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600)),
        }

    elif platform == "tiktok":
        async with httpx.AsyncClient() as client:
            resp = await client.post(cfg["token_url"], json={
                "app_id": cfg["app_id"],
                "secret": cfg["app_secret"],
                "auth_code": code,
            })
        data = resp.json().get("data", {})
        return {
            "access_token": data.get("access_token"),
            "expires_at": datetime.utcnow() + timedelta(seconds=data.get("expires_in", 86400)),
        }

    raise ValueError(f"Unsupported platform: {platform}")


# ─── Account Info ───────────────────────────────────────────────────────────

async def get_account_info(platform: str, access_token: str) -> dict:
    """Fetch ad account name and ID from the platform."""
    import httpx

    try:
        if platform in ("facebook", "instagram"):
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://graph.facebook.com/v18.0/me/adaccounts",
                    params={"fields": "name,account_id,currency", "access_token": access_token}
                )
            accounts = resp.json().get("data", [])
            if accounts:
                return {"account_id": accounts[0]["account_id"], "account_name": accounts[0]["name"]}

        elif platform == "google":
            # Stub — real impl uses Google Ads API client library
            return {"account_id": "google_account", "account_name": "Google Ads Account"}

        elif platform == "tiktok":
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/",
                    headers={"Access-Token": access_token}
                )
            data = resp.json().get("data", {})
            advertisers = data.get("list", [])
            if advertisers:
                return {"account_id": advertisers[0]["advertiser_id"], "account_name": advertisers[0]["advertiser_name"]}

    except Exception:
        pass

    return {"account_id": "unknown", "account_name": "החשבון שלך"}


# ─── Campaign Publishing (Stubs — ready for real implementation) ─────────────

async def publish_campaign_to_platform(
    platform: str,
    access_token: str,
    account_id: str,
    campaign_data: dict
) -> dict:
    """
    Publish a campaign to the given platform.
    Returns {"success": True, "external_id": "..."} or {"success": False, "error": "..."}

    TODO: Replace stub with real API calls when credentials are configured.
    """
    # Facebook / Instagram
    if platform in ("facebook", "instagram"):
        # Real implementation:
        # 1. Create Campaign → POST /act_{account_id}/campaigns
        # 2. Create Ad Set  → POST /act_{account_id}/adsets
        # 3. Create Ad      → POST /act_{account_id}/ads
        return {"success": True, "external_id": f"fb_stub_{campaign_data.get('id', 0)}",
                "message": "קמפיין ממתין לחיבור Facebook API"}

    elif platform == "google":
        # Real implementation uses google-ads Python client library
        return {"success": True, "external_id": f"ggl_stub_{campaign_data.get('id', 0)}",
                "message": "קמפיין ממתין לחיבור Google Ads API"}

    elif platform == "tiktok":
        # Real implementation:
        # POST https://business-api.tiktok.com/open_api/v1.3/campaign/create/
        return {"success": True, "external_id": f"tt_stub_{campaign_data.get('id', 0)}",
                "message": "קמפיין ממתין לחיבור TikTok API"}

    return {"success": False, "error": "פלטפורמה לא נתמכת"}


# ─── Metrics Fetching (Stubs) ────────────────────────────────────────────────

async def fetch_campaign_metrics(
    platform: str,
    access_token: str,
    external_campaign_id: str
) -> dict:
    """
    Pull latest performance metrics from platform.
    Returns standardized metrics dict.

    TODO: Replace stub with real API calls.
    """
    import random

    # Simulated data — real impl calls platform APIs
    base = {"impressions": random.randint(1000, 50000),
            "clicks": random.randint(50, 2000),
            "spend": round(random.uniform(50, 500), 2),
            "conversions": random.randint(0, 100)}
    base["ctr"] = round(base["clicks"] / base["impressions"] * 100, 2) if base["impressions"] else 0
    base["cpc"] = round(base["spend"] / base["clicks"], 2) if base["clicks"] else 0
    base["cpm"] = round(base["spend"] / base["impressions"] * 1000, 2) if base["impressions"] else 0
    base["roas"] = round(random.uniform(0.5, 5.0), 2)
    base["reach"] = int(base["impressions"] * random.uniform(0.6, 0.9))
    base["frequency"] = round(base["impressions"] / base["reach"], 2) if base["reach"] else 0
    return base


def get_platforms_info() -> list[dict]:
    """Return display info for all platforms (used by frontend)."""
    return [
        {
            "id": pid,
            "name": cfg["name"],
            "color": cfg["color"],
            "is_configured": bool(cfg.get("app_id") or cfg.get("client_id")),
            "docs_url": cfg["docs_url"],
            "setup_fields": _setup_fields(pid),
        }
        for pid, cfg in PLATFORM_CONFIG.items()
    ]


def _setup_fields(platform: str) -> list[dict]:
    fields = {
        "facebook":  [{"key": "FACEBOOK_APP_ID", "label": "App ID"}, {"key": "FACEBOOK_APP_SECRET", "label": "App Secret"}],
        "instagram": [{"key": "FACEBOOK_APP_ID", "label": "App ID (זהה לפייסבוק)"}, {"key": "FACEBOOK_APP_SECRET", "label": "App Secret"}],
        "google":    [{"key": "GOOGLE_CLIENT_ID", "label": "Client ID"}, {"key": "GOOGLE_CLIENT_SECRET", "label": "Client Secret"}, {"key": "GOOGLE_ADS_DEVELOPER_TOKEN", "label": "Developer Token"}],
        "tiktok":    [{"key": "TIKTOK_APP_ID", "label": "App ID"}, {"key": "TIKTOK_APP_SECRET", "label": "App Secret"}],
    }
    return fields.get(platform, [])
