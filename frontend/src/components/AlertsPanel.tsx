import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Bell, X, CheckCheck, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

const SEVERITY_STYLES: Record<string, { bg: string; icon: React.ReactNode; border: string }> = {
  success: { bg: 'bg-green-50',  border: 'border-green-100', icon: <CheckCircle size={16} className="text-green-500" /> },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-100', icon: <AlertTriangle size={16} className="text-amber-500" /> },
  error:   { bg: 'bg-red-50',    border: 'border-red-100',   icon: <XCircle size={16} className="text-red-500" /> },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-100',  icon: <Info size={16} className="text-blue-500" /> },
}

export default function AlertsPanel() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const loadAlerts = async () => {
    try {
      const [alertsRes, countRes] = await Promise.all([
        api.get('/alerts/?limit=20'),
        api.get('/alerts/unread-count'),
      ])
      setAlerts(alertsRes.data)
      setUnread(countRes.data.count)
    } catch {}
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    await api.put('/alerts/read-all')
    loadAlerts()
  }

  const handleAlertClick = async (alert: any) => {
    if (!alert.is_read) {
      await api.put(`/alerts/${alert.id}/read`)
      loadAlerts()
    }
    if (alert.action_url) {
      setOpen(false)
      navigate(alert.action_url)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await api.delete(`/alerts/${id}`)
    loadAlerts()
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">התראות</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> סמן הכל כנקרא
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">אין התראות</p>
              </div>
            ) : (
              alerts.map(alert => {
                const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`flex gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                      !alert.is_read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {!alert.is_read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-brand-500 rounded-full" />
                    )}
                    <div className={`w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0 pl-4">
                      <p className={`text-sm font-semibold ${!alert.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {new Date(alert.created_at).toLocaleString('he-IL')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, alert.id)}
                      className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-gray-300 hover:text-red-400 flex-shrink-0 self-start mt-1 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
