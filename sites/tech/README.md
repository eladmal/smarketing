# tech.smarkethink.co.il

דף הנחיתה של שירות "מחלקת שיווק טכנולוגית במיקור חוץ". מתארח ב-Cloudflare Pages.

## מבנה
- `index.html` - הדף
- `functions/api/lead.js` - מקבל את טופס האבחון, בודק אותו ומעביר ל-`LEAD_WEBHOOK_URL`
- `_headers`, `robots.txt`, `sitemap.xml`

## הקמה ב-Cloudflare (פעם אחת)
1. Workers & Pages ← Create ← Pages ← Connect to Git ← הריפו `eladmal/smarketing`
2. Production branch: הענף שמחזיק את הקבצים (בהמשך `main`)
3. Framework preset: None · Build command: ריק · **Root directory: `sites/tech`** · Build output: `.`
4. Settings ← Variables and Secrets ← להוסיף `LEAD_WEBHOOK_URL` (סוג Secret) = כתובת ה-webhook של תרחיש Make
5. Custom domains ← `tech.smarkethink.co.il` (ה-DNS ב-Cloudflare, אז רשומת ה-CNAME נוצרת אוטומטית)

## ניתוב לידים (תרחיש Make)
Webhook ← Crm2Lead ← שורה בגיליון Google Sheets ← מייל מיידי.
השדות שנשלחים: name, phone, email, company, has_marketing_manager, utm_*, gclid, fbclid, page, source, submitted_at.
בלי `LEAD_WEBHOOK_URL` הפונקציה מחזירה 503 והטופס מציג הודעת שגיאה.

## לפני עלייה לאוויר
- [ ] תרחיש Make + `LEAD_WEBHOOK_URL`
- [ ] GTM / פיקסל מטא / GA4 (להדביק ב-`<head>`; הטופס כבר שולח `generate_lead` ל-dataLayer ו-`Lead` לפיקסל)
- [ ] עמודי `/accessibility` ו-`/privacy` (הקישורים כבר בדף)
- [ ] ליד בדיקה מקצה לקצה
