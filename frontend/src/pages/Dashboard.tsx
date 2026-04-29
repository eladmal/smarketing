import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { campaignsApi } from '../api'
import { Megaphone, Plus, TrendingUp, Clock, CheckCircle, Image, ArrowLeft } from 'lucide-react'

const GOAL_LABELS: Record<string, string> = {
  awareness: 'מודעות', leads: 'לידים', sales: 'מכירות',
  traffic: 'תנועה', engagement: 'מעורבות'
}
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  ready: 'bg-green-50 text-green-700 border border-green-100',
  exported: 'bg-blue-50 text-blue-700 border border-blue-100'
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה', ready: 'מוכן', exported: 'יוצא'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    campaignsApi.list().then(r => setCampaigns(r.data)).finally(() => setLoading(false))
  }, [])

  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    ready: campaigns.filter(c => c.status === 'ready').length,
    exported: campaigns.filter(c => c.status === 'exported').length,
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            שלום, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.business_name ? `${user.business_name} — ` : ''}מוכן לקמפיין הבא?
          </p>
        </div>
        <Link to="/campaigns/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          קמפיין חדש
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סה״כ קמפיינים', value: stats.total, icon: Megaphone, color: 'bg-brand-50 text-brand-600' },
          { label: 'טיוטות', value: stats.draft, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'מוכנים', value: stats.ready, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'יוצאו', value: stats.exported, icon: CheckCircle, color: 'bg-blue-50 text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">הקמפיינים שלי</h2>
          <Link to="/campaigns" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            הכל <ArrowLeft size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">טוען...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Megaphone size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">עוד אין קמפיינים</p>
            <p className="text-gray-400 text-sm mt-1">צור את הקמפיין הראשון שלך</p>
            <Link to="/campaigns/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={16} /> קמפיין חדש
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.slice(0, 8).map(c => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Megaphone size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{c.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {GOAL_LABELS[c.goal] || c.goal} · {c.platforms?.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <ArrowLeft size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Link to="/assets" className="card p-5 hover:shadow-md transition-all group cursor-pointer flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Image size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">נכסים גרפיים</p>
            <p className="text-sm text-gray-400">העלה תמונות — קבל גדלים מותאמים לכל פלטפורמה</p>
          </div>
        </Link>
        <Link to="/campaigns/new" className="card p-5 hover:shadow-md transition-all group cursor-pointer flex items-center gap-4 border-brand-100 bg-brand-50">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:bg-brand-200 transition-colors">
            <Plus size={22} className="text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">קמפיין חדש</p>
            <p className="text-sm text-gray-500">AI יכתוב לך קופי, יבנה קהלים, ויכין הכל</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
