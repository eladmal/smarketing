import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import {
  TrendingUp, Eye, MousePointer, ShoppingCart, DollarSign,
  RefreshCw, Zap, CheckCircle, AlertTriangle, XCircle, BarChart2,
  ChevronRight
} from 'lucide-react'

const PLATFORM_META: Record<string, { emoji: string; color: string; name: string }> = {
  facebook:  { emoji: '📘', color: '#1877F2', name: 'פייסבוק' },
  instagram: { emoji: '📸', color: '#E4405F', name: 'אינסטגרם' },
  google:    { emoji: '🔍', color: '#4285F4', name: 'גוגל' },
  tiktok:    { emoji: '🎵', color: '#010101', name: 'טיקטוק' },
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'טיוטה', ready: 'מוכן', live: 'פעיל', paused: 'מושהה', completed: 'הסתיים',
}
const HEALTH_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  healthy: { icon: CheckCircle, color: 'text-green-500', label: 'תקין' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', label: 'אזהרה' },
  error:   { icon: XCircle,      color: 'text-red-500',   label: 'שגיאה' },
  unknown: { icon: RefreshCw,    color: 'text-gray-400',  label: 'לא נבדק' },
}

interface ReportsData {
  totals: { spend: number; impressions: number; clicks: number; conversions: number; ctr: number; roas: number }
  byPlatform: Record<string, any>
  campaigns: any[]
  totalCampaigns: number
  liveCampaigns: number
  draftCampaigns: number
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function PlatformBar({ name, emoji, color, value, max }: any) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg w-6 text-center">{emoji}</span>
      <span className="text-sm text-gray-700 w-20">{name}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-left">{pct}%</span>
    </div>
  )
}

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState<number | null>(null)
  const [optResults, setOptResults] = useState<Record<number, any>>({})

  useEffect(() => {
    api.get('/analytics/reports')
      .then(r => setData(r.data))
      .catch(() => toast.error('שגיאה בטעינת נתונים'))
      .finally(() => setLoading(false))
  }, [])

  const handleOptimize = async (campaignId: number) => {
    setOptimizing(campaignId)
    try {
      const res = await api.post(`/analytics/optimize/${campaignId}`)
      setOptResults(prev => ({ ...prev, [campaignId]: res.data }))
      toast.success('ניתוח AI הושלם!')
    } catch {
      toast.error('שגיאה בניתוח AI')
    } finally {
      setOptimizing(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw size={22} className="animate-spin ml-2" /> טוען דוחות...
    </div>
  )

  if (!data) return null

  const { totals, byPlatform, campaigns } = data
  const maxImpressions = Math.max(...Object.values(byPlatform).map((p: any) => p.impressions), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">דוחות ואופטימיזציה</h1>
        <p className="text-gray-500 mt-1">סקירת ביצועים, ניתוח פלטפורמות ושיפור AI לקמפיינים</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={BarChart2}     label="קמפיינים"    value={data.totalCampaigns}                            sub={`${data.liveCampaigns} פעילים`}   color="#6366F1" />
        <StatCard icon={Eye}           label="חשיפות"       value={totals.impressions.toLocaleString()}            sub="סך הכל"                            color="#3B82F6" />
        <StatCard icon={MousePointer}  label="קליקים"       value={totals.clicks.toLocaleString()}                 sub={`CTR ${totals.ctr}%`}              color="#10B981" />
        <StatCard icon={ShoppingCart}  label="המרות"        value={totals.conversions.toLocaleString()}            sub="סך הכל"                            color="#F59E0B" />
        <StatCard icon={DollarSign}    label="תקציב מנוצל"  value={`₪${totals.spend.toLocaleString()}`}           sub=""                                  color="#EF4444" />
        <StatCard icon={TrendingUp}    label="ROAS"          value={`${totals.roas}x`}                              sub="החזר על פרסום"                     color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform breakdown */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">ביצועים לפי פלטפורמה</h2>
          {Object.keys(byPlatform).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין נתונים עדיין — הפעל קמפיינים כדי לראות ביצועים</p>
          ) : (
            <div>
              {Object.entries(byPlatform).map(([plat, pd]: any) => {
                const meta = PLATFORM_META[plat] || { emoji: '🌐', color: '#6B7280', name: plat }
                return (
                  <div key={plat} className="border-b border-gray-50 last:border-0 pb-3 mb-3 last:pb-0 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{meta.emoji}</span>
                      <span className="font-semibold text-sm text-gray-800">{meta.name}</span>
                      <span className="mr-auto text-xs text-gray-400">CTR {pd.ctr}%</span>
                    </div>
                    <PlatformBar name="" emoji="" color={meta.color} value={pd.impressions} max={maxImpressions} />
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>👁 {pd.impressions.toLocaleString()}</span>
                      <span>🖱 {pd.clicks.toLocaleString()}</span>
                      <span>✅ {pd.conversions.toLocaleString()}</span>
                      <span>₪{pd.spend.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Campaign health */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">סטטוס קמפיינים</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין קמפיינים עדיין</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map(c => {
                const hc = HEALTH_CONFIG[c.healthStatus] || HEALTH_CONFIG.unknown
                const HIcon = hc.icon
                return (
                  <Link
                    key={c.id}
                    to={`/campaigns/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <HIcon size={16} className={hc.color} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{STATUS_LABEL[c.status] || c.status}</span>
                        {c.impressions > 0 && <span className="text-xs text-gray-400">• {c.impressions.toLocaleString()} חשיפות</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.platforms.slice(0, 3).map((p: string) => (
                        <span key={p} className="text-sm">{PLATFORM_META[p]?.emoji || '🌐'}</span>
                      ))}
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Optimization */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={18} className="text-brand-600" />
          <h2 className="font-bold text-gray-900">אופטימיזציה עם AI</h2>
          <span className="text-xs text-gray-400 mr-auto">מאופשר על ידי Claude</span>
        </div>

        {campaigns.filter(c => c.status === 'live' || c.status === 'ready').length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">אין קמפיינים פעילים לאופטימיזציה</p>
            <p className="text-gray-300 text-xs mt-1">הפעל קמפיין כדי לקבל המלצות AI</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.filter(c => c.status === 'live' || c.status === 'ready').map(c => {
              const result = optResults[c.id]
              return (
                <div key={c.id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.platforms.map((p: string) => PLATFORM_META[p]?.emoji).join(' ')}</p>
                    </div>
                    <button
                      onClick={() => handleOptimize(c.id)}
                      disabled={optimizing === c.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                      {optimizing === c.id
                        ? <><RefreshCw size={14} className="animate-spin" /> מנתח...</>
                        : <><Zap size={14} /> נתח עם AI</>
                      }
                    </button>
                  </div>

                  {result && (
                    <div className="mt-3 bg-purple-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-purple-700">{result.performanceScore}/10</span>
                        <span className="text-sm text-purple-600">ציון ביצועים</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.analysis}</p>
                      {result.recommendations?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">המלצות:</p>
                          {result.recommendations.slice(0, 3).map((r: any, i: number) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-600 bg-white rounded-lg p-2">
                              <span className="text-purple-500 font-bold shrink-0">
                                {r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢'}
                              </span>
                              <span>{r.description || r.action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
