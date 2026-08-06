import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, X, Mail, ArrowRight } from 'lucide-react'
import { LogoBadge } from '../components/Logo'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'שגיאה בכניסה')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      if (res.ok) {
        setForgotSent(true)
      } else {
        toast.error('שגיאה בשליחה, נסה שוב')
      }
    } catch {
      toast.error('שגיאת רשת')
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setForgotEmail('')
    setForgotSent(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowRight size={14} />
            לדף הבית
          </Link>
        </div>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <LogoBadge size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smarketing</h1>
          <p className="text-gray-500 mt-1">מערכת השיווק החכמה שלך</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">כניסה לחשבון</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">סיסמה</label>
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setShowForgot(true) }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  שכחתי סיסמה
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            אין לך חשבון?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              הרשמה חינם
            </Link>
          </p>
        </div>
      </div>

      {/* ─── Forgot Password Modal ─── */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Mail size={18} className="text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900">איפוס סיסמה</h3>
              </div>
              <button onClick={closeForgot} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <Mail size={28} className="text-green-500" />
                </div>
                <p className="font-semibold text-gray-900">הבקשה נשלחה!</p>
                <p className="text-sm text-gray-500">
                  אם האימייל קיים במערכת, שלחנו קישור לאיפוס הסיסמה.<br />
                  בדוק את תיבת הדואר (כולל ספאם).
                </p>
                <button onClick={closeForgot}
                  className="mt-2 w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
                  חזור לכניסה
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-gray-500">
                  הכנס את האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת אימייל</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="input"
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={forgotLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-60">
                    {forgotLoading ? 'שולח...' : <><ArrowRight size={15} /> שלח קישור</>}
                  </button>
                  <button type="button" onClick={closeForgot}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                    ביטול
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
