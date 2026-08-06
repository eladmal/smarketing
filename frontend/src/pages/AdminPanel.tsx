import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import {
  Users, ShieldAlert,
  Search, MoreVertical,
  XCircle, Crown,
  Trash2, UserCheck, UserX, RefreshCw, X,
  BarChart2, Megaphone, UserPlus, DollarSign,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const PLAN_COLORS: Record<string, string> = {
  trial:    'bg-blue-50 text-blue-700 border-blue-200',
  basic:    'bg-gray-100 text-gray-700 border-gray-200',
  pro:      'bg-brand-50 text-brand-700 border-brand-200',
  business: 'bg-purple-50 text-purple-700 border-purple-200',
}
const PLAN_LABELS: Record<string, string> = {
  trial: 'ניסיון', basic: 'Basic', pro: 'Pro', business: 'Business',
}
const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-50 text-green-700',
  trial:     'bg-blue-50 text-blue-700',
  past_due:  'bg-orange-50 text-orange-700',
  cancelled: 'bg-red-50 text-red-700',
  expired:   'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל', trial: 'ניסיון', past_due: 'בפיגור', cancelled: 'בוטל', expired: 'פג תוקף',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface AdminUser {
  id: number
  email: string
  fullName: string
  businessName?: string
  businessType?: string
  phone?: string
  isActive: boolean
  isAdmin: boolean
  lastLoginAt?: string
  createdAt: string
  subscription?: {
    plan: string
    status: string
    trialEndsAt?: string
    currentPeriodEnd?: string
    priceIls: number
  } | null
  campaignsCount?: number
  leadsCount?: number
}

interface Stats {
  totalUsers: number
  totalCampaigns: number
  totalLeads: number
  activeSubs: number
  trialSubs: number
  expiredSubs: number
  mrr: number
  newThisMonth: number
  byPlan: Record<string, number>
}

export default function AdminPanel() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [actionMenu, setActionMenu] = useState<number | null>(null)
  const [editSub, setEditSub] = useState<{ plan: string; status: string; trialDays: string } | null>(null)
  const [tab, setTab] = useState<'users' | 'overview'>('overview')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) { navigate('/dashboard'); toast.error('אין לך הרשאות אדמין'); }
  }, [user, navigate])

  const loadStats = useCallback(async () => {
    const r = await fetch(`${API}/admin/stats`, { headers })
    if (r.ok) setStats(await r.json())
  }, [token])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (filterPlan) params.set('plan', filterPlan)
    if (filterStatus) params.set('status', filterStatus)
    const r = await fetch(`${API}/admin/users?${params}`, { headers })
    if (r.ok) {
      const data = await r.json()
      setUsers(data.items)
      setTotal(data.total)
      setPages(data.pages)
    }
    setLoading(false)
  }, [token, page, search, filterPlan, filterStatus])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadUsers() }, [loadUsers])

  const openDetail = async (id: number) => {
    const r = await fetch(`${API}/admin/users/${id}`, { headers })
    if (r.ok) { setDetailUser(await r.json()); setActionMenu(null) }
  }

  const toggleActive = async (id: number) => {
    const r = await fetch(`${API}/admin/users/${id}/toggle-active`, { method: 'PATCH', headers })
    if (r.ok) { toast.success('עודכן בהצלחה'); loadUsers(); loadStats(); setActionMenu(null) }
  }

  const deleteUser = async (id: number) => {
    if (!confirm('למחוק את המשתמש לצמיתות? פעולה זו אינה הפיכה.')) return
    const r = await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers })
    if (r.ok) { toast.success('משתמש נמחק'); loadUsers(); loadStats(); setActionMenu(null) }
  }

  const saveSubscription = async () => {
    if (!selectedUser || !editSub) return
    const body: any = { plan: editSub.plan, status: editSub.status }
    if (editSub.trialDays) body.trialDaysAdd = Number(editSub.trialDays)
    const r = await fetch(`${API}/admin/users/${selectedUser.id}/subscription`, {
      method: 'PATCH', headers, body: JSON.stringify(body),
    })
    if (r.ok) {
      toast.success('מנוי עודכן'); loadUsers(); loadStats()
      setSelectedUser(null); setEditSub(null)
    } else toast.error('שגיאה בעדכון')
  }

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL') : '—'
  const fmtTime = (d?: string) => d ? new Date(d).toLocaleString('he-IL') : '—'

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert size={18} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">ניהול מערכת</h1>
            <p className="text-xs text-gray-400">Admin Panel — Smarketing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadStats(); loadUsers() }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw size={14} /> רענן
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            חזור למערכת
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[['overview', 'סקירה כללית'], ['users', 'משתמשים']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ─── OVERVIEW TAB ─── */}
        {tab === 'overview' && stats && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users}     label="סה״כ משתמשים"   value={stats.totalUsers}    sub={`+${stats.newThisMonth} החודש`} color="bg-blue-50 text-blue-600" />
              <StatCard icon={Crown}     label="מנויים פעילים"   value={stats.activeSubs}    sub={`${stats.trialSubs} בניסיון`} color="bg-green-50 text-green-600" />
              <StatCard icon={DollarSign} label="הכנסה חודשית"  value={`₪${stats.mrr.toLocaleString()}`} sub="MRR משוער" color="bg-purple-50 text-purple-600" />
              <StatCard icon={Megaphone} label="קמפיינים"        value={stats.totalCampaigns} color="bg-orange-50 text-orange-600" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={UserPlus}  label="לידים במערכת"    value={stats.totalLeads}    color="bg-teal-50 text-teal-600" />
              <StatCard icon={XCircle}   label="פגי תוקף / בוטלו" value={stats.expiredSubs}  color="bg-red-50 text-red-600" />
              <StatCard icon={BarChart2} label="Basic"            value={stats.byPlan.basic ?? 0} color="bg-gray-100 text-gray-600" />
              <StatCard icon={BarChart2} label="Pro + Business"   value={(stats.byPlan.pro ?? 0) + (stats.byPlan.business ?? 0)} color="bg-brand-50 text-brand-600" />
            </div>

            {/* Plan breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">התפלגות לפי תוכנית</h3>
              <div className="space-y-3">
                {[
                  { key: 'trial',    label: 'ניסיון',   color: 'bg-blue-400' },
                  { key: 'basic',    label: 'Basic',     color: 'bg-gray-400' },
                  { key: 'pro',      label: 'Pro',       color: 'bg-brand-500' },
                  { key: 'business', label: 'Business',  color: 'bg-purple-500' },
                ].map(({ key, label, color }) => {
                  const count = stats.byPlan[key] ?? 0
                  const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-20 text-right">{label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-left">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── USERS TAB ─── */}
        {tab === 'users' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="חיפוש לפי שם / אימייל / עסק..."
                  className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1) }}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">כל התוכניות</option>
                <option value="trial">ניסיון</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">כל הסטטוסים</option>
                <option value="active">פעיל</option>
                <option value="trial">ניסיון</option>
                <option value="past_due">בפיגור</option>
                <option value="cancelled">בוטל</option>
                <option value="expired">פג תוקף</option>
              </select>
              <span className="text-sm text-gray-500">{total} משתמשים</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-400">טוען...</div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400">לא נמצאו משתמשים</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['#', 'משתמש', 'עסק', 'תוכנית', 'סטטוס', 'הצטרפות', 'כניסה אחרונה', 'פעולות'].map(h => (
                          <th key={h} className="text-right px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{u.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${u.isActive ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-500'}`}>
                                {u.fullName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                  {u.fullName}
                                  {u.isAdmin && <span className="text-xs bg-red-100 text-red-600 px-1 rounded">ADMIN</span>}
                                  {!u.isActive && <span className="text-xs bg-red-100 text-red-500 px-1 rounded">חסום</span>}
                                </p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{u.businessName || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${PLAN_COLORS[u.subscription?.plan ?? 'trial']}`}>
                              {PLAN_LABELS[u.subscription?.plan ?? 'trial']}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.subscription?.status ?? 'trial']}`}>
                              {STATUS_LABELS[u.subscription?.status ?? 'trial']}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{fmt(u.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{fmt(u.lastLoginAt)}</td>
                          <td className="px-4 py-3">
                            <div className="relative flex items-center gap-1">
                              <button onClick={() => openDetail(u.id)}
                                className="text-xs text-brand-600 hover:underline px-2 py-1 rounded hover:bg-brand-50">
                                פרטים
                              </button>
                              <button onClick={() => {
                                setSelectedUser(u)
                                setEditSub({ plan: u.subscription?.plan ?? 'trial', status: u.subscription?.status ?? 'trial', trialDays: '' })
                              }} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                                עדכן מנוי
                              </button>
                              <div className="relative">
                                <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                  <MoreVertical size={14} />
                                </button>
                                {actionMenu === u.id && (
                                  <div className="absolute left-0 top-8 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-36 overflow-hidden">
                                    <button onClick={() => toggleActive(u.id)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">
                                      {u.isActive ? <><UserX size={13} className="text-orange-500" /> חסום משתמש</> : <><UserCheck size={13} className="text-green-500" /> הפעל משתמש</>}
                                    </button>
                                    <button onClick={() => deleteUser(u.id)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-red-50 text-red-600">
                                      <Trash2 size={13} /> מחק לצמיתות
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── User Detail Slide-in ─── */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex" dir="rtl">
          <div className="mr-auto bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">פרטי משתמש</h2>
              <button onClick={() => setDetailUser(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                {detailUser.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{detailUser.fullName}</p>
                <p className="text-sm text-gray-500">{detailUser.email}</p>
                {detailUser.isAdmin && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">ADMIN</span>}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['עסק', detailUser.businessName],
                ['סוג עסק', detailUser.businessType],
                ['טלפון', detailUser.phone],
                ['הצטרף', fmt(detailUser.createdAt)],
                ['כניסה אחרונה', fmtTime(detailUser.lastLoginAt)],
                ['קמפיינים', detailUser.campaignsCount],
                ['לידים', detailUser.leadsCount],
                ['סטטוס חשבון', detailUser.isActive ? '✅ פעיל' : '🚫 חסום'],
              ].map(([label, val]) => val != null && (
                <div key={String(label)} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>

            {/* Subscription */}
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-4 border border-brand-100">
              <p className="text-xs font-medium text-brand-700 mb-2">מנוי</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PLAN_COLORS[detailUser.subscription?.plan ?? 'trial']}`}>
                  {PLAN_LABELS[detailUser.subscription?.plan ?? 'trial']}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailUser.subscription?.status ?? 'trial']}`}>
                  {STATUS_LABELS[detailUser.subscription?.status ?? 'trial']}
                </span>
              </div>
              {detailUser.subscription?.trialEndsAt && (
                <p className="text-xs text-gray-500">סיום ניסיון: {fmt(detailUser.subscription.trialEndsAt)}</p>
              )}
              {detailUser.subscription?.currentPeriodEnd && (
                <p className="text-xs text-gray-500">חידוש: {fmt(detailUser.subscription.currentPeriodEnd)}</p>
              )}
              {detailUser.subscription?.priceIls != null && detailUser.subscription.priceIls > 0 && (
                <p className="text-xs text-gray-500 mt-1">₪{detailUser.subscription.priceIls}/חודש</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <button onClick={() => {
                setSelectedUser(detailUser)
                setEditSub({ plan: detailUser.subscription?.plan ?? 'trial', status: detailUser.subscription?.status ?? 'trial', trialDays: '' })
                setDetailUser(null)
              }} className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
                <Crown size={15} /> עדכן מנוי
              </button>
              <button onClick={() => { toggleActive(detailUser.id); setDetailUser(null) }}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium ${detailUser.isActive ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                {detailUser.isActive ? <><UserX size={15} /> חסום משתמש</> : <><UserCheck size={15} /> הפעל משתמש</>}
              </button>
              <button onClick={() => { deleteUser(detailUser.id); setDetailUser(null) }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">
                <Trash2 size={15} /> מחק לצמיתות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Subscription Modal ─── */}
      {selectedUser && editSub && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">עדכון מנוי</h3>
              <button onClick={() => { setSelectedUser(null); setEditSub(null) }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500">{selectedUser.fullName} — {selectedUser.email}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">תוכנית</label>
                <select value={editSub.plan} onChange={e => setEditSub(p => p && ({ ...p, plan: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="trial">ניסיון (Trial)</option>
                  <option value="basic">Basic — ₪99/חודש</option>
                  <option value="pro">Pro — ₪299/חודש</option>
                  <option value="business">Business — ₪799/חודש</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">סטטוס</label>
                <select value={editSub.status} onChange={e => setEditSub(p => p && ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="trial">ניסיון</option>
                  <option value="active">פעיל</option>
                  <option value="past_due">בפיגור</option>
                  <option value="cancelled">בוטל</option>
                  <option value="expired">פג תוקף</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">הוסף ימי ניסיון (אופציונלי)</label>
                <input type="number" placeholder="למשל: 7" value={editSub.trialDays}
                  onChange={e => setEditSub(p => p && ({ ...p, trialDays: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={saveSubscription}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
                שמור שינויים
              </button>
              <button onClick={() => { setSelectedUser(null); setEditSub(null) }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close action menu on outside click */}
      {actionMenu !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
      )}
    </div>
  )
}
