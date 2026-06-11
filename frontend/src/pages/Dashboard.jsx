import { useCallback } from 'react'
import { Users, Flame, Building2, ClipboardList, IndianRupee, Clock, Calendar, Warehouse } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import StatCard from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Misc'
import { reportsApi } from '@/lib/api'
import { useData } from '@/hooks/useData'
import { fmt } from '@/lib/utils'

const COLORS = ['#dc2626','#ea580c','#ca8a04','#1e293b','#6366f1','#0891b2','#7c3aed','#0d9488']

const STATUS_BADGE = {
  'Hot Lead':         'bg-red-100 text-red-700',
  'Visit Scheduled':  'bg-indigo-100 text-indigo-700',
  'Warm Lead':        'bg-orange-100 text-orange-700',
  'Interested':       'bg-cyan-100 text-cyan-700',
  'New Lead':         'bg-purple-100 text-purple-700',
  'Negotiation':      'bg-yellow-100 text-yellow-700',
  'Booking Done':     'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const { data: dash,    loading: l1 } = useData(useCallback(() => reportsApi.dashboard(), []))
  const { data: monthly, loading: l2 } = useData(useCallback(() => reportsApi.monthlyTrend(), []))
  const { data: sources, loading: l3 } = useData(useCallback(() => reportsApi.leadSources(), []))
  const { data: sales,   loading: l4 } = useData(useCallback(() => reportsApi.salesPerformance(), []))
  const { data: invSum,  loading: l5 } = useData(useCallback(() => reportsApi.inventorySummary(), []))

  const loading = l1 || l2 || l3

  // Shape API data for charts
  const monthlyChart = (monthly || []).map(r => ({
    month:    r.label?.split(' ')[0] || r.month,
    leads:    Number(r.leads_count   || 0),
    bookings: Number(r.bookings_count|| 0),
    revenue:  Number(r.revenue       || 0),
  }))

  const sourceChart = (sources || []).map(r => ({
    name:  r.source?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: Number(r.count || 0),
  }))

  const execChart = (sales || []).map(r => ({
    name:     r.name?.split(' ')[0],
    leads:    Number(r.total_leads  || 0),
    bookings: Number(r.bookings     || 0),
  }))

  const invStatusCounts = (() => {
    if (!invSum) return { available: 0, booked: 0, sold: 0, total: 0 }
    const agg = { available: 0, booked: 0, sold: 0, blocked: 0, total: 0 }
    invSum.forEach(r => {
      agg.available += Number(r.available || 0)
      agg.booked    += Number(r.booked    || 0)
      agg.sold      += Number(r.sold      || 0)
      agg.total     += Number(r.total     || 0)
    })
    return agg
  })()

  const d = dash || {}
  const leads    = d.leads    || {}
  const inv      = d.inventory|| {}
  const bookings = d.bookings || {}
  const payments = d.payments || {}
  const visits   = d.visits   || {}
  const tasks    = d.tasks    || {}

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vandan Vihar — live overview</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Leads"       value={leads.total      || 0} sub={`+${leads.added_today||0} today`} accent="brand"  />
        <StatCard icon={Flame}        label="Hot Leads"         value={leads.hot        || 0}                                        accent="orange" />
        <StatCard icon={Building2}    label="Visits Scheduled"  value={visits.scheduled || 0} sub="This week"                        accent="blue"   />
        <StatCard icon={ClipboardList}label="Bookings (month)"  value={bookings.this_month||0}                                       accent="green"  />
        <StatCard icon={IndianRupee}  label="Revenue Collected" value={fmt.crores(payments.collected)} sub="Total"                   accent="teal"   />
        <StatCard icon={Clock}        label="Pending Dues"      value={fmt.lakhs(payments.pending)} sub={`${payments.pending_count||0} payments`} accent="orange"/>
        <StatCard icon={Calendar}     label="Tasks Due Today"   value={tasks.due_today  || 0}                                        accent="purple" />
        <StatCard icon={Warehouse}    label="Units Available"   value={inv.available    || 0} sub={`of ${inv.total||0} total`}       accent="brand"  />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Leads & Bookings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChart} margin={{ top:4, right:4, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Area type="monotone" dataKey="leads"    stroke="#dc2626" fill="url(#gLead)" strokeWidth={2} name="Leads"/>
              <Area type="monotone" dataKey="bookings" stroke="#16a34a" fill="none"        strokeWidth={2} name="Bookings" strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Lead Sources</h3>
          {sourceChart.length === 0
            ? <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceChart} cx="50%" cy="50%" innerRadius={50} outerRadius={82} dataKey="value" paddingAngle={2}>
                    {sourceChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                  <Legend iconSize={9} wrapperStyle={{ fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Revenue Trend (₹)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyChart} margin={{ left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/>
              <YAxis tick={{ fontSize:11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`}/>
              <Tooltip formatter={v => fmt.lakhs(v)}/>
              <Bar dataKey="revenue" fill="#dc2626" radius={[4,4,0,0]} name="Revenue"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Sales Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={execChart} layout="vertical" margin={{ left:8, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
              <XAxis type="number" tick={{ fontSize:11 }}/>
              <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={68}/>
              <Tooltip/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              <Bar dataKey="leads"    fill="#1e293b" radius={[0,3,3,0]} name="Leads"/>
              <Bar dataKey="bookings" fill="#dc2626" radius={[0,3,3,0]} name="Bookings"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Inventory Status</h3>
          <div className="space-y-3 mt-2">
            {[
              { label:'Available', count: invStatusCounts.available, color:'#16a34a' },
              { label:'Booked',    count: invStatusCounts.booked,    color:'#ea580c' },
              { label:'Sold',      count: invStatusCounts.sold,      color:'#dc2626' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-20">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }}/>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: invStatusCounts.total ? `${(s.count/invStatusCounts.total)*100}%` : '0%', background: s.color }}/>
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 w-5 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-400">Total Units</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{invStatusCounts.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">% Available</p>
              <p className="text-xl font-bold text-brand-600">
                {invStatusCounts.total ? Math.round((invStatusCounts.available/invStatusCounts.total)*100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
