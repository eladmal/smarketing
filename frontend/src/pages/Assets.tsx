import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { assetsApi } from '../api'
import toast from 'react-hot-toast'
import { Upload, Image, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const PLATFORMS = ['facebook', 'instagram', 'google', 'tiktok']

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-50 text-blue-700',
  instagram: 'bg-pink-50 text-pink-700',
  google: 'bg-yellow-50 text-yellow-700',
  tiktok: 'bg-gray-800 text-white',
}

export default function Assets() {
  const [searchParams] = useSearchParams()
  const campaignId = searchParams.get('campaign')
  const fileRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram', 'google', 'tiktok'])
  const [expandedAsset, setExpandedAsset] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const load = () => {
    assetsApi.list(campaignId ? Number(campaignId) : undefined)
      .then(r => setAssets(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [campaignId])

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('אנא העלה קובץ תמונה')
      return
    }
    setUploading(true)
    try {
      await assetsApi.upload(file, campaignId ? Number(campaignId) : undefined, selectedPlatforms.join(','))
      toast.success(`תמונה עובדה ל-${selectedPlatforms.length} פלטפורמות!`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בהעלאה')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('למחוק נכס זה?')) return
    await assetsApi.delete(id)
    toast.success('נמחק')
    load()
  }

  const variantsByPlatform = (variants: any[]) => {
    const byPlatform: Record<string, any[]> = {}
    variants?.forEach(v => {
      if (!byPlatform[v.platform]) byPlatform[v.platform] = []
      byPlatform[v.platform].push(v)
    })
    return byPlatform
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">נכסים גרפיים</h1>
        <p className="text-gray-500 mt-1">העלה תמונה — קבל גדלים מותאמים לכל פלטפורמה אוטומטית</p>
      </div>

      {/* Upload Area */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">העלאת תמונה חדשה</h2>

        {/* Platform selection */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">פלטפורמות להתאמה:</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPlatforms.includes(p)
                    ? `${PLATFORM_COLORS[p]} border-current`
                    : 'border-gray-100 bg-white text-gray-400'
                }`}
              >
                {p} {selectedPlatforms.includes(p) ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragOver ? 'border-brand-400 bg-brand-50' :
            uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' :
            'border-gray-200 hover:border-brand-300 hover:bg-brand-50/30'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={32} className="text-brand-600 animate-spin" />
              <p className="font-medium text-gray-700">מעבד ומתאים גדלים...</p>
              <p className="text-sm text-gray-400">זה עלול לקחת כמה שניות</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
                <Upload size={24} className="text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">גרור תמונה לכאן או לחץ לבחירה</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP עד 10MB</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Platform sizes info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { platform: 'facebook', sizes: ['1080×1080', '1200×628', '1080×1920', '820×312'] },
          { platform: 'instagram', sizes: ['1080×1080', '1080×1350', '1080×1920'] },
          { platform: 'google', sizes: ['300×250', '728×90', '160×600', '1200×628'] },
          { platform: 'tiktok', sizes: ['1080×1920', '1080×1080'] },
        ].map(({ platform, sizes }) => (
          <div key={platform} className="card p-4">
            <span className={`badge mb-2 ${PLATFORM_COLORS[platform]}`}>{platform}</span>
            <div className="space-y-1">
              {sizes.map(s => (
                <p key={s} className="text-xs text-gray-500 font-mono">{s}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Assets list */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">הנכסים שלי ({assets.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">טוען...</div>
        ) : assets.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Image size={22} className="text-gray-400" />
            </div>
            <p className="text-gray-500">עוד לא הועלו נכסים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => {
              const byPlatform = variantsByPlatform(asset.resized_variants)
              const isExpanded = expandedAsset === asset.id
              return (
                <div key={asset.id} className="card overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Image size={18} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{asset.original_filename}</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {asset.resized_variants?.length || 0} גדלים ·{' '}
                          {Object.keys(byPlatform).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id) }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(byPlatform).map(([platform, variants]) => (
                          <div key={platform}>
                            <span className={`badge mb-2 ${PLATFORM_COLORS[platform]}`}>{platform}</span>
                            <div className="space-y-1.5">
                              {variants.map((v: any) => (
                                <div key={v.size_key} className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                  {v.label} ({v.width}×{v.height})
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
