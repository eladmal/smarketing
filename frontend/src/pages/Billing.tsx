import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { billingApi } from '../api'
import toast from 'react-hot-toast'
import {
  Zap, Star, Building2, Check, Clock,
  AlertTriangle, CheckCircle2, XCircle, ExternalLink
} from 'lucide-react'

const PLAN_INFO = {
  trial:    { label: 'ניסיון חינמי', color: 'bg-blue-100 text-blue-700',   icon: Clock },
  basic:    { label: 'Basic',         color: 'bg-gray-100 text-gray-700',   icon: Zap },
  pro:      { label: 'Pro',           color: 'bg-brand-100 text-brand-700', icon: Star },
  business: { label: 'Business',      color: 'bg-purple-100 text-purple-700', icon: Building2 },
}

const STATUS_INFO = {
  active:   { label: 'פעיל',        color: 'text-green-600',  icon: CheckCircle2 },
  trial:    { label: 'ניסיון',      color: 'text-blue-600',   icon: Clock },
  past_due: { label: 'תשלום דחוי', color: 'text-orange-600', icon: AlertTriangle },
  cancelled:{ label: 'בוטל',        color: 'text-red-600',    icon: XCircle },
  expired:  { label: 'פג תוקף',    color: 'text-red-600',    icon: XCircle },
}

export default function Billing() {
  const { subscription, refreshSubscription } = useAuth()
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    refreshSubscription()
  }, [])

  const handleUpgrade = async (plan: 'basic' | 'pro' | 'business') => {
    setUpgrading(plan)
    try {
      const res = await billingApi.createCheckout(plan)
      const { url } = res.data
      window.location.href = url
    } catch (err: any) {
      toast.error('שגיאה בפתיחת דף התשלום')
    } finally {
      setUpgrading(null)
    }
  }

  const handlePortal = async () => {
    setOpeningPortal(true)
    try {
      const res = await billingApi.openPortal()
      window.location.href = res.data.url
    } catch {
      toast.error('שגיאה בפתיחת פורטל הניהול')
    } finally {
      setOpeningPortal(false)
    }
  }

  const sub = subscription
  const planKey = (sub?.plan ?? 'trial') as keyof typeof PLAN_INFO
  const statusKey = (sub?.status ?? 'expired') as keyof typeof STATUS_INFO
  const PlanIcon = PLAN_INFO[planKey]?.icon ?? Zap
  const StatusIcon = STATUS_INFO[statusKey]?.icon ?? XCircle

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">חיוב ומנוי</h1>
      <p className="text-gray-500 mb-8">נהל את התוכנית וחיוב החשבון שלך</p>

      {/* Current subscription card */}
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${planKey === 'pro' ? 'bg-brand-600' : 'bg-gray-100'}`}>
              <PlanIcon size={22} className={planKey === 'pro' ? 'text-white' : 'text-gray-600'} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_INFO[planKey]?.color}`}>
                  {PLAN_INFO[planKey]?.label}
                </span>
                <span className={`flex items-center gap-1 text-xs font-medium ${STATUS_INFO[statusKey]?.color}`}>
                  <StatusIcon size={12} />
                  {STATUS_INFO[statusKey]?.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {sub?.priceIls === 0 ? 'חינמי' : `₪${sub?.priceIls}/חודש`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {sub?.status === 'trial' && (
              <div className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                <Clock size={14} />
                {trialDaysLeft > 0 ? `${trialDaysLeft} ימים נותרו בניסיון` : 'הניסיון הסתיים'}
              </div>
            )}
            {sub?.currentPeriodEnd && sub?.status === 'active' && (
              <p className="text-xs text-gray-400">
                חידוש ב-{new Date(sub.currentPeriodEnd).toLocaleDateString('he-IL')}
              </p>
            )}
            {(sub?.status === 'active' || sub?.status === 'past_due') && (
              <button
                onClick={handlePortal}
                disabled={openingPortal}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <ExternalLink size={14} />
                {openingPortal ? 'טוען...' : 'ניהול חיוב'}
              </button>
            )}
          </div>
        </div>

        {/* Limits */}
        {sub?.limits && (
          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">קמפיינים</p>
              <p className="font-semibold text-gray-800">
                {sub.limits.campaigns === -1 ? 'ללא הגבלה' : `עד ${sub.limits.campaigns}`}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">פלטפורמות</p>
              <p className="font-semibold text-gray-800">
                {sub.limits.platforms === -1 ? 'כולן' : `${sub.limits.platforms}`}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">אופטימיזציה AI</p>
              <p className={`font-semibold ${sub.limits.aiOptimization ? 'text-green-600' : 'text-gray-400'}`}>
                {sub.limits.aiOptimization ? '✓ כלול' : '✗ לא כלול'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">White-label</p>
              <p className={`font-semibold ${sub.limits.whiteLabel ? 'text-green-600' : 'text-gray-400'}`}>
                {sub.limits.whiteLabel ? '✓ כלול' : '✗ לא כלול'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade / plan selection */}
      {sub?.status !== 'active' || sub?.plan !== 'business' ? (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">שדרג את התוכנית</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {([
              { id: 'basic',    name: 'Basic',    price: 99,  icon: Zap,       highlight: false, features: ['5 קמפיינים', '2 פלטפורמות', 'קופי AI', 'ייצוא ZIP'] },
              { id: 'pro',      name: 'Pro',      price: 299, icon: Star,      highlight: true,  features: ['קמפיינים ללא הגבלה', 'כל הפלטפורמות', 'אופטימיזציה 48שע', 'אנליטיקס מלא'] },
              { id: 'business', name: 'Business', price: 799, icon: Building2, highlight: false, features: ['כל מה שב-Pro', 'White-label', 'API גישה', 'מנהל חשבון'] },
            ] as const).map((plan) => {
              const isCurrentPlan = sub?.plan === plan.id && sub?.status === 'active'
              const PlanIco = plan.icon
              return (
                <div key={plan.id} className={`card p-5 flex flex-col ${plan.highlight ? 'ring-2 ring-brand-500' : ''}`}>
                  {plan.highlight && (
                    <div className="text-xs font-bold text-brand-600 mb-2">⭐ הכי פופולרי</div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <PlanIco size={18} className={plan.highlight ? 'text-brand-600' : 'text-gray-500'} />
                    <span className="font-bold text-gray-900">{plan.name}</span>
                    <span className="mr-auto font-bold text-gray-900">₪{plan.price}/חודש</span>
                  </div>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check size={12} className="text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || upgrading === plan.id}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-green-50 text-green-700 cursor-default'
                        : plan.highlight
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrentPlan ? '✓ תוכנית נוכחית' :
                     upgrading === plan.id ? 'מעבד...' :
                     'שדרג עכשיו'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {/* Trial note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">🔒 תשלום מאובטח דרך Stripe</p>
        <p className="text-blue-600">ניתן לבטל בכל עת דרך פורטל הניהול. אין עמלות הפסקה.</p>
      </div>

      <div className="mt-4 text-center">
        <Link to="/pricing" className="text-sm text-brand-600 hover:underline">
          השוואת תוכניות מלאה ←
        </Link>
      </div>
    </div>
  )
}
