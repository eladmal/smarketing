import os
import json
import zipfile
import uuid
from pathlib import Path
from datetime import datetime

EXPORT_DIR = os.getenv("EXPORT_DIR", "exports")


def create_campaign_export(
    campaign_name: str,
    copy_variants: list[dict],
    audiences: list[dict],
    asset_paths: list[dict]
) -> str:
    """Create a ZIP package with all campaign materials."""
    os.makedirs(EXPORT_DIR, exist_ok=True)

    export_id = uuid.uuid4().hex[:12]
    zip_filename = f"smarketing_{campaign_name}_{export_id}.zip"
    zip_path = os.path.join(EXPORT_DIR, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # README
        readme = _build_readme(campaign_name)
        zf.writestr("README.txt", readme)

        # Copy variants per platform
        copy_by_platform = {}
        for variant in copy_variants:
            p = variant.get("platform", "general")
            copy_by_platform.setdefault(p, []).append(variant)

        for platform, variants in copy_by_platform.items():
            copy_text = _build_copy_document(platform, variants)
            zf.writestr(f"copy/{platform}_copy.txt", copy_text)

        # All copy as JSON
        zf.writestr("copy/all_copy.json", json.dumps(copy_variants, ensure_ascii=False, indent=2))

        # Audiences
        if audiences:
            audience_text = _build_audience_document(audiences)
            zf.writestr("audiences/audience_targeting.txt", audience_text)
            zf.writestr("audiences/audiences.json", json.dumps(audiences, ensure_ascii=False, indent=2))

        # Assets
        for asset in asset_paths:
            path = asset.get("path")
            if path and os.path.exists(path):
                platform = asset.get("platform", "general")
                label = asset.get("label", "asset")
                filename = asset.get("filename", os.path.basename(path))
                zf.write(path, f"assets/{platform}/{filename}")

        # Campaign summary
        summary = {
            "campaign_name": campaign_name,
            "exported_at": datetime.utcnow().isoformat(),
            "platforms": list(copy_by_platform.keys()),
            "copy_variants_count": len(copy_variants),
            "assets_count": len(asset_paths),
            "audiences_count": len(audiences)
        }
        zf.writestr("campaign_summary.json", json.dumps(summary, ensure_ascii=False, indent=2))

    return zip_path


def _build_readme(campaign_name: str) -> str:
    return f"""====================================
  SMARKETING - חבילת קמפיין
  {campaign_name}
  יוצא ב: {datetime.now().strftime('%d/%m/%Y %H:%M')}
====================================

תוכן החבילה:
-------------
📁 copy/           - טקסטים שיווקיים לכל פלטפורמה
📁 audiences/      - הגדרות קהל יעד לכל פלטפורמה
📁 assets/         - קבצים גרפיים מותאמי גודל לכל פלטפורמה
📄 campaign_summary.json - סיכום הקמפיין

הוראות שימוש:
--------------
1. בחר את הפלטפורמה הרצויה בתיקיית copy/
2. בחר את הוריאנט המתאים לך (V1/V2/V3)
3. העלה את הנכסים הגרפיים מתיקיית assets/{platform}/
4. הגדר את הקהל לפי קובץ audiences/audience_targeting.txt

Powered by Smarketing - smarketing.ai
"""


def _build_copy_document(platform: str, variants: list[dict]) -> str:
    platform_names = {
        "facebook": "פייסבוק",
        "google": "גוגל",
        "tiktok": "טיקטוק",
        "instagram": "אינסטגרם"
    }
    lines = [
        f"{'='*50}",
        f"  {platform_names.get(platform, platform).upper()} - טקסטים שיווקיים",
        f"{'='*50}",
        ""
    ]
    for i, v in enumerate(variants, 1):
        lines.append(f"--- וריאנט {i} ---")
        if v.get("language"):
            lines.append(f"שפה: {'עברית' if v['language'] == 'he' else 'אנגלית'}")
        if v.get("headline"):
            lines.append(f"כותרת: {v['headline']}")
        if v.get("body"):
            lines.append(f"גוף: {v['body']}")
        if v.get("cta"):
            lines.append(f"CTA: {v['cta']}")
        lines.append("")
    return "\n".join(lines)


def _build_audience_document(audiences: list[dict]) -> str:
    platform_names = {
        "facebook": "פייסבוק",
        "google": "גוגל",
        "tiktok": "טיקטוק"
    }
    lines = ["=" * 50, "  הגדרות קהל יעד - Smarketing", "=" * 50, ""]
    for aud in audiences:
        platform = aud.get("platform", "")
        lines.append(f"--- {platform_names.get(platform, platform).upper()} ---")
        if aud.get("name"):
            lines.append(f"שם קהל: {aud['name']}")
        if aud.get("age_min") and aud.get("age_max"):
            lines.append(f"גילאים: {aud['age_min']}-{aud['age_max']}")
        if aud.get("genders"):
            lines.append(f"מגדר: {', '.join(aud['genders'])}")
        if aud.get("locations"):
            lines.append(f"מיקומים: {', '.join(aud.get('locations', []))}")
        if aud.get("interests"):
            lines.append(f"תחומי עניין: {', '.join(aud.get('interests', []))}")
        if aud.get("behaviors"):
            lines.append(f"התנהגויות: {', '.join(aud.get('behaviors', []))}")
        lines.append("")
    return "\n".join(lines)
