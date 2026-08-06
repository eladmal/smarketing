import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { campaignsApi, copyApi } from '../api'
import toast from 'react-hot-toast'
import { Sparkles, Trash2, RefreshCw, ChevronDown, Copy, Check, MessageSquare, X } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-50 text-blue-700',
  instagram: 'bg-pink-50 text-pink-700',
  google: 'bg-yellow-50 text-yellow-700',
  tiktok: 'bg-gray-800 text-white',
}

const TYPE_LABELS: Record<string, string> = {
  headline: 'כותרת',
  body: 'גוף הטקסט',
  cta: 'קריאה לפעולה',
  hook: 'הוק',
  story: 'סטורי',
}

const TONES = [
  { value: '', label: 'ברירת מחדל' },
  { value: 'professional', label: 'מקצועי' },
  { value: 'friendly', label: 'ידידותי' },
  { value: 'urgent', label: 'דחוף' },
  { value: 'humorous', label: 'הומוריסטי' },
  { value: 'inspirational', label: 'מעורר השראה' },
]

export default function CopyPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tone, setTone] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [improveId, setImproveId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [improving, setImproving] = useState(false)
  const [showToneDropdown, setShowToneDropdown] = useState(false)

  useEffect(() => {
    campaignsApi.list().then(r => {
      setCampaigns(r.data)
      if (r.data.length > 0) loadCampaign(r.data[0].id)
      else setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const loadCampaign = (id: number) => {
    setLoading(true)
    campaignsApi.get(id).then(r => {
      setSelectedCampaign(r.data)
    }).finally(() => setLoading(false))
  }

  const handleGenerate = async () => {
    if (!selectedCampaign) return
    setGenerating(true)
    try {
      await copyApi.generate(selectedCampaign.id, tone || undefined)
      toast.success('קופי נוצר בהצלחה!')
      loadCampaign(selectedCampaign.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'שגיאה ביצירת קופי')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('למחוק קופי זה?')) return
    try {
      await copyApi.delete(id)
      toast.success('נמחק')
      loadCampaign(selectedCampaign.id)
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleImprove = async () => {
    if (!improveId || !feedback.trim()) return
    setImproving(true)
    try {
      await copyApi.improve(improveId, feedback)
      toast.success('קופי שופר!')
      setImproveId(null)
      setFeedback('')
      loadCampaign(selectedCampaign.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בשיפור')
    } finally {
      setImproving(false)
    }
  }

  const copyVariants: any[] = selectedCampaign?.copyVariants || []

  // Group by platform
  const byPlatform: Record<string, any[]> = {}
  copyVariants.forEach(v => {
    const key = v.platform || 'general'
    if (!byPlatform[key]) byPlatform[key] = []
    byPlatform[key].push(v)
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">קופי</h1>
        <p className="text-gray-500 mt-1">AI יוצר עבורך טקסטים שיווקיים לכל פלטפורמה</p>
      </div>

      {/* Campaign selector + Generate */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">קמפיין</label>
            <select
              className="input text-sm"
              value={selectedCampaign?.id || ''}
              onChange={e => {
                const id = Number(e.target.value)
                if (id) loadCampaign(id)
              }}
            >
              {campaigns.length === 0 && <option value="">אין קמפיינים</option>}
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">טון</label>
            <button
              type="button"
              onClick={() => setShowToneDropdown(v => !v)}
              className="input text-sm flex items-center gap-2 w-40 justify-between"
            >
              {TONES.find(t => t.value === tone)?.label || 'ברירת מחדל'}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showToneDropdown && (
              <div className="absolute top-full mt-1 right-0 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setTone(t.value); setShowToneDropdown(false) }}
                    className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${tone === t.value ? 'font-semibold text-brand-600' : 'text-gray-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-5">
            <button
              onClick={handleGenerate}
              disabled={!selectedCampaign || generating}
              className="btn-primary flex items-center gap-2"
            >
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'יוצר...' : 'צור קופי'}
            </button>
          </div>
        </div>

        {selectedCampaign && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span>מוצר: <span className="text-gray-600 font-medium">{selectedCampaign.productName}</span></span>
            <span>מטרה: <span className="text-gray-600 font-medium">{selectedCampaign.goal}</span></span>
            <span>פלטפורמות: <span className="text-gray-600 font-medium">{selectedCampaign.platforms?.join(', ')}</span></span>
            <Link to={`/campaigns/${selectedCampaign.id}`} className="text-brand-500 hover:underline mr-auto">פתח קמפיין</Link>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          <p>טוען...</p>
        </div>
      )}

      {/* No variants */}
      {!loading && selectedCampaign && copyVariants.length === 0 && (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-brand-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">עדיין אין קופי לקמפיין הזה</h3>
          <p className="text-gray-400 text-sm mb-5">לחץ על "צור קופי" ו-AI יכתוב עבורך טקסטים לכל פלטפורמה</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary mx-auto flex items-center gap-2">
            <Sparkles size={16} /> צור קופי עכשיו
          </button>
        </div>
      )}

      {/* No campaign */}
      {!loading && campaigns.length === 0 && (
        <div className="card p-16 text-center">
          <p className="text-gray-500 mb-4">אין קמפיינים. צור קמפיין קודם.</p>
          <Link to="/campaigns/new" className="btn-primary">+ קמפיין חדש</Link>
        </div>
      )}

      {/* Copy variants by platform */}
      {!loading && copyVariants.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{copyVariants.length} גרסאות קופי</p>
          {Object.entries(byPlatform).map(([platform, variants]) => (
            <div key={platform}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${PLATFORM_COLORS[platform] || 'bg-gray-100 text-gray-600'}`}>
                  {platform}
                </span>
                <span className="text-xs text-gray-400">{variants.length} גרסאות</span>
              </div>
              <div className="space-y-3">
                {variants.map((v: any) => (
                  <div key={v.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {v.variantType && (
                          <span className="inline-block text-xs font-medium text-gray-400 mb-2 bg-gray-50 px-2 py-0.5 rounded-lg">
                            {TYPE_LABELS[v.variantType] || v.variantType}
                          </span>
                        )}
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{v.content}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCopy(v.content, v.id)}
                          title="העתק"
                          className="p-2 text-gray-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          {copiedId === v.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                        </button>
                        <button
                          onClick={() => { setImproveId(v.id); setFeedback('') }}
                          title="שפר"
                          className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          title="מחק"
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Improve panel */}
                    {improveId === v.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">מה לשפר?</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleImprove()}
                            placeholder='לדוגמה: "תעשה יותר קצר" / "הוסף דחיפות" / "שנה לטון רשמי"'
                            className="input text-sm flex-1"
                            autoFocus
                          />
                          <button
                            onClick={handleImprove}
                            disabled={!feedback.trim() || improving}
                            className="btn-primary px-4 text-sm"
                          >
                            {improving ? <RefreshCw size={14} className="animate-spin" /> : 'שפר'}
                          </button>
                          <button
                            onClick={() => setImproveId(null)}
                            className="btn-secondary px-3"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
