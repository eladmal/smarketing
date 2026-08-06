import { Link } from 'react-router-dom'
import {
  Zap, Star, Building2, Check, TrendingUp, Users, Megaphone,
  ArrowLeft, CheckCircle, XCircle, DollarSign, Timer, BarChart3,
  Sparkles, Shield, Download, ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { LogoBadge } from '../components/Logo'

const PLANS = [
  {
    id: 'basic', name: 'Basic', price: 99, icon: Zap, popular: false,
    features: ['עד 5 קמפיינים', '2 פלטפורמות', 'קופי AI בעברית', 'ייצוא ZIP מוכן'],
    notIncluded: ['אופטימיזציה אוטומטית', 'White-label'],
  },
  {
    id: 'pro', name: 'Pro', price: 299, icon: Star, popular: true,
    features: ['קמפיינים ללא הגבלה', 'כל 4 הפלטפורמות', 'קופי AI מתקדם', 'אופטימיזציה כל 48שע', 'אנליטיקס מלא', 'התראות חכמות'],
    notIncluded: ['White-label'],
  },
  {
    id: 'business', name: 'Business', price: 799, icon: Building2, popular: false,
    features: ['הכל ב-Pro', 'White-label — לוגו שלך', 'ניהול לקוחות מרובים', 'API גישה ישירה', 'מנהל חשבון ייעודי', 'SLA מוגדר'],
    notIncluded: [],
  },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'קופי AI בעברית',
    desc: 'המערכת כותבת טקסטים שיווקיים מקצועיים בעברית — לפייסבוק, אינסטגרם, גוגל ועוד. אין צורך בקופירייטר.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Users,
    title: 'קהלי יעד אוטומטיים',
    desc: 'AI בונה קהלי יעד מדויקים לפי סוג העסק, גיאוגרפיה ותחומי עניין — בלי להתעסק עם הגדרות מורכבות.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Download,
    title: 'ייצוא מוכן לפרסום',
    desc: 'ZIP עם כל הגדלים המדויקים לכל פלטפורמה — Story, Feed, Banner. פשוט מעלים ומפרסמים.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'אנליטיקס חכם',
    desc: 'ראה מה עובד ומה לא. המערכת עוקבת אחרי ביצועים ומייעלת קמפיינים אוטומטית כל 48 שעות.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Shield,
    title: 'מאובטח ופרטי',
    desc: 'כל עסק מקבל מערכת עצמאית מבודדת. הנתונים שלך לא נחשפים לאף אחד אחר.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: TrendingUp,
    title: 'אופטימיזציה רציפה',
    desc: 'המערכת לומדת מהנתונים ומשפרת את הקמפיינים — כאילו יש לך מנהל דיגיטל עובד 24/7.',
    color: 'bg-brand-50 text-brand-600',
  },
]

const EXAMPLES = [
  {
    type: 'חנות אונליין',
    emoji: '🛍️',
    before: 'הוציאה ₪3,000/חודש על סוכנות פרסום. קיבלה 2 קמפיינים בחודש, תוצאות בינוניות.',
    after: 'עם Smarketing Pro (₪299/חודש) מריצה 8 קמפיינים בחלקי הזמן. החיסכון: ₪2,700 בחודש.',
    saving: '₪32,400/שנה',
  },
  {
    type: 'עסק מקומי',
    emoji: '🏪',
    before: 'שילם לפרילנסר ₪1,500/חודש לניהול רשתות חברתיות. לקח שבוע לכל קמפיין.',
    after: 'Smarketing Basic (₪99/חודש) — קמפיין מוכן תוך 10 דקות. החיסכון: ₪1,400/חודש.',
    saving: '₪16,800/שנה',
  },
  {
    type: 'סוכנות דיגיטל',
    emoji: '💼',
    before: 'ניהול ידני של 15 לקוחות — שעות רבות על עיצוב, קופי, תיאומים.',
    after: 'Smarketing Business — ניהול כל הלקוחות ממקום אחד עם White-label. פי 3 לקוחות, אותו צוות.',
    saving: 'x3 הכנסות',
  },
]

