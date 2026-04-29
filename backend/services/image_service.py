from PIL import Image, ImageDraw, ImageFont
import os
import uuid
from pathlib import Path

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/assets")
EXPORT_DIR = os.getenv("EXPORT_DIR", "exports")

PLATFORM_SIZES = {
    "facebook": {
        "feed_square": (1080, 1080, "Feed - ריבועי"),
        "feed_landscape": (1200, 628, "Feed - לרוחב"),
        "story": (1080, 1920, "Story / Reels"),
        "cover": (820, 312, "Cover Photo"),
    },
    "instagram": {
        "feed_square": (1080, 1080, "Feed - ריבועי"),
        "feed_portrait": (1080, 1350, "Feed - לאורך"),
        "story": (1080, 1920, "Story / Reels"),
    },
    "google": {
        "medium_rectangle": (300, 250, "Medium Rectangle"),
        "leaderboard": (728, 90, "Leaderboard"),
        "wide_skyscraper": (160, 600, "Wide Skyscraper"),
        "half_page": (300, 600, "Half Page"),
        "billboard": (970, 250, "Billboard"),
        "responsive": (1200, 628, "Responsive Display"),
    },
    "tiktok": {
        "feed_vertical": (1080, 1920, "Feed / TopView"),
        "feed_square": (1080, 1080, "Feed - ריבועי"),
    },
}

ALL_SIZES_FLAT = {
    f"{platform}_{size_key}": (width, height, label, platform)
    for platform, sizes in PLATFORM_SIZES.items()
    for size_key, (width, height, label) in sizes.items()
}


def resize_image_for_platform(
    source_path: str,
    platform: str,
    size_key: str,
    output_dir: str
) -> dict:
    """Resize image to a specific platform size with smart cropping."""
    sizes = PLATFORM_SIZES.get(platform, {})
    if size_key not in sizes:
        raise ValueError(f"Unknown size {size_key} for platform {platform}")

    width, height, label = sizes[size_key]

    img = Image.open(source_path).convert("RGB")
    original_ratio = img.width / img.height
    target_ratio = width / height

    if original_ratio > target_ratio:
        new_height = height
        new_width = int(height * original_ratio)
    else:
        new_width = width
        new_height = int(width / original_ratio)

    img = img.resize((new_width, new_height), Image.LANCZOS)

    left = (new_width - width) // 2
    top = (new_height - height) // 2
    img = img.crop((left, top, left + width, top + height))

    os.makedirs(output_dir, exist_ok=True)
    filename = f"{platform}_{size_key}_{uuid.uuid4().hex[:8]}.jpg"
    output_path = os.path.join(output_dir, filename)
    img.save(output_path, "JPEG", quality=92, optimize=True)

    return {
        "platform": platform,
        "size_key": size_key,
        "label": label,
        "width": width,
        "height": height,
        "path": output_path,
        "filename": filename
    }


def resize_for_all_platforms(
    source_path: str,
    platforms: list[str],
    output_dir: str
) -> list[dict]:
    """Resize image for all sizes of the given platforms."""
    results = []
    for platform in platforms:
        for size_key in PLATFORM_SIZES.get(platform, {}):
            try:
                result = resize_image_for_platform(source_path, platform, size_key, output_dir)
                results.append(result)
            except Exception as e:
                results.append({
                    "platform": platform,
                    "size_key": size_key,
                    "error": str(e)
                })
    return results


def get_platform_sizes_info() -> dict:
    """Return all platform sizes with metadata."""
    return {
        platform: [
            {"key": size_key, "width": w, "height": h, "label": label}
            for size_key, (w, h, label) in sizes.items()
        ]
        for platform, sizes in PLATFORM_SIZES.items()
    }
