import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function OAuthCallback() {
  const { platform } = useParams<{ platform: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (error) {
      setStatus('error')
      setMessage(errorDesc || error || 'המשתמש ביטל את החיבור')
      setTimeout(() => navigate('/integrations'), 3000)
      return
    }

    if (!code || !platform) {
      setStatus('error')
      setMessage('קוד אימות חסר')
      setTimeout(() => navigate('/integrations'), 3000)
      return
    }

    api.post(`/integrations/callback/${platform}`, { code })
      .then(res => {
        setStatus('success')
        setMessage(`${platform} חובר בהצלחה! חשבון: ${res.data.accountName || res.data.accountId || ''}`)
        setTimeout(() => navigate('/integrations'), 2500)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'שגיאה בחיבור החשבון')
        setTimeout(() => navigate('/integrations'), 3500)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm w-full mx-4">
        {status === 'loading' && (
          <>
            <RefreshCw size={40} className="text-brand-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">מחבר את {platform}...</h2>
            <p className="text-gray-500 text-sm">אנא המתן</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">החיבור הצליח! ✓</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <p className="text-xs text-gray-400 mt-3">מעביר לדף החיבורים...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">החיבור נכשל</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <p className="text-xs text-gray-400 mt-3">חוזר לדף החיבורים...</p>
          </>
        )}
      </div>
    </div>
  )
}
