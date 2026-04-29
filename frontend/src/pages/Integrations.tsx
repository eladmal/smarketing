import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Unplug, Globe } from 'lucide-react'

const PLATFORM_META: Record<string, { color: string; bg: string; logo: string }> = {
  facebook:  { color: 'text-blue-600',  bg: 'bg-blue-50',   logo: '𝒇' },
  instagram: { color: 'text-pink-600',  bg: 'bg-pink-50',   logo: '📷' },
  google:    { color: 'text-yellow-600', bg: 'bg-yellow-50', logo: 'G' },
  tiktok:    { color: 'text-gray-900',  bg: 'bg-gray-100',  logo: '♪' },
}

const SETUP_GUIDES: Record<string, string> = {
  facebook:  'https://developers.facebook.com/apps/',
  instagram: 'https://developers.facebook.com/apps/',
  google:    'https://console.cloud.google.com/',
  tiktok:    'https://business-api.tiktok.com/portal/',
}

export default function Integrations() {
  const [connections, setConnections] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const load = async () => {
    const [connsRes, platsRes] = await Promise.all([
      api.get('/integrations/connections'),
      api.get('/integrations/platforms'),
    ])
    setConnections(connsRes.data)
    setPlatforms(platsRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const getConnection = (platform: string) =>
    connections.find(c => c.platform === platform)

  const handleConnect = async (platform: string) => {
    setConnecting(platform)
    try {
      const res = await api.get(`/integrations/connect/${platform}`)
      if (res.data.ready) {
        window.location.href = res.data.url
      } else {
        toast.error(res.data.message || 'יש להגדיר את מפתחות ה-API קודם')
      }
    } catch {
      toast.error('שגיאה בחיבור')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform)
    try {
      await api.delete(`/integrations/disconnect/${platform}`)
      toast.success(`${platform} נותק`)
      load()
    } catch {
      toast.error('שגיאה בניתוק')
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">טוען...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">חיבורים לרשתות חברתיות</h1>
        <p className="text-gray-500 mt-1">חבר את חשבונות הפרסום שלך — קמפיינים יעלו אוטומטית</p>
      </div>

      {/* How it works */}
      <div className="card p-5 mb-8 bg-brand-50 border-brand-100">
        <h3 className="font-bold text-brand-900 mb-3 flex items-center gap-2">
          <Globe size={18} /> איך זה עובד?
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { step: '1', text: 'לחץ "התחבר" ליד הפלטפורמה הרצויה' },
            { step: '2', text: 'אשר הרשאות בדף הרשמי של הפלטפורמה' },
            { step: '3', text: 'קמפיינים חדשים יעלו אוטומטית לחשבונך' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <p className="text-brand-800">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((plat: any) => {
          const conn = getConnection(plat.id)
          const isConnected = conn?.status === 'connected'
          const meta = PLATFORM_META[plat.id] || { color: 'text-gray-600', bg: 'bg-gray-50', logo: '?' }
          const isConnecting = connecting === plat.id
          const isDisconnecting = disconnecting === plat.id

          return (
            <div key={plat.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center text-xl font-bold ${meta.color}`}>
                    {meta.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{plat.name}</h3>
                    {isConnected ? (
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-0.5">
                        <CheckCircle size={12} /> {conn.account_name || 'מחובר'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                        <XCircle size={12} /> לא מחובר
                      </p>
                    )}
                  </div>
                </div>

                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-200'}`} />
              </div>

              {/* Status details */}
              {isConnected && conn.connected_at && (
                <div className="text-xs text-gray-400 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                  חובר ב: {new Date(conn.connected_at).toLocaleDateString('he-IL')}
                  {conn.token_expires_at && (
                    <span className="mr-3">
                      תוקף: {new Date(conn.token_expires_at).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
              )}

              {/* Setup required indicator */}
              {!plat.is_configured && (
                <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                  <span>דורש הגדרת API Keys</span>
                  <a href={SETUP_GUIDES[plat.id]} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-amber-700 hover:underline">
                    הוראות <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleConnect(plat.id)}
                      disabled={!!isConnecting}
                      className="btn-secondary flex items-center gap-2 flex-1 justify-center text-sm py-2"
                    >
                      <RefreshCw size={14} /> חבר מחדש
                    </button>
                    <button
                      onClick={() => handleDisconnect(plat.id)}
                      disabled={!!isDisconnecting}
                      className="btn-ghost flex items-center gap-2 text-red-500 hover:bg-red-50 text-sm"
                    >
                      {isDisconnecting ? <RefreshCw size={14} className="animate-spin" /> : <Unplug size={14} />}
                      נתק
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(plat.id)}
                    disabled={!!isConnecting}
                    className={`w-full flex items-center gap-2 justify-center text-sm py-2.5 rounded-xl font-semibold transition-all ${
                      plat.is_configured
                        ? 'btn-primary'
                        : 'bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200'
                    }`}
                  >
                    {isConnecting
                      ? <><RefreshCw size={14} className="animate-spin" /> מתחבר...</>
                      : `התחבר ל-${plat.name}`
                    }
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* API Keys setup guide */}
      <div className="card p-6 mt-6">
        <h3 className="font-bold text-gray-900 mb-3">הגדרת מפתחות API</h3>
        <p className="text-sm text-gray-500 mb-4">
          כדי לאפשר חיבור לפלטפורמות, יש להוסיף את המפתחות לקובץ <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">backend/.env</code>
        </p>
        <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 space-y-1">
          <div className="text-gray-500"># Facebook & Instagram</div>
          <div>FACEBOOK_APP_ID=<span className="text-yellow-300">your_app_id</span></div>
          <div>FACEBOOK_APP_SECRET=<span className="text-yellow-300">your_app_secret</span></div>
          <div className="text-gray-500 mt-2"># Google Ads</div>
          <div>GOOGLE_CLIENT_ID=<span className="text-yellow-300">your_client_id</span></div>
          <div>GOOGLE_CLIENT_SECRET=<span className="text-yellow-300">your_secret</span></div>
          <div>GOOGLE_ADS_DEVELOPER_TOKEN=<span className="text-yellow-300">your_token</span></div>
          <div className="text-gray-500 mt-2"># TikTok</div>
          <div>TIKTOK_APP_ID=<span className="text-yellow-300">your_app_id</span></div>
          <div>TIKTOK_APP_SECRET=<span className="text-yellow-300">your_secret</span></div>
        </div>
      </div>
    </div>
  )
}
