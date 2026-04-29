import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { billingApi } from '../api'
import { CheckCircle2, Zap, Loader2 } from 'lucide-react'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const { refreshSubscription } = useAuth()
  const [loading, setLoading] = useState(true)

  const isDevMode = searchParams.get('dev') === '1'
  const plan = searchParams.get('plan') as any

  useEffect(() => {
    const activate = async () => {
      try {
        // Dev mode: simulate activation
        if (isDevMode && plan) {
          await billingApi.devActivate(plan)
        }
        // Refresh subscription data in context
        await refreshSubscription()
      } catch {}
      setLoading(false)
    }
    activate()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">מעדכן את המנוי שלך...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-brand-50 p-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">המנוי הופעל בהצלחה! 🎉</h1>
        <p className="text-gray-500 mb-8">
          {isDevMode
            ? 'מצב פיתוח — המנוי הופעל ללא תשלום אמיתי'
            : 'התשלום בוצע בהצלחה. החשבון שלך מוכן לשימוש מלא.'}
        </p>

        <div className="bg-brand-50 rounded-xl p-4 mb-8 text-right">
          <div className="flex items-center gap-2 text-brand-700 font-semibold mb-2">
            <Zap size={16} />
            מה כלול במנוי:
          </div>
          <ul className="text-sm text-brand-600 space-y-1 list-disc list-inside">
            <li>גישה מלאה לכל תכונות הפלטפורמה</li>
            <li>יצירת קופי עם AI בעברית ובאנגלית</li>
            <li>חיבור לרשתות חברתיות</li>
            <li>ניהול קמפיינים מלא</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/dashboard" className="btn-primary w-full justify-center">
            פתח את הדאשבורד
          </Link>
          <Link to="/billing" className="text-sm text-gray-500 hover:text-gray-700">
            ניהול מנוי
          </Link>
        </div>
      </div>
    </div>
  )
}
