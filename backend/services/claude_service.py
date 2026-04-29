import anthropic
import os
from typing import Optional

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PLATFORM_SPECS = {
    "facebook": {
        "headline_max": 40,
        "body_max": 125,
        "description": "פייסבוק - פיד ופרסומות",
        "tone": "אישי, שיחתי, עם קריאה לפעולה ברורה"
    },
    "google": {
        "headline_max": 30,
        "body_max": 90,
        "description": "גוגל אדס - חיפוש ודיספליי",
        "tone": "ממוקד מילות מפתח, ישיר, תועלתי"
    },
    "tiktok": {
        "headline_max": 100,
        "body_max": 150,
        "description": "טיקטוק - תוכן קצר וויראלי",
        "tone": "צעיר, אנרגטי, טרנדי, עם האשטגים"
    },
    "instagram": {
        "headline_max": 50,
        "body_max": 200,
        "description": "אינסטגרם - פיד וסטורי",
        "tone": "ויזואלי, אסתטי, עם אמוג׳י ואינטראקציה"
    }
}

GOAL_DESCRIPTIONS = {
    "awareness": "מודעות למותג - להכיר את העסק",
    "leads": "לידים - אנשים ישאירו פרטים",
    "sales": "מכירות - רכישה ישירה",
    "traffic": "תנועה לאתר",
    "engagement": "מעורבות - לייקים, שיתופים, תגובות"
}


async def generate_campaign_copy(
    product_name: str,
    product_description: str,
    business_name: str,
    goal: str,
    target_audience: str,
    platforms: list[str],
    language: str = "he",
    tone: Optional[str] = None
) -> dict:
    """Generate copy variants for all requested platforms."""

    lang_instruction = {
        "he": "כתוב הכל בעברית ברמה גבוהה, שיווקית ומשכנעת.",
        "en": "Write everything in high-quality, persuasive marketing English.",
        "both": "Write each variant in both Hebrew and English, clearly labeled."
    }.get(language, "כתוב הכל בעברית.")

    platforms_str = ", ".join([PLATFORM_SPECS.get(p, {}).get("description", p) for p in platforms])
    goal_desc = GOAL_DESCRIPTIONS.get(goal, goal)

    system_prompt = f"""אתה קופירייטר מומחה עם 15 שנות ניסיון בשיווק דיגיטלי.
אתה יוצר קופי שיווקי מקצועי, ממיר ומדויק לכל פלטפורמה.
{lang_instruction}
הקפד על גבולות תווים של כל פלטפורמה.
השתמש בטריגרים פסיכולוגיים: FOMO, סמכות, הוכחה חברתית, דחיפות."""

    platform_instructions = []
    for platform in platforms:
        spec = PLATFORM_SPECS.get(platform, {})
        platform_instructions.append(f"""
**{platform.upper()}** ({spec.get('description', platform)}):
- כותרת (headline): עד {spec.get('headline_max', 40)} תווים
- גוף (body): עד {spec.get('body_max', 125)} תווים
- CTA (קריאה לפעולה): 3-5 מילים
- טון: {spec.get('tone', 'מקצועי')}""")

    user_prompt = f"""צור קמפיין פרסום מלא עבור:

**עסק:** {business_name}
**מוצר/שירות:** {product_name}
**תיאור:** {product_description}
**מטרת הקמפיין:** {goal_desc}
**קהל יעד:** {target_audience}
**פלטפורמות:** {platforms_str}
{"**טון מיוחד:** " + tone if tone else ""}

עבור כל פלטפורמה צור 3 וריאנטים שונים של:
1. כותרת (Headline)
2. גוף הטקסט (Body)
3. קריאה לפעולה (CTA)

{"".join(platform_instructions)}

החזר JSON תקין בפורמט הבא בלבד (ללא markdown):
{{
  "platform_name": {{
    "variants": [
      {{
        "headline": "...",
        "body": "...",
        "cta": "..."
      }}
    ]
  }}
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )

    import json
    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)


async def generate_audience_suggestions(
    product_name: str,
    product_description: str,
    goal: str,
    platforms: list[str]
) -> dict:
    """Generate audience targeting suggestions per platform."""

    system_prompt = """אתה מומחה מדיה דיגיטלית עם ניסיון עמוק בטרגוט קהלים בפייסבוק, גוגל וטיקטוק.
תן המלצות קהל מדויקות ומפורטות."""

    user_prompt = f"""הגדר קהלי יעד מומלצים עבור:
מוצר: {product_name}
תיאור: {product_description}
מטרה: {goal}
פלטפורמות: {", ".join(platforms)}

עבור כל פלטפורמה תן:
1. טווח גילאים מומלץ
2. מגדר (גברים/נשים/שניהם)
3. תחומי עניין (interests) - לפחות 8
4. התנהגויות (behaviors) - לפחות 4
5. מיקומים (locations) - ישראל + ערים ספציפיות
6. מילות מפתח לגוגל (אם רלוונטי)
7. סוגי קהלים מיוחדים (Lookalike, Retargeting)

החזר JSON תקין בלבד (ללא markdown):
{{
  "platform_name": {{
    "age_min": 18,
    "age_max": 65,
    "genders": ["all"],
    "interests": [],
    "behaviors": [],
    "locations": [],
    "keywords": [],
    "special_audiences": []
  }}
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )

    import json
    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)


async def improve_copy(
    original_copy: str,
    platform: str,
    goal: str,
    feedback: str
) -> str:
    """Improve existing copy based on user feedback."""

    spec = PLATFORM_SPECS.get(platform, {})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"""שפר את הקופי הבא עבור {platform}:

קופי מקורי:
{original_copy}

בקשת שיפור: {feedback}
מטרה: {goal}
מגבלת תווים: כותרת עד {spec.get('headline_max', 40)}, גוף עד {spec.get('body_max', 125)}

החזר רק את הקופי המשופר, ללא הסברים."""
        }]
    )

    return response.content[0].text.strip()
