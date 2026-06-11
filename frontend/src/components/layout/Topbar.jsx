import { Bell, Sun, Moon, Search, LogOut } from 'lucide-react'
import useThemeStore from '@/store/useThemeStore'
import useAuthStore from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const { dark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex-shrink-0 z-20">
      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          placeholder="Search leads, units, customers…"
          className="input pl-8 w-64 text-xs h-8"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <button className="btn-ghost relative p-2 rounded-lg">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
        </button>

        {/* Dark mode */}
        <button onClick={toggle} className="btn-ghost p-2 rounded-lg">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Project badge */}
        <span className="hidden sm:inline-flex px-2.5 py-0.5 text-xs font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full border border-brand-100 dark:border-brand-800 ml-1">
          Vandan Vihar
        </span>

        {/* Avatar / logout */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100 dark:border-slate-700">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0] || 'A'}
          </div>
          <span className="hidden md:block text-xs font-semibold text-gray-700 dark:text-gray-300">{user?.name || 'Admin'}</span>
          <button onClick={handleLogout} className="btn-ghost p-1.5" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
