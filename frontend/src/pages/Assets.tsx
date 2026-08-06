import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { assetsApi } from '../api'
import toast from 'react-hot-toast'
import { Upload, Image, Trash2, RefreshCw, Download, Check } from 'lucide-react'

// ── Platform metadata ─────────────────────────────────────────────
const PLATFORM_META: Record<string, { name: string; color: string; icon: string }> = {
  facebook:  { name: 'Facebook',    color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: 'fb' },
  instagram: { name: 'Instagram',   color: 'text-pink-700 bg-pink-50 border-pink-200',       icon: 'ig' },
  tiktok:    { name: 'TikTok',      color: 'text-white bg-gray-900 border-gray-700',         icon: 'tt' },
  youtube:   { name: 'YouTube',     color: 'text-red-700 bg-red-50 border-red-200',          icon: 'yt' },
  linkedin:  { name: 'LinkedIn',    color: 'text-sky-700 bg-sky-50 border-sky-200',          icon: 'in' },
  twitter_x: { name: 'X (Twitter)', color: 'text-gray-900 bg-gray-50 border-gray-300',      icon: 'X'  },
  pinterest: { name: 'Pinterest',   color: 'text-rose-700 bg-rose-50 border-rose-200',       icon: 'P'  },
  google:    { name: 'Google Ads',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: 'G'  },
}

const PLATFORM_ORDER = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter_x', 'pinterest', 'google']

// ── Types ─────────────────────────────────────────────────────────
interface SizeInfo {
  key: string
  full_key: string
  width: number
  height: number
  label: string
  ratio_label: string
  aspect: number
}

// ── Aspect ratio preview box ──────────────────────────────────────
function AspectPreview({ width, height }: { width: number; height: number }) {
  const MAX_W = 44, MAX_H = 56
  const r = width / height
  let w: number, h: number
  if (r > MAX_W / MAX_H) { w = MAX_W;   h = MAX_W / r   }
  else                    { h = MAX_H;   w = MAX_H * r   }
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width: MAX_W, height: MAX_H }}>
      <div
        className="rounded border-2 border-brand-400 bg-brand-50"
        style={{ width: Math.max(4, Math.round(w)), height: Math.max(4, Math.round(h)) }}
      />
    </div>
  )
}

// ── Presets ───────────────────────────────────────────────────────
const PRESETS: { label: string; emoji: string; filter: (s: SizeInfo, platform: string) => boolean }[] = [
  {
    label: 'סושיאל',
    emoji: '📱',
    filter: (_s, p) => ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter_x', 'pinterest'].includes(p),
  },
  {
    label: 'Google GDN',
    emoji: '🖥️',
    filter: (_s, p) => p === 'google',
  },
  {
    label: 'סטוריז',
    emoji: '📸',
    filter: (s) => s.key.includes('story') || s.key.includes('vertical') || s.ratio_label === '9:16',
  },
  {
    label: 'ריבועי',
    emoji: '⬛',
    filter: (s) => s.ratio_label === '1:1',
  },
]

