import { useEffect, useState, useRef } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import {
  Users, Plus, Search, Download, X,
  Phone, Mail, Globe, Tag, Clock, CheckCircle, RefreshCw
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'new',       label: 'חדש',      color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'contacted', label: 'פנינו',     color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'qualified', label: 'מתאים',    color: '#8B5CF6', bg: '#F5F3FF' },
  { value: 'converted', label: 'הומר',     color: '#10B981', bg: '#ECFDF5' },
  { value: 'lost',      label: 'לא רלוונטי', color: '#6B7280', bg: '#F9FAFB' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'כל המקורות' },
  { value: 'facebook',  label: '📘 פייסבוק' },
  { value: 'instagram', label: '📸 אינסטגרם' },
  { value: 'google',    label: '🔍 גוגל' },
  { value: 'tiktok',    label: '🎵 טיקטוק' },
  { value: 'manual',    label: '✏️ ידני' },
  { value: 'form',      label: '📝 טופס' },
]

function getStatusMeta(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: meta.bg, color: meta.color }}>
      {meta.label}
    </span>
  )
}

interface Lead {
  id: number
  name?: string
  email?: string
  phone?: string
  source?: string
  campaignName?: string
  status: string
  notes?: string
  createdAt: string
}

interface Stats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  todayCount: number
  weekCount: number
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [editing, setEditing] = useState<Partial<Lead>>({})
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'manual', notes: '' })
  const saveTimer = useRef<any>(null)

  const load = async () => {
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterSource) params.source = filterSource
      if (search) params.search = search

      const [leadsRes, statsRes] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/leads/stats'),
      ])
      setLeads(leadsRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('שגיאה בטעינת לידים')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus, filterSource])

  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const openLead = (lead: Lead) => {
    setSelected(lead)
    setEditing({ status: lead.status, notes: lead.notes || '' })
  }

  const saveField = async (field: string, value: string) => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await api.patch(`/leads/${selected.id}`, { [field]: value })
      setSelected(updated.data)
      setLeads(prev => prev.map(l => l.id === selected.id ? updated.data : l))
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setEditing(e => ({ ...e, status }))
    saveField('status', status)
  }

  const handleNotesChange = (notes: string) => {
    setEditing(e => ({ ...e, notes }))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveField('notes', notes), 1000)
  }

  const deleteLead = async (id: number) => {
    if (!confirm('למחוק ליד זה?')) return
    try {
      await api.delete(`/leads/${id}`)
      setLeads(prev => prev.filter(l => l.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success('הליד נמחק')
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  const addLead = async () => {
    try {
      const res = await api.post('/leads', newLead)
      setLeads(prev => [res.data, ...prev])
      setShowAdd(false)
      setNewLead({ name: '', email: '', phone: '', source: 'manual', notes: '' })
      toast.success('ליד נוסף')
      load()
    } catch {
      toast.error('שגיאה בהוספה')
    }
  }

  const exportCsv = async () => {
    try {
      const res = await api.get('/leads/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'leads.csv'
      a.click()
    } catch {
      toast.error('שגיאה בייצוא')
    }
  }

  const conversionRate = stats
    ? Math.round(((stats.byStatus['converted'] || 0) / Math.max(stats.total, 1)) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw size={22} className="animate-spin ml-2" /> טוען לידים...
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all ${selected ? 'ml-80' : ''}`}>
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">לידים ולקוחות</h1>
              <p className="text-gray-500 mt-0.5 text-sm">כל הנרשמים והמעוניינים שהגיעו מהפרסום</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
                <Download size={14} /> ייצא CSV
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-3">
                <Plus size={14} /> הוסף ליד
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'סה"כ לידים', value: stats.total, icon: Users, color: '#6366F1' },
                { label: 'חדשים היום', value: stats.todayCount, icon: Clock, color: '#3B82F6' },
                { label: 'השבוע', value: stats.weekCount, icon: CheckCircle, color: '#10B981' },
                { label: 'אחוז המרה', value: `${conversionRate}%`, icon: Tag, color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם, אימייל או טלפון..."
                className="w-full input pr-9 text-sm"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="input text-sm min-w-36">
              <option value="">כל הסטטוסים</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="input text-sm min-w-40">
              {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <button onClick={() => setFilterStatus('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filterStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              הכל {stats ? `(${stats.total})` : ''}
            </button>
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setFilterStatus(s.value === filterStatus ? '' : s.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={filterStatus === s.value
                  ? { background: s.color, color: '#fff' }
                  : { background: s.bg, color: s.color }}>
                {s.label} {stats?.byStatus[s.value] ? `(${stats.byStatus[s.value]})` : '(0)'}
              </button>
            ))}
          </div>

          {/* Leads table */}
          {leads.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-gray-700 mb-1">אין לידים עדיין</p>
              <p className="text-gray-400 text-sm">לידים יופיעו כאן ברגע שגולשים ממלאים טפסים בקמפיינים שלך</p>
              <button onClick={() => setShowAdd(true)}
                className="btn-primary mt-4 text-sm">
                הוסף ליד ידנית
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['שם', 'פרטי קשר', 'מקור', 'קמפיין', 'סטטוס', 'תאריך', ''].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === lead.id ? 'bg-brand-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(lead.name || lead.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{lead.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {lead.email && <p className="text-xs text-gray-600 flex items-center gap-1"><Mail size={11} />{lead.email}</p>}
                          {lead.phone && <p className="text-xs text-gray-600 flex items-center gap-1"><Phone size={11} />{lead.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 truncate max-w-24 block">{lead.campaignName || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">
                          {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); deleteLead(lead.id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lead detail panel */}
      {selected && (
        <div className="fixed top-0 left-0 w-80 h-full bg-white border-r border-gray-100 shadow-2xl flex flex-col z-30 overflow-y-auto">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">פרטי ליד</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Avatar + name */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                {(selected.name || selected.email || '?')[0].toUpperCase()}
              </div>
              <p className="font-bold text-gray-900 text-lg">{selected.name || 'ללא שם'}</p>
              <p className="text-xs text-gray-400 mt-1">
                נוסף {new Date(selected.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {selected.email && (
                <a href={`mailto:${selected.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 transition-colors">
                  <Mail size={15} /> {selected.email}
                </a>
              )}
              {selected.phone && (
                <a href={`tel:${selected.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 text-sm hover:bg-green-100 transition-colors">
                  <Phone size={15} /> {selected.phone}
                </a>
              )}
              {selected.source && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-600 text-sm">
                  <Globe size={15} />
                  {SOURCE_OPTIONS.find(s => s.value === selected.source)?.label || selected.source}
                </div>
              )}
              {selected.campaignName && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-600 text-sm">
                  <Tag size={15} /> {selected.campaignName}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">סטטוס</p>
              <div className="grid grid-cols-1 gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={editing.status === s.value
                      ? { background: s.color, color: '#fff' }
                      : { background: s.bg, color: s.color }
                    }
                  >
                    {editing.status === s.value && <CheckCircle size={13} />}
                    {s.label}
                    {saving && editing.status === s.value && <RefreshCw size={11} className="animate-spin mr-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">הערות</p>
              <textarea
                value={editing.notes || ''}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="הוסף הערות על הליד..."
                rows={4}
                className="w-full input text-sm resize-none"
              />
              {saving && <p className="text-xs text-gray-400 mt-1">שומר...</p>}
            </div>
          </div>

          <div className="p-5 border-t border-gray-100">
            <button
              onClick={() => deleteLead(selected.id)}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              מחק ליד
            </button>
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">הוסף ליד ידנית</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name',  label: 'שם מלא',   type: 'text',  placeholder: 'ישראל ישראלי' },
                { key: 'email', label: 'אימייל',    type: 'email', placeholder: 'israel@example.com' },
                { key: 'phone', label: 'טלפון',     type: 'tel',   placeholder: '050-1234567' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(newLead as any)[f.key]}
                    onChange={e => setNewLead(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="input w-full text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">מקור</label>
                <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}
                  className="input w-full text-sm">
                  {SOURCE_OPTIONS.filter(s => s.value).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">הערות</label>
                <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))}
                  placeholder="הערות נוספות..."
                  rows={2} className="input w-full text-sm resize-none" />
              </div>
            </div>
            <button onClick={addLead} className="btn-primary w-full mt-5">
              הוסף ליד
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
