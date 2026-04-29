import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { campaignsApi } from '../api'
import { Plus, Megaphone, ArrowLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const GOAL_LABELS: Record<string, string> = {
  awareness: 'מודעות', leads: 'לידים', sales: 'מכירות',
  traffic: 'תנועה', engagement: 'מעורבות'
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => campaignsApi.list().then(r => setCampaigns(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    if (!confirm('למחוק קמפיין זה?')) return
    await campaignsApi.delete(id)
    toast.success('נמחק')
    load()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הקמפיינים שלי</h1>
          <p className="text-gray-500 mt-1">{campaigns.length} קמפיינים</p>
        </div>
        <Link to="/campaigns/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> קמפיין חדש
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">טוען...</div>
      ) : campaigns.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg">עוד אין קמפיינים</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">צור את הקמפיין הראשון שלך בכמה שלבים פשוטים</p>
          <Link to="/campaigns/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> קמפיין ראשון
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {campaigns.map(c => (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Megaphone size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{c.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {GOAL_LABELS[c.goal] || c.goal} · {c.platforms?.join(', ')} ·{' '}
                    {new Date(c.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge border ${
                  c.status === 'exported' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  c.status === 'ready' ? 'bg-green-50 text-green-700 border-green-100' :
                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  {c.status === 'draft' ? 'טיוטה' : c.status === 'ready' ? 'מוכן' : 'יוצא'}
                </span>
                <button
                  onClick={(e) => handleDelete(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <ArrowLeft size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
