import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

const BUSINESS_TYPES = [
  'מסחר אלקטרוני', 'שירותים מקצועיים', 'מסעדה / קפה', 'אופנה / יופי',
  'נדל"ן', 'חינוך / הדרכה', 'בריאות / כושר', 'טכנולוגיה', 'אחר'
]

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    businessName: '', businessType: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('סיסמה חייבת להיות לפחות 8 תווים'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('ברוך הבא ל-Smarketing! יש לך 14 יום ניסיון חינמי 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'שגיאה בהרשמה'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smarketing</h1>
          <p className="text-gray-500 mt-1">14 יום ניסיון חינמי — ללא כרטיס אשראי</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">יצירת חשבון</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא</label>
                <input type="text" value={form.fullName} onChange={set('fullName')} className="input" placeholder="ישראל ישראלי" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
                <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="your@email.com" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
                <input type="password" value={form.password} onChange={set('password')} className="input" placeholder="לפחות 8 תווים" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם העסק</label>
                <input type="text" value={form.businessName} onChange={set('businessName')} className="input" placeholder="חברת הפלאות בע״מ" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">תחום עסקי</label>
                <select value={form.businessType} onChange={set('businessType')} className="input">
                  <option value="">בחר תחום...</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'יוצר חשבון...' : 'יצירת חשבון חינם'}
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
