import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { LogoBadge } from '../components/Logo'

const BUSINESS_TYPES = [
  'מסחר אלקטרוני', 'שירותים מקצועיים', 'מסעדה / קפה', 'אופנה / יופי',
  'נדל"ן', 'חינוך / הדרכה', 'בריאות / כושר', 'טכנולוגיה', 'אחר'
]

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    businessType: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('סיסמה חייבת להיות לפחות 8 תווים')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('ברוך הבא ל-Smarketing! יש לך 14 יום ניסיון חינמי 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.message) {
        const msg = Array.isArray(data.message) ? data.message[0] : data.message
        toast.error(msg)
      } else if (err.message?.includes('Network') || err.code === 'ERR_NETWORK') {
        toast.error('שגיאת רשת — בדוק חיבור לאינטרנט')
      } else {
        toast.error('שגיאה בהרשמה, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <LogoBadge size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smarketing</h1>
          <p className="text-gray-500 mt-1">14 יום ניסיון חינמי — ללא כרטיס אשראי</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">יצירת חשבון</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                שם מלא <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                className="input"
                placeholder="ישראל ישראלי"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                שם משתמש
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  className="input pr-8"
                  placeholder="israel123"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">אותיות, ספרות וקו תחתי בלבד</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                אימייל <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="your@email.com"
                dir="ltr"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                טלפון נייד
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className="input"
                placeholder="050-0000000"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">לצורך אימות חשבון בעתיד</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                סיסמה <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pl-10"
                  placeholder="לפחות 8 תווים"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && form.password.length < 8 && (
                <p className="text-xs text-red-400 mt-1">סיסמה חייבת להיות לפחות 8 תווים</p>
              )}
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">שם העסק</label>
              <input
                type="text"
                value={form.businessName}
                onChange={set('businessName')}
                className="input"
                placeholder='חברת הפלאות בע"מ'
              />
            </div>

            {/* Business type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תחום עסקי</label>
              <select value={form.businessType} onChange={set('businessType')} className="input">
                <option value="">בחר תחום...</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-3 text-base"
            >
              {loading ? 'יוצר חשבון...' : 'יצירת חשבון חינם →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            כבר יש לך חשבון?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">כניסה</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            <Link to="/pricing" className="hover:text-brand-500 hover:underline">צפה בתוכניות ותמחור</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
