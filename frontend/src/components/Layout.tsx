import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import AlertsPanel from './AlertsPanel'
import {
  LayoutDashboard, Megaphone, Image, Users, LogOut,
  ChevronLeft, Link2, CreditCard, Clock, FileText,
  BarChart2, UserCheck, ShieldAlert
} from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoBadge } from './Logo'

const navItems = [
  { to: '/dashboard',    label: 'דאשבורד',           icon: LayoutDashboard },
  { to: '/campaigns',    label: 'קמפיינים',           icon: Megaphone },
  { to: '/copy',         label: 'קופי',               icon: FileText },
  { to: '/assets',       label: 'נכסים גרפיים',       icon: Image },
  { to: '/audiences',    label: 'קהלי יעד',            icon: Users },
  { to: '/leads',        label: 'לידים ולקוחות',      icon: UserCheck },
  { to: '/reports',      label: 'דוחות ואופטימיזציה', icon: BarChart2 },
  { to: '/integrations', label: 'חיבורים',             icon: Link2 },
  { to: '/billing',      label: 'חיוב ומנוי',          icon: CreditCard },
]

const PLAN_LABEL: Record<string, string> = {
  trial: 'ניסיון 14 יום', basic: 'Basic', pro: 'Pro', business: 'Business'
}
const PLAN_COLOR: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700', basic: 'bg-gray-100 text-gray-600',
  pro: 'bg-brand-50 text-brand-700', business: 'bg-purple-50 text-purple-700'
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, subscription } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LogoBadge size="sm" />
            <span className="text-xl font-bold text-gray-900">Smarketing</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 mr-10">מערכת שיווק חכמה</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronLeft size={14} className="mr-auto text-brand-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Subscription badge */}
        {subscription && (
          <div className="mx-4 mb-3">
            {subscription.status === 'trial' && trialDaysLeft <= 5 && (
              <Link to="/billing" className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-lg hover:bg-orange-100 transition-all">
                <Clock size={12} />
                <span className="font-medium">{trialDaysLeft} ימים לסיום הניסיון</span>
              </Link>
            )}
            {subscription.status !== 'trial' && (
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium ${PLAN_COLOR[subscription.plan] || 'bg-gray-100 text-gray-600'}`}>
                <CreditCard size={11} />
                {PLAN_LABEL[subscription.plan] || subscription.plan}
              </div>
            )}
          </div>
        )}

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.businessName || user?.email}</p>
            </div>
          </div>
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all mb-1 font-medium"
            >
              <ShieldAlert size={16} />
              ניהול מערכת
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
          >
            <LogOut size={16} />
            התנתקות
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with alerts */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-3 flex-shrink-0">
          <AlertsPanel />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
