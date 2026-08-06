import { Link } from 'react-router-dom'
import { Check, Zap, Star, Building2 } from 'lucide-react'
import { LogoBadge } from '../components/Logo'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    icon: Zap,
    color: 'border-gray-200',
    badge: null,
    features: [
      'עד 5 קמפיינים פעילים',
      '2 פלטפורמות חברתיות',
      'יצירת קופי עם AI',
      'קהלי יעד אוטומטיים',
      'ניהול נכסים גרפיים',
      'ייצוא ZIP לכל פלטפורמה',
      'תמיכה במייל',
    ],
    notIncluded: ['אופטימיזציה אוטומטית 48שע', 'White-label', 'תמיכה עדיפות'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    icon: Star,
    color: 'border-brand-500 ring-2 ring-brand-500',
    badge: 'הכי פופולרי',
    features: [
      'קמפיינים ללא הגבלה',
      'כל 4 הפלטפורמות',
      'יצירת קופי מתקדמת עם AI',
      'קהלי יעד מתקדמים',
      'ניהול נכסים גרפיים',
      'ייצוא ZIP לכל פלטפורמה',
      'אופטימיזציה אוטומטית כל 48שע',
      'התראות בזמן אמת',
      'אנליטיקס מתקדמת',
      'תמיכה בצ\'אט',
    ],
    notIncluded: ['White-label', 'תמיכה עדיפות'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 799,
    icon: Building2,
    color: 'border-gray-200',
    badge: null,
    features: [
      'קמפיינים ללא הגבלה',
      'כל 4 הפלטפורמות',
      'AI מלא + אופטימיזציה 48שע',
      'White-label — לוגו שלך',
      'API גישה ישירה',
      'לקוחות מרובים (Agency)',
      'דוחות מתקדמים',
      'מנהל חשבון ייעודי',
      'תמיכה עדיפות 24/7',
      'SLA מוגדר',
    ],
    notIncluded: [],
  },
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoBadge size="sm" />
            <span className="text-xl font-bold text-gray-900">Smarketing</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">כניסה</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">התחל חינם</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-16 px-6">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-brand-100">
          <Zap size={14} />
          14 יום ניסיון חינמי — ללא כרטיס אשראי
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          תמחור שקוף ופשוט
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          כל תוכנית כוללת 14 יום ניסיון מלא. אחרי כן — שלם רק אם אתה מרוצה.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 ${plan.color} p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.id === 'pro' ? 'bg-brand-600' : 'bg-gray-100'}`}>
                    <Icon size={20} className={plan.id === 'pro' ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">₪{plan.price}</span>
                      <span className="text-sm text-gray-400">/חודש</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 line-through">
                      <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">×</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                    plan.id === 'pro'
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  התחל ניסיון חינמי
                </Link>
              </div>
            )
          })}
        </div>

        {/* FAQ snippet */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            יש לך שאלות?{' '}
            <a href="mailto:support@smarketing.app" className="text-brand-600 hover:underline font-medium">
              support@smarketing.app
            </a>
          </p>
          <p className="text-gray-400 text-xs mt-2">
            ניתן לבטל בכל עת. אין עמלות נסתרות. מחירים כוללים מע"מ.
          </p>
        </div>
      </div>
    </div>
  )
}
