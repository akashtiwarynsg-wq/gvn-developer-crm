import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Warehouse, ClipboardList,
  CreditCard, UserCheck, Handshake, CheckSquare, BarChart2,
  Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants'
import useThemeStore from '@/store/useThemeStore'
import { cn } from '@/lib/utils'

const ICONS = {
  LayoutDashboard, Users, Building2, Warehouse, ClipboardList,
  CreditCard, UserCheck, Handshake, CheckSquare, BarChart2, Settings
}

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useThemeStore()

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 transition-all duration-300 flex-shrink-0 relative z-30',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 font-black text-white text-sm">G</div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">GVN Developer</p>
            <p className="text-slate-400 text-xs font-medium">Vandan Vihar CRM</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn('sidebar-link', isActive && 'sidebar-link-active', !sidebarOpen && 'justify-center')
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              {Icon && <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />}
              {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white hover:bg-brand-600 transition-colors z-40"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className={cn('flex items-center gap-2', !sidebarOpen && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">Admin User</p>
              <p className="text-slate-400 text-[10px]">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