const FAQ = [
  {
    q: 'האם צריך ניסיון בשיווק דיגיטל?',
    a: 'לא! המערכת מיועדת לבעלי עסקים ללא ניסיון. AI מנחה אותך בכל שלב ובונה הכל אוטומטית.',
  },
  {
    q: 'כמה זמן לוקח ליצור קמפיין?',
    a: 'בין 10 ל-20 דקות מרגע הרישום ועד קמפיין מוכן לפרסום עם קופי, קהלים ונכסים גרפיים.',
  },
  {
    q: 'האם ניתן לבטל בכל עת?',
    a: 'כן, ללא שאלות. תוכל לבטל מפורטל הניהול בכל זמן. אין עמלות יציאה.',
  },
  {
    q: 'האם הקופי הוא בעברית?',
    a: 'בהחלט. המערכת מיועדת לשוק הישראלי ומייצרת תוכן בעברית טבעית ומותאמת תרבותית.',
  },
  {
    q: 'מה ההבדל בין התוכניות?',
    a: 'Basic מתאים לעסקים קטנים עם עד 5 קמפיינים. Pro ללא הגבלת קמפיינים עם AI מתקדם. Business לסוכנויות ועסקים גדולים.',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoBadge size="md" />
            <span className="text-xl font-bold text-gray-900">Smarketing</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">יתרונות</a>
            <a href="#savings" className="hover:text-gray-900 transition-colors">חיסכון</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">מחירים</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">שאלות</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">כניסה</Link>
            <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
              התחל חינם
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-full mb-8 border border-white/20">
            <Sparkles size={14} />
            14 יום ניסיון מלא — ללא כרטיס אשראי
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            הפרסום הדיגיטלי שלך —<br />
            <span className="text-yellow-300">בלי סוכנות. בלי הוצאות ענק.</span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            Smarketing כותב לך קופי, בונה קהלים, ומכין קמפיינים מוכנים לפרסום —
            הכל עם AI בעברית, תוך 10 דקות.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl"
            >
              <Zap size={20} />
              התחל ניסיון חינמי
            </Link>
            <a
              href="#savings"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              כמה תחסוך?
              <ArrowLeft size={18} className="rotate-90" />
            </a>
          </div>

          {/* Social proof bar */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-brand-200">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              ללא חוזה מחייב
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              ביטול בכל עת
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              תמיכה בעברית
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              מחירים בשקלים
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pain section ───────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            סוכנות פרסום עולה לך המון. גם בזמן, גם בכסף.
          </h2>
          <p className="text-gray-500 text-lg mb-12">
            רוב בעלי עסקים קטנים ובינוניים מכירים את הכאב הזה:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: '₪2,000–₪8,000 לחודש',
                desc: 'זה המחיר הממוצע לסוכנות פרסום דיגיטלי. ולרוב — תוצאות שאפשר לקבל הרבה יותר בזול.',
                color: 'text-red-500',
                bg: 'bg-red-50',
              },
              {
                icon: Timer,
                title: '2–4 שבועות לקמפיין',
                desc: 'בריפינגים, תיאומים, אישורים, תיקונים. עד שהקמפיין עולה — ההזדמנות כבר עברה.',
                color: 'text-orange-500',
                bg: 'bg-orange-50',
              },
              {
                icon: XCircle,
                title: 'תלות מוחלטת',
                desc: 'אתה לא מבין מה הם עושים ולמה. וכשהם עוזבים — אתה מתחיל מהתחלה עם סוכנות חדשה.',
                color: 'text-red-500',
                bg: 'bg-red-50',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-right">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-brand-100">
              <Sparkles size={14} />
              הכלים שעושים את העבודה
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              כל מה שסוכנות עושה — אוטומטי
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              במקום לשלם לסוכנות שעות עבודה, תן ל-AI לעשות את זה בדקות
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Savings / Examples ─────────────────────────────────────── */}
      <section id="savings" className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              כמה עסקים חסכו כבר?
            </h2>
            <p className="text-gray-500 text-lg">
              דוגמאות אמיתיות מהשטח — לפני ואחרי
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {EXAMPLES.map((ex) => (
              <div key={ex.type} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="bg-brand-600 px-6 py-5">
                  <span className="text-3xl">{ex.emoji}</span>
                  <h3 className="text-white font-bold text-lg mt-2">{ex.type}</h3>
                  <div className="inline-flex items-center gap-1.5 bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full mt-2">
                    חיסכון: {ex.saving}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase mb-2">
                      <XCircle size={12} />
                      לפני
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{ex.before}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase mb-2">
                      <CheckCircle size={12} />
                      אחרי Smarketing
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{ex.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-900 px-8 py-5">
              <h3 className="text-white font-bold text-xl text-center">השוואה: סוכנות vs Smarketing</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right px-6 py-4 text-gray-500 font-medium">פרמטר</th>
                    <th className="text-center px-6 py-4 text-red-600 font-bold">סוכנות פרסום</th>
                    <th className="text-center px-6 py-4 text-brand-600 font-bold">Smarketing Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    ['עלות חודשית', '₪2,000–₪8,000', '₪299'],
                    ['זמן לקמפיין', '2–4 שבועות', '10 דקות'],
                    ['מספר קמפיינים', 'מוגבל (לפי תקציב)', 'ללא הגבלה'],
                    ['עדכון שוטף', 'לפי בקשה בלבד', 'אוטומטי כל 48 שעות'],
                    ['שפה', 'לרוב אנגלית/מתורגמת', 'עברית מקומית'],
                    ['שקיפות', 'ידרוש ממך אמון עיוור', 'תמיד רואה מה קורה'],
                    ['ניסיון', '—', '14 יום חינם, ללא CC'],
                  ].map(([param, agency, sm]) => (
                    <tr key={param} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3.5 font-medium text-gray-700">{param}</td>
                      <td className="px-6 py-3.5 text-center text-red-600">{agency}</td>
                      <td className="px-6 py-3.5 text-center text-brand-600 font-semibold">{sm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">איך זה עובד?</h2>
            <p className="text-gray-500 text-lg">3 שלבים פשוטים — מרישום לקמפיין חי</p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'נרשם ומגדיר את העסק',
                desc: 'ממלא שם עסק, סוג עסק ותיאור קצר. המערכת מבינה מה אתה מוכר ולמי.',
                time: '2 דקות',
                color: 'bg-brand-600',
              },
              {
                step: '02',
                title: 'AI בונה את הקמפיין',
                desc: 'כותב קופי מותאם לכל פלטפורמה, בונה קהלי יעד, ומכין נכסים גרפיים בכל הגדלים.',
                time: '5 דקות',
                color: 'bg-purple-600',
              },
              {
                step: '03',
                title: 'מוריד ומפרסם',
                desc: 'ZIP עם כל הקבצים מוכן. פשוט מעלים לפייסבוק, אינסטגרם או גוגל ומפעיל.',
                time: '3 דקות',
                color: 'bg-green-600',
              },
            ].map(({ step, title, desc, time, color }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className={`${color} text-white font-black text-xl w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  {step}
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">⏱ {time}</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/register" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-md hover:shadow-lg">
              <Zap size={20} />
              התחל עכשיו — 14 יום חינם
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">תמחור פשוט ושקוף</h2>
            <p className="text-gray-500 text-lg">ללא הפתעות. ללא דמי התקנה. מחיר אחד לחודש.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ id, name, price, icon: Icon, popular, features, notIncluded }) => (
              <div
                key={id}
                className={`relative bg-white rounded-2xl p-7 flex flex-col border-2 transition-shadow hover:shadow-lg ${
                  popular ? 'border-brand-500 shadow-md' : 'border-gray-100'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    ⭐ הכי פופולרי
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${popular ? 'bg-brand-600' : 'bg-gray-100'}`}>
                    <Icon size={20} className={popular ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">{name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">₪{price}</span>
                      <span className="text-sm text-gray-400">/חודש</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Check size={15} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {notIncluded.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400 line-through">
                      <XCircle size={14} className="flex-shrink-0 text-gray-300" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full text-center py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  התחל ניסיון חינמי
                </Link>

                <p className="text-center text-xs text-gray-400 mt-2">14 יום חינם, ללא כרטיס אשראי</p>
              </div>
            ))}
          </div>

          {/* Trial callout */}
          <div className="mt-10 bg-brand-600 rounded-2xl p-6 text-white text-center">
            <Sparkles size={28} className="mx-auto mb-3 text-yellow-300" />
            <h3 className="font-bold text-xl mb-2">לא בטוח? תנסה 14 יום בחינם</h3>
            <p className="text-brand-200 mb-4">ניסיון מלא של תוכנית Pro — ללא כרטיס אשראי, ללא התחייבות.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-all">
              <Zap size={18} />
              התחל עכשיו
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2>
            <p className="text-gray-500 text-lg">כל מה שרצית לדעת</p>
          </div>

          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-right font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span>{q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform flex-shrink-0 mr-3 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-24 px-6 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <Megaphone size={48} className="mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            מוכן להפסיק לשלם<br />על שירותים שAI עושה טוב יותר?
          </h2>
          <p className="text-brand-200 text-xl mb-10">
            הצטרף לעסקים שחסכו עשרות אלפי שקלים בשנה — עם קמפיינים יותר טובים.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 bg-white text-brand-700 font-extrabold text-xl px-10 py-5 rounded-2xl hover:bg-brand-50 transition-all shadow-xl hover:shadow-2xl"
          >
            <Zap size={24} />
            14 יום ניסיון חינמי — התחל עכשיו
          </Link>
          <p className="text-brand-300 text-sm mt-4">ללא כרטיס אשראי · ביטול בכל עת · מחיר בשקלים</p>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <LogoBadge size="sm" />
              <span className="text-white font-bold text-lg">Smarketing</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/pricing" className="hover:text-white transition-colors">מחירים</Link>
              <Link to="/login" className="hover:text-white transition-colors">כניסה</Link>
              <Link to="/register" className="hover:text-white transition-colors">הרשמה</Link>
              <a href="mailto:support@smarketing.co.il" className="hover:text-white transition-colors">תמיכה</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 Smarketing. כל הזכויות שמורות. מחירים כוללים מע"מ.
          </div>
        </div>
      </footer>
    </div>
  )
}
