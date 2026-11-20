# משימה: לפרוס דף נחיתה ל-Cloudflare Pages ולחבר אותו ל-tech.smarkethink.co.il

## רקע
דף נחיתה של SmarkeThink לשירות "מחלקת שיווק טכנולוגית במיקור חוץ".
הקוד מוכן ונמצא ב-GitHub. צריך רק לפרוס ולחבר דומיין.

## מקור
- ריפו: eladmal/smarketing
- ענף: claude/freelance-marketing-manager-campaign-jd6utl
- תיקייה: sites/tech
  - index.html - הדף (סטטי, בלי build)
  - functions/api/lead.js - Pages Function שמקבלת את טופס האבחון (POST /api/lead) ומעבירה את הליד ל-env.LEAD_WEBHOOK_URL
  - _headers, robots.txt, sitemap.xml, README.md

## שלב 1 - פרויקט Pages
- Workers & Pages ← Create ← Pages ← Connect to Git ← eladmal/smarketing
- Project name: smarkethink-tech
- Production branch: claude/freelance-marketing-manager-campaign-jd6utl
- Framework preset: None
- Build command: ריק
- Build output directory: .
- Root directory: sites/tech
- Save and Deploy
- לוודא שהתיקייה functions זוהתה (בלוג הפריסה אמורה להופיע הודעה על Functions)

אם עובדים דרך wrangler במקום Git:

    npx wrangler pages deploy sites/tech --project-name smarkethink-tech

(מריצים מהשורש של הריפו כדי ש-functions תעלה. חסרון: אין פריסה אוטומטית מ-GitHub)

## שלב 2 - דומיין
- ה-DNS של smarkethink.co.il כבר ב-Cloudflare
- בפרויקט: Custom domains ← Set up a domain ← tech.smarkethink.co.il
- Cloudflare אמור ליצור לבד CNAME: tech → smarkethink-tech.pages.dev (Proxied)
- חשוב: לפני שמוסיפים, לבדוק אם כבר קיימת רשומה בשם tech. אם כן - לעצור ולשאול.
- לא לגעת ברשומות אחרות (האתר הראשי smarkethink.co.il ו-www נשארים כמו שהם)

## שלב 3 - בדיקות
1. https://smarkethink-tech.pages.dev נטען ונראה תקין (RTL, עברית, מחשבון עובד)
2. https://tech.smarkethink.co.il נטען עם SSL תקין
3. בדיקת הפונקציה:

       curl -X POST https://tech.smarkethink.co.il/api/lead \
         -H "Content-Type: application/json" \
         -d '{"name":"בדיקה","phone":"0500000000"}'

   כל עוד LEAD_WEBHOOK_URL לא הוגדר, התשובה הצפויה היא `503 {"ok":false,"error":"not_configured"}`.
   זה תקין בשלב הזה, וזה מוכיח שהפונקציה רצה.

## לא לעשות בשלב הזה
- לא להגדיר LEAD_WEBHOOK_URL (תרחיש Make עוד לא נבנה)
- לא להוסיף GTM או פיקסל (אין עדיין מזהים)
- לא לשנות קוד בריפו בלי אישור
- לא למחוק או לשנות רשומות DNS קיימות

## להחזיר בסוף
- כתובת pages.dev
- האם tech.smarkethink.co.il עובד, ומה מצב ה-SSL
- התשובה של בדיקת curl
- כל שגיאה בלוג הפריסה

## פתוח להמשך (לא במשימה הזו)
- תרחיש Make: Webhook ← Crm2Lead ← Google Sheets ← מייל מיידי, ואז להוסיף את LEAD_WEBHOOK_URL כ-Secret בפרויקט
- עמודי /accessibility ו-/privacy (הקישורים כבר בדף ומחזירים כרגע 404)
- GTM, פיקסל מטא ו-GA4
- מיזוג הענף ל-main ועדכון Production branch
- הפניה של marketingmanager.co.il (אם נקנה) ל-tech.smarkethink.co.il
