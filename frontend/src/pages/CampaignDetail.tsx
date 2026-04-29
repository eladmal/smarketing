import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { campaignsApi, copyApi, audiencesApi, assetsApi } from '../api'
import toast from 'react-hot-toast'
import {
  Wand2, Users, Image, Download, Trash2, ChevronLeft,
  RefreshCw, CheckCircle, Copy
} from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-50 text-blue-700 border-blue-100',
  instagram: 'bg-pink-50 text-pink-700 border-pink-100',
  google: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  tiktok: 'bg-gray-800 text-white border-gray-700',
}

const GOAL_LABELS: Record<string, string> = {
  awareness: 'מודעות', leads: 'לידים', sales: 'מכירות',
  traffic: 'תנועה', engagement: 'מעורבות'
}

const TYPE_LABELS: Record<string, string> = {
  headline: 'כותרת', body: 'גוף', cta: 'CTA'
}

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [generatingAudiences, setGeneratingAudiences] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'copy' | 'audiences' | 'assets'>('copy')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const loadCampaign = () => {
    campaignsApi.get(Number(id))
      .then(r => setCampaign(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCampaign() }, [id])

  const handleGenerateCopy = async () => {
    setGeneratingCopy(true)
    try {
      await copyApi.generate(Number(id))
      toast.success('קופי נוצר בהצלחה!')
      loadCampaign()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בייצור קופי')
    } finally {
      setGeneratingCopy(false)
    }
  }

  const handleGenerateAudiences = async () => {
    setGeneratingAudiences(true)
    try {
      await audiencesApi.generate(Number(id))
      toast.success('קהלי יעד נוצרו בהצלחה!')
      loadCampaign()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בייצור קהלים')
    } finally {
      setGeneratingAudiences(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await assetsApi.export(Number(id))
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `smarketing_${campaign.name}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('הקמפיין יוצא בהצלחה!')
      loadCampaign()
    } catch {
      toast.error('שגיאה בייצוא')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('למחוק את הקמפיין?')) return
    await campaignsApi.delete(Number(id))
    navigate('/campaigns')
  }

  const copyToClipboard = (text: string, variantId: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(variantId)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('הועתק!')
  }

  if (loading) return <div className="p-8 text-center text-gray-400">טוען...</div>
  if (!campaign) return <div className="p-8 text-center text-gray-400">קמפיין לא נמצא</div>

  const copyByPlatform: Record<string, any[]> = {}
  campaign.copy_variants?.forEach((v: any) => {
    if (!copyByPlatform[v.platform]) copyByPlatform[v.platform] = []
    copyByPlatform[v.platform].push(v)
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/campaigns" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
        <span className={`badge border ${
          campaign.status === 'exported' ? 'bg-blue-50 text-blue-700 border-blue-100' :
          campaign.status === 'ready' ? 'bg-green-50 text-green-700 border-green-100' :
          'bg-yellow-50 text-yellow-700 border-yellow-100'
        }`}>
          {campaign.status === 'draft' ? 'טיוטה' : campaign.status === 'ready' ? 'מוכן' : 'יוצא'}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-6 mr-8">
        <span className="badge bg-gray-100 text-gray-600">{GOAL_LABELS[campaign.goal] || campaign.goal}</span>
        {campaign.platforms?.map((p: string) => (
          <span key={p} className={`badge border ${PLATFORM_COLORS[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>
        ))}
        <span className="badge bg-gray-100 text-gray-600">
          {campaign.language === 'he' ? 'עברית' : campaign.language === 'en' ? 'אנגלית' : 'שתי שפות'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleGenerateCopy}
          disabled={generatingCopy}
          className="btn-primary flex items-center gap-2"
        >
          {generatingCopy ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {generatingCopy ? 'מייצר קופי...' : 'ייצר קופי עם AI'}
        </button>
        <button
          onClick={handleGenerateAudiences}
          disabled={generatingAudiences}
          className="btn-secondary flex items-center gap-2"
        >
          {generatingAudiences ? <RefreshCw size={16} className="animate-spin" /> : <Users size={16} />}
          {generatingAudiences ? 'מייצר קהלים...' : 'ייצר קהלי יעד'}
        </button>
        <Link to={`/assets?campaign=${id}`} className="btn-secondary flex items-center gap-2">
          <Image size={16} /> העלה גרפיקה
        </Link>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
        >
          {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'מייצא...' : 'ייצא חבילה'}
        </button>
        <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50 flex items-center gap-2">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {([
          { key: 'copy', label: 'קופי', count: campaign.copy_variants?.length },
          { key: 'audiences', label: 'קהלי יעד', count: campaign.audiences?.length },
          { key: 'assets', label: 'נכסים גרפיים', count: campaign.assets?.length },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`mr-2 badge ${activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Copy Tab */}
      {activeTab === 'copy' && (
        <div>
          {Object.keys(copyByPlatform).length === 0 ? (
            <EmptyState icon={<Wand2 size={24} />} title="עוד אין קופי" action="לחץ על ׳ייצר קופי עם AI׳ כדי להתחיל" />
          ) : (
            <div className="space-y-6">
              {Object.entries(copyByPlatform).map(([platform, variants]) => {
                const byType: Record<string, any[]> = {}
                variants.forEach(v => {
                  if (!byType[v.variant_type]) byType[v.variant_type] = []
                  byType[v.variant_type].push(v)
                })
                return (
                  <div key={platform} className="card overflow-hidden">
                    <div className={`px-5 py-3 flex items-center gap-2 border-b border-gray-100`}>
                      <span className={`badge border ${PLATFORM_COLORS[platform] || 'bg-gray-100'}`}>
                        {platform}
                      </span>
                      <span className="text-sm text-gray-400">{variants.length} וריאנטים</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {Object.entries(byType).map(([type, items]) => (
                        <div key={type}>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            {TYPE_LABELS[type] || type}
                          </p>
                          <div className="space-y-2">
                            {items.map((v, i) => (
                              <div key={v.id} className="flex items-start gap-3 group">
                                <span className="text-xs text-gray-300 mt-2 flex-shrink-0">V{i + 1}</span>
                                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed">
                                  {v.content}
                                </div>
                                <button
                                  onClick={() => copyToClipboard(v.content, v.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 text-gray-400 hover:text-brand-600"
                                >
                                  {copiedId === v.id ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Audiences Tab */}
      {activeTab === 'audiences' && (
        <div>
          {campaign.audiences?.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="עוד אין קהלי יעד" action="לחץ על ׳ייצר קהלי יעד׳ כדי להתחיל" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaign.audiences.map((a: any) => (
                <div key={a.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge border ${PLATFORM_COLORS[a.platform] || 'bg-gray-100'}`}>{a.platform}</span>
                    <span className="text-sm text-gray-400">{a.age_min}-{a.age_max}</span>
                  </div>
                  {a.interests?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 mb-2">תחומי עניין</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.interests.slice(0, 6).map((i: string) => (
                          <span key={i} className="badge bg-brand-50 text-brand-700">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {a.behaviors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">התנהגויות</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.behaviors.slice(0, 4).map((b: string) => (
                          <span key={b} className="badge bg-gray-100 text-gray-600">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div>
          {campaign.assets?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Image size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-2">עוד אין נכסים גרפיים</p>
              <Link to={`/assets?campaign=${id}`} className="btn-primary inline-flex items-center gap-2">
                <Image size={16} /> העלה גרפיקה
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {campaign.assets.map((a: any) => (
                <div key={a.id} className="card p-3">
                  <p className="text-sm font-medium text-gray-700 truncate mb-2">{a.original_filename}</p>
                  <p className="text-xs text-gray-400">{a.resized_variants?.length || 0} גדלים</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
        {icon}
      </div>
      <p className="text-gray-500 font-medium">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{action}</p>
    </div>
  )
}
