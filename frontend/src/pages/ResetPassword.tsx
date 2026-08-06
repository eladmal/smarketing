import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { LogoBadge } from '../components/Logo'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('קישור לאיפוס חסר או שגוי')
  }, [token])

  const strength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ['', 'חלשה', 'בינונית', 'טובה', 'חזקה'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('הסיסמאות אינן תואמות'); return }
    if (password.length < 8) { toast.error('סיסמה חייבת להכיל לפחות 8 תווים'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.message || 'שגיאה באיפוס הסיסמה')
      }
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <LogoBadge size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smarketing</h1>
        </div>

        <div className="card p-8">
          {/* Error state */}
          {error ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={32} className="text-red-500" />
              </div>
              <p className="font-semibold text-gray-900">קישור לא תקין</p>
              <p className="text-sm text-gray-500">{error}</p>
              <Link to="/login" className="block w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium text-center hover:bg-brand-700">
                חזור לכניסה
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="font-bold text-gray-900 text-lg">הסיסמה עודכנה! ✓</p>
              <p className="text-sm text-gray-500">מועבר לעמוד הכניסה...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">הגדרת סיסמה חדשה</h2>
              <p className="text-sm text-gray-500 mb-6">הכנס סיסמה חדשה לחשבון שלך</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה חדשה</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="לפחות 8 תווים"
                      required
                      minLength={8}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">עוצמה: <span className="font-medium">{strengthLabel}</span></p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">אימות סיסמה</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={`input ${confirm && confirm !== password ? 'border-red-300 focus:ring-red-400' : ''}`}
                    placeholder="הכנס שוב את הסיסמה"
                    required
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">הסיסמאות אינן תואמות</p>
                  )}
                </div>

                <button type="submit" disabled={loading || password !== confirm || password.length < 8}
                  className="btn-primary w-full mt-2 disabled:opacity-50">
                  {loading ? 'מעדכן...' : 'עדכן סיסמה'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-4">
                <Link to="/login" className="text-brand-600 hover:underline">חזור לכניסה</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
