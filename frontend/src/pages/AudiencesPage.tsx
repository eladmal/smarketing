import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { audiencesApi, campaignsApi } from '../api'
import { Users, Megaphone } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-50 text-blue-700 border-blue-100',
  instagram: 'bg-pink-50 text-pink-700 border-pink-100',
  google: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  tiktok: 'bg-gray-800 text-white border-gray-700',
}

export default function AudiencesPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [audiences, setAudiences] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    campaignsApi.list().then(r => {
      setCampaigns(r.data)
      if (r.data.length > 0) {
        setSelected(r.data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    audiencesApi.list(selected).then(r => setAudiences(r.data)).finally(() => setLoading(false))
  }, [selected])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">קהלי יעד</h1>
        <p className="text-gray-500 mt-1">קהלי היעד שה-AI הגדיר לקמפיינים שלך</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">אין קמפיינים עם קהלי יעד</p>
          <Link to="/campaigns/new" className="btn-primary inline-flex items-center gap-2">
            <Megaphone size={16} /> צור קמפיין
          </Link>
        </div>
      ) : (
        <>
          {/* Campaign selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selected === c.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">טוען...</div>
          ) : audiences.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500">לא נוצרו קהלי יעד לקמפיין זה</p>
              <p className="text-gray-400 text-sm mt-1">פתח את הקמפיין ולחץ על ״ייצר קהלי יעד״</p>
              {selected && (
                <Link to={`/campaigns/${selected}`} className="btn-primary inline-flex items-center gap-2 mt-4">
                  פתח קמפיין
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audiences.map((a: any) => (
                <div key={a.id} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge border ${PLATFORM_COLORS[a.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {a.platform}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">גילאים: {a.age_min}–{a.age_max}</span>
                  </div>

                  {a.locations?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">מיקומים</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.locations.slice(0, 4).map((loc: string) => (
                          <span key={loc} className="badge bg-gray-100 text-gray-600">{loc}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {a.interests?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">תחומי עניין</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.interests.slice(0, 8).map((i: string) => (
                          <span key={i} className="badge bg-brand-50 text-brand-700">{i}</span>
                        ))}
                        {a.interests.length > 8 && (
                          <span className="badge bg-gray-100 text-gray-500">+{a.interests.length - 8}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {a.behaviors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">התנהגויות</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.behaviors.slice(0, 5).map((b: string) => (
                          <span key={b} className="badge bg-gray-100 text-gray-600">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
