import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { CheckCircle, RefreshCw, Unplug, ArrowLeft, HelpCircle } from 'lucide-react'
import PlatformGuideModal from '../components/PlatformGuideModal'

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'פייסבוק',
    subtitle: 'פרסום ממומן',
    description: 'העלה קמפיינים ישירות לחשבון הפרסום שלך בפייסבוק',
    color: '#1877F2',
    bg: '#EBF5FF',
    emoji: '📘',
  },
  {
    id: 'instagram',
    name: 'אינסטגרם',
    subtitle: 'פוסטים ופרסומות',
    description: 'פרסם תוכן ממומן לאינסטגרם ישירות מהמערכת',
    color: '#E4405F',
    bg: '#FFF0F3',
    emoji: '📸',
  },
  {
    id: 'google',
    name: 'גוגל',
    subtitle: 'חיפוש ודיספליי',
    description: 'הפעל קמפיינים בגוגל אדס — חיפוש, יוטיוב ורשת המדיה',
    color: '#4285F4',
    bg: '#F0F4FF',
    emoji: '🔍',
  },
  {
    id: 'tiktok',
    name: 'טיקטוק',
    subtitle: 'וידאו קצר',
    description: 'הגע לקהל הצעיר עם קמפיינים בטיקטוק',
    color: '#010101',
    bg: '#F5F5F5',
    emoji: '🎵',
  },
]

export default function Integrations() {
  const [connections, setConnections] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [guideFor, setGuideFor] = useState<string | null>(null)

  const load = async () => {
    try {
      const [connsRes, platsRes] = await Promise.all([
        api.get('/integrations/connections'),
        api.get('/integrations/platforms'),
      ])
      setConnections(connsRes.data)
      setPlatforms(platsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const getConn = (id: string) => connections.find(c => c.platform === id)
  const getPlat = (id: string) => platforms.find(p => p.id === id)

  const handleConnect = async (id: string) => {
    setBusy(id)
    try {
      const res = await api.get(`/integrations/connect/${id}`)
      if (res.data.url) {
        window.location.href = res.data.url
      } else {
        toast.error(res.data.message || 'פלטפורמה זו עדיין לא זמינה')
      }
    } catch {
      toast.error('שגיאה בחיבור')
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm(`לנתק את ${id}?`)) return
    setBusy(id)
    try {
      await api.delete(`/integrations/disconnect/${id}`)
      toast.success('החיבור נותק')
      load()
    } catch {
      toast.error('שגיאה בניתוק')
    } finally {
      setBusy(null)
    }
  }

  const connected = PLATFORMS.filter(p => getConn(p.id)?.status === 'connected')
  const notConnected = PLATFORMS.filter(p => getConn(p.id)?.status !== 'connected')

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw size={22} className="animate-spin ml-2" /> טוען...
    </div>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">חיבור לפלטפורמות</h1>
        <p className="text-gray-500 mt-1">חבר את חשבונות הפרסום שלך — קמפיינים יעלו בקליק אחד</p>
      </div>

      {/* Connected */}
      {connected.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">מחוברים ✓</p>
          <div className="space-y-3">
            {connected.map(meta => {
              const conn = getConn(meta.id)
              return (
                <div key={meta.id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{meta.name}</p>
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> מחובר
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {conn?.accountName || conn?.accountId || meta.subtitle}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setGuideFor(meta.id)}
                      className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-all"
                      title="מדריך חיבור"
                    >
                      <HelpCircle size={15} />
                    </button>
                    <button
                      onClick={() => handleConnect(meta.id)}
                      disabled={busy === meta.id}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      חבר מחדש
                    </button>
                    <button
                      onClick={() => handleDisconnect(meta.id)}
                      disabled={busy === meta.id}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Unplug size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Not connected */}
      {notConnected.length > 0 && (
        <div>
          {connected.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">לא מחוברים</p>
          )}
          <div className="space-y-3">
            {notConnected.map(meta => {
              const plat = getPlat(meta.id)
              const isConfigured = plat?.isConfigured ?? false
              const isBusy = busy === meta.id

              return (
                <div key={meta.id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{meta.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{meta.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setGuideFor(meta.id)}
                      className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-all"
                      title="מדריך חיבור"
                    >
                      <HelpCircle size={15} />
                    </button>
                    {isConfigured ? (
                      <button
                        onClick={() => handleConnect(meta.id)}
                        disabled={isBusy}
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                        style={{ background: meta.color }}
                      >
                        {isBusy
                          ? <RefreshCw size={14} className="animate-spin" />
                          : <ArrowLeft size={14} />
                        }
                        התחבר
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                        בקרוב
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All connected */}
      {notConnected.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-bold text-gray-900 mb-1">כל הפלטפורמות מחוברות!</h3>
          <p className="text-gray-400 text-sm">קמפיינים שלך יעלו אוטומטית לכל הרשתות</p>
        </div>
      )}

      {/* Platform guide modal */}
      {guideFor && (
        <PlatformGuideModal
          platform={guideFor}
          onClose={() => setGuideFor(null)}
          onConnect={() => handleConnect(guideFor)}
        />
      )}
    </div>
  )
}