// ── Main component ────────────────────────────────────────────────
export default function Assets() {
  const [searchParams] = useSearchParams()
  const campaignId = searchParams.get('campaign')
  const fileRef = useRef<HTMLInputElement>(null)

  // Size picker state
  const [platformSizes, setPlatformSizes] = useState<Record<string, SizeInfo[]>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [activePlatform, setActivePlatform] = useState<string>('facebook')

  // Upload state
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Assets list + viewer
  const [assets, setAssets] = useState<any[]>([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [viewerTab, setViewerTab] = useState<string>('')

  // Load platform sizes
  useEffect(() => {
    assetsApi.platformSizes().then(r => {
      setPlatformSizes(r.data)
      const first = PLATFORM_ORDER.find(p => r.data[p])
      if (first) setActivePlatform(first)
    }).catch(() => toast.error('שגיאה בטעינת הגדלים'))
  }, [])

  // Load assets list
  const loadAssets = useCallback(() => {
    assetsApi.list(campaignId ? Number(campaignId) : undefined)
      .then(r => setAssets(r.data))
      .catch(() => {})
      .finally(() => setLoadingAssets(false))
  }, [campaignId])

  useEffect(() => { loadAssets() }, [loadAssets])

  // ── Size selection helpers ────────────────────────────────────
  const toggleKey = (fullKey: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      next.has(fullKey) ? next.delete(fullKey) : next.add(fullKey)
      return next
    })
  }

  const togglePlatform = (platform: string) => {
    const keys = (platformSizes[platform] || []).map(s => s.full_key)
    const allSelected = keys.every(k => selectedKeys.has(k))
    setSelectedKeys(prev => {
      const next = new Set(prev)
      allSelected ? keys.forEach(k => next.delete(k)) : keys.forEach(k => next.add(k))
      return next
    })
  }

  const applyPreset = (presetIdx: number) => {
    const preset = PRESETS[presetIdx]
    const keys: string[] = []
    Object.entries(platformSizes).forEach(([platform, sizes]) => {
      sizes.forEach(s => {
        if (preset.filter(s, platform)) keys.push(s.full_key)
      })
    })
    setSelectedKeys(new Set(keys))
  }

  const selectAll = () => {
    setSelectedKeys(new Set(
      Object.values(platformSizes).flat().map(s => s.full_key)
    ))
  }

  // ── Upload ────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('אנא העלה קובץ תמונה'); return }
    setPendingFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleUpload = async () => {
    if (!pendingFile || selectedKeys.size === 0 || uploading) return
    setUploading(true)
    try {
      const res = await assetsApi.upload(
        pendingFile,
        campaignId ? Number(campaignId) : undefined,
        [...selectedKeys].join(',')
      )
      const newAsset = res.data
      toast.success(`✅ עובד ל-${newAsset.resized_variants?.length || 0} גדלים!`)
      setPendingFile(null)
      loadAssets()
      if (newAsset) {
        setSelectedAsset(newAsset)
        setViewerTab(newAsset.resized_variants?.[0]?.platform || '')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בהעלאה')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('למחוק נכס זה?')) return
    await assetsApi.delete(id)
    toast.success('נמחק')
    if (selectedAsset?.id === id) setSelectedAsset(null)
    loadAssets()
  }

  const openAsset = (asset: any) => {
    setSelectedAsset(asset)
    setViewerTab(asset.resized_variants?.[0]?.platform || '')
  }

  // ── Derived values ────────────────────────────────────────────
  const totalSizes = Object.values(platformSizes).flat().length
  const currentSizes = platformSizes[activePlatform] || []
  const currentMeta = PLATFORM_META[activePlatform]
  const currentAllSelected = currentSizes.length > 0 && currentSizes.every(s => selectedKeys.has(s.full_key))

  const assetPlatforms = selectedAsset
    ? ([...new Set((selectedAsset.resized_variants || []).map((v: any) => v.platform))] as string[])
    : []

  const variantsForTab = (selectedAsset?.resized_variants || []).filter((v: any) => v.platform === viewerTab)

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">נכסים גרפיים</h1>
        <p className="text-gray-500 text-sm mt-1">בחר את הגדלים הרצויים, העלה תמונה — וקבל את כל הגרסאות מוכנות להורדה</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── LEFT: upload + assets list (2/5) ─────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Upload card */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              בחר קובץ תמונה
            </h2>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
                dragOver        ? 'border-brand-400 bg-brand-50' :
                pendingFile     ? 'border-green-400 bg-green-50' :
                                  'border-gray-200 hover:border-brand-300 hover:bg-brand-50/30'
              }`}
            >
              {pendingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                    <Image size={20} className="text-green-600" />
                  </div>
                  <p className="font-semibold text-green-700 text-sm leading-tight break-all px-2">{pendingFile.name}</p>
                  <p className="text-xs text-green-500">{(pendingFile.size / 1024 / 1024).toFixed(1)} MB · לחץ להחלפה</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Upload size={20} className="text-brand-600" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">גרור תמונה לכאן או לחץ</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP — כל גודל</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!pendingFile || selectedKeys.size === 0 || uploading}
              className={`mt-3 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !pendingFile || selectedKeys.size === 0 || uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              }`}
            >
              {uploading ? (
                <><RefreshCw size={15} className="animate-spin" /> מעבד גדלים...</>
              ) : (
                <><Upload size={15} />
                  {selectedKeys.size > 0
                    ? `עבד ${selectedKeys.size} גדלים`
                    : 'בחר גדלים תחילה →'}
                </>
              )}
            </button>

            {/* Hint */}
            {(!pendingFile || selectedKeys.size === 0) && !uploading && (
              <p className="text-xs text-center text-gray-400 mt-2">
                {!pendingFile ? 'העלה קובץ' : ''}{!pendingFile && selectedKeys.size === 0 ? ' ו' : ''}{selectedKeys.size === 0 ? 'בחר גדלים' : ''} כדי להתחיל
              </p>
            )}
          </div>

          {/* Assets list */}
          <div className="card p-4 flex-1">
            <h2 className="font-bold text-gray-900 text-sm mb-3">הנכסים שלי ({assets.length})</h2>
            {loadingAssets ? (
              <div className="text-center py-6"><RefreshCw size={18} className="animate-spin mx-auto text-gray-300" /></div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8">
                <Image size={22} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">עדיין לא הועלו נכסים</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto -mx-1 px-1">
                {assets.map(asset => {
                  const count = asset.resized_variants?.length || 0
                  const isActive = selectedAsset?.id === asset.id
                  return (
                    <div
                      key={asset.id}
                      onClick={() => openAsset(asset)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-brand-50 ring-1 ring-brand-400' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {asset.resized_variants?.[0]?.url ? (
                          <img src={asset.resized_variants[0].url} alt=""
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <Image size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs truncate">{asset.original_filename}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{count} גדלים</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(asset.id) }}
                        className="text-gray-300 hover:text-red-400 p-1 flex-shrink-0 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: size picker (3/5) ──────────────────────────── */}
        <div className="xl:col-span-3 card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>

          {/* Picker header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                בחר גדלים לעיבוד
              </h2>
              <div className="flex items-center gap-2">
                {selectedKeys.size > 0 && (
                  <button
                    onClick={() => setSelectedKeys(new Set())}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    נקה הכל
                  </button>
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedKeys.size > 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectedKeys.size} / {totalSizes} נבחרו
                </span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset, i) => {
                const keys: string[] = []
                Object.entries(platformSizes).forEach(([platform, sizes]) => {
                  sizes.forEach(s => { if (preset.filter(s, platform)) keys.push(s.full_key) })
                })
                const isActive = keys.length > 0 && keys.every(k => selectedKeys.has(k))
                return (
                  <button
                    key={preset.label}
                    onClick={() => isActive ? setSelectedKeys(new Set()) : applyPreset(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    {preset.label}
                    <span className="opacity-60">({keys.length})</span>
                  </button>
                )
              })}
              <button
                onClick={selectAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:border-brand-300 hover:text-brand-700 text-gray-600 bg-white transition-all"
              >
                הכל ({totalSizes})
              </button>
            </div>
          </div>

          {/* Platform tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50 gap-0.5 px-1 pt-1 flex-shrink-0">
            {PLATFORM_ORDER.filter(p => platformSizes[p]).map(platform => {
              const meta = PLATFORM_META[platform]
              const sizes = platformSizes[platform] || []
              const count = sizes.filter(s => selectedKeys.has(s.full_key)).length
              const isActive = activePlatform === platform
              return (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white border border-b-white border-gray-200 text-gray-900 -mb-px shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/70'
                  }`}
                >
                  {meta?.name || platform}
                  {count > 0 && (
                    <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full leading-none">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Size cards */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Platform sub-header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentMeta?.color || ''}`}>
                  {currentMeta?.icon || activePlatform}
                </span>
                <span className="font-semibold text-gray-800 text-sm">{currentMeta?.name || activePlatform}</span>
                <span className="text-xs text-gray-400">{currentSizes.length} גדלים</span>
              </div>
              <button
                onClick={() => togglePlatform(activePlatform)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  currentAllSelected
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700 bg-white'
                }`}
              >
                {currentAllSelected ? 'בטל הכל' : 'בחר הכל'}
              </button>
            </div>

            {/* Grid of size cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSizes.map(size => {
                const isSelected = selectedKeys.has(size.full_key)
                return (
                  <button
                    key={size.full_key}
                    onClick={() => toggleKey(size.full_key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all w-full ${
                      isSelected
                        ? 'border-brand-400 bg-brand-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-brand-200 hover:bg-brand-50/30'
                    }`}
                  >
                    {/* Aspect ratio preview */}
                    <AspectPreview width={size.width} height={size.height} />

                    {/* Size info */}
                    <div className="flex-1 text-right min-w-0">
                      <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-brand-800' : 'text-gray-800'}`}>
                        {size.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{size.width} × {size.height}</p>
                      <p className="text-xs text-gray-400">{size.ratio_label}</p>
                    </div>

                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results viewer ─────────────────────────────────────────── */}
      {selectedAsset && (
        <div className="mt-5 card overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <p className="font-bold text-gray-900 text-sm">{selectedAsset.original_filename}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedAsset.resized_variants?.length || 0} גדלים ·{' '}
                {assetPlatforms.map(p => PLATFORM_META[p]?.name || p).join(', ')}
              </p>
            </div>
            <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          {/* Platform tabs */}
          {assetPlatforms.length > 1 && (
            <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50 px-2 pt-1 gap-0.5">
              {assetPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => setViewerTab(p)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all ${
                    viewerTab === p
                      ? 'bg-white border border-b-white border-gray-200 text-brand-700 -mb-px shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {PLATFORM_META[p]?.name || p}
                  <span className="text-gray-400 font-normal">
                    ({(selectedAsset.resized_variants || []).filter((v: any) => v.platform === p).length})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Variant cards */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {variantsForTab.map((v: any, idx: number) => (
                <div key={idx} className="group">
                  {/* Preview with correct aspect ratio */}
                  <div
                    className="relative rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center w-full"
                    style={{ aspectRatio: `${v.width} / ${v.height}`, maxHeight: 180 }}
                  >
                    {v.url ? (
                      <img src={v.url} alt={v.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400 p-2">
                        <Image size={18} />
                        <span className="text-xs text-center leading-tight">{v.label}</span>
                      </div>
                    )}

                    {/* Download overlay */}
                    {v.url && (
                      <a
                        href={v.url}
                        download={v.filename || `${v.platform}_${v.size_key}.jpg`}
                        onClick={e => e.stopPropagation()}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg"
                        title="הורד"
                      >
                        <Download size={12} />
                      </a>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-1.5 px-0.5">
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{v.label}</p>
                    <p className="text-xs text-gray-400">{v.width}×{v.height} · {v.ratio_label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download all button */}
            {variantsForTab.length > 0 && (
              <div className="mt-4 flex justify-end">
                <p className="text-xs text-gray-400">
                  לחץ על תמונה להורדת גודל בודד. להורדת הכל בבת אחת — השתמש בייצוא קמפיין.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
