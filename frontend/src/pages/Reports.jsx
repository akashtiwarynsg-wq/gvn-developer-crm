import { useCallback, useState } from 'react'
import { Download, BarChart2, FileText, TrendingUp, Users, Warehouse, Handshake, IndianRupee, ClipboardList } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { reportsApi } from '@/lib/api'
import { useData } from '@/hooks/useData'
import { PageHeader } from '@/components/ui/Misc'
import Button from '@/components/ui/Button'
import { fmt } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLORS = ['#dc2626','#ea580c','#ca8a04','#1e293b','#6366f1','#0891b2','#7c3aed','#0d9488']

const REPORT_CARDS = [
  { icon: Users,         title: 'Lead Report',            desc: 'Daily & monthly lead analysis with source breakdown',   tag: 'leads'     },
  { icon: ClipboardList, title: 'Site Visit Report',       desc: 'Scheduled, completed and cancelled visits summary',     tag: 'visits'    },
  { icon: FileText,      title: 'Booking Report',          desc: 'All bookings with unit allocation and status',          tag: 'bookings'  },
  { icon: IndianRupee,   title: 'Revenue Report',          desc: 'Payment collections, outstanding and projections',      tag: 'revenue'   },
  { icon: Warehouse,     title: 'Inventory Report',        desc: 'Unit availability, pricing and status breakdown',       tag: 'inventory' },
  { icon: Handshake,     title: 'Broker Report',           desc: 'Channel partner referrals, bookings and commissions',   tag: 'brokers'   },
  { icon: TrendingUp,    title: 'Sales Performance',       desc: 'Executive-wise lead, visit and booking comparison',     tag: 'sales'     },
  { icon: BarChart2,     title: 'Monthly MIS Report',      desc: 'Comprehensive management information summary',          tag: 'mis'       },
]

function ChartCard({ title, children, tag, loading }) {
  const handleExport = (format) => {
    toast.success(`Exporting ${title} as ${format.toUpperCase()}…\nEndpoint: /api/reports/export/${tag}?format=${format}`)
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')}   className="btn-ghost text-xs py-1 px-2"><Download className="w-3 h-3 mr-1"/>PDF</button>
          <button onClick={() => handleExport('excel')} className="btn-ghost text-xs py-1 px-2"><Download className="w-3 h-3 mr-1"/>Excel</button>
        </div>
      </div>
      {loading
        ? <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        : children
      }
    </div>
  )
}

export default function Reports() {
  const { data: monthly,  loading: l1 } = useData(useCallback(() => reportsApi.monthlyTrend(),     []))
  const { data: sources,  loading: l2 } = useData(useCallback(() => reportsApi.leadSources(),      []))
  const { data: sales,    loading: l3 } = useData(useCallback(() => reportsApi.salesPerformance(), []))
  const { data: invSum,   loading: l4 } = useData(useCallback(() => reportsApi.inventorySummary(), []))
  const { data: brokers,  loading: l5 } = useData(useCallback(() => reportsApi.brokerPerformance(),[]))
  const { data: outstand, loading: l6 } = useData(useCallback(() => reportsApi.paymentOutstanding(),[]))

  const monthlyChart = (monthly || []).map(r => ({
    month:    r.label?.split(' ')[0] || '',
    leads:    Number(r.leads_count    || 0),
    bookings: Number(r.bookings_count || 0),
    revenue:  Number(r.revenue        || 0),
  }))

  const sourceChart = (sources || []).map(r => ({
    name:  r.source?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    value: Number(r.count || 0),
  }))

  const execChart = (sales || []).map(r => ({
    name:     r.name?.split(' ')[0],
    leads:    Number(r.total_leads || 0),
    visits:   Number(r.visits      || 0),
    bookings: Number(r.bookings    || 0),
  }))

  const handleExport = (tag, format) => {
    toast.success(`Exporting ${tag} report as ${format.toUpperCase()}…`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Generate, view and export all CRM reports"/>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_CARDS.map(r => {
          const Icon = r.icon
          return (
            <div key={r.tag} className="card card-hover p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600"/>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{r.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport(r.tag,'pdf')}
                  className="flex-1 text-xs bg-red-50 dark:bg-red-950/40 text-brand-600 font-semibold py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                  PDF
                </button>
                <button onClick={() => handleExport(r.tag,'excel')}
                  className="flex-1 text-xs bg-green-50 dark:bg-green-950/40 text-green-700 font-semibold py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                  Excel
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly trend */}
      <ChartCard title="Monthly Leads, Bookings & Revenue" tag="monthly" loading={l1}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyChart} margin={{ left:-20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
            <XAxis dataKey="month" tick={{ fontSize:11 }}/>
            <YAxis yAxisId="left"  tick={{ fontSize:11 }}/>
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} tickFormatter={v=>`${(v/1e6).toFixed(0)}M`}/>
            <Tooltip/>
            <Legend wrapperStyle={{ fontSize:12 }}/>
            <Bar yAxisId="left"  dataKey="leads"    fill="#1e293b" radius={[4,4,0,0]} name="Leads"/>
            <Bar yAxisId="left"  dataKey="bookings" fill="#dc2626" radius={[4,4,0,0]} name="Bookings"/>
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Revenue (₹)" dot={{ r:3 }}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Source + Executive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Lead Source Performance" tag="sources" loading={l2}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                {sourceChart.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
              <Legend iconSize={9} wrapperStyle={{ fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales Executive Performance" tag="sales" loading={l3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={execChart} layout="vertical" margin={{ left:10, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
              <XAxis type="number" tick={{ fontSize:11 }}/>
              <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={76}/>
              <Tooltip/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              <Bar dataKey="leads"    fill="#1e293b" radius={[0,4,4,0]} name="Leads"/>
              <Bar dataKey="visits"   fill="#6366f1" radius={[0,4,4,0]} name="Visits"/>
              <Bar dataKey="bookings" fill="#dc2626" radius={[0,4,4,0]} name="Bookings"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Inventory table */}
      <ChartCard title="Inventory Status by Property Type" tag="inventory" loading={l4}>
        <div className="table-wrapper">
          <table className="w-full bg-white dark:bg-slate-800">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                {['Property Type','Total','Available','Booked','Sold','Avail %'].map(h => (
                  <th key={h} className="table-head">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invSum || []).map((r, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell font-semibold">{r.property_type}</td>
                  <td className="table-cell font-bold">{r.total}</td>
                  <td className="table-cell"><span className="text-green-600 font-semibold">{r.available}</span></td>
                  <td className="table-cell"><span className="text-orange-600 font-semibold">{r.booked}</span></td>
                  <td className="table-cell"><span className="text-red-600 font-semibold">{r.sold}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width:`${r.total?Math.round((r.available/r.total)*100):0}%`}}/>
                      </div>
                      <span className="text-xs font-semibold">{r.total?Math.round((r.available/r.total)*100):0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Outstanding payments */}
      {(outstand || []).length > 0 && (
        <ChartCard title="Outstanding Payments" tag="outstanding" loading={l6}>
          <div className="table-wrapper">
            <table className="w-full bg-white dark:bg-slate-800">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  {['Customer','Unit','Type','Amount','Due Date','Status'].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(outstand || []).map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell font-semibold">{r.customer_name}</td>
                    <td className="table-cell">{r.unit_number}</td>
                    <td className="table-cell">{r.payment_type}</td>
                    <td className="table-cell font-bold text-orange-600">{fmt.lakhs(r.amount)}</td>
                    <td className="table-cell">
                      <span className={r.is_overdue ? 'text-red-500 font-semibold text-xs' : 'text-xs text-gray-500'}>
                        {r.is_overdue ? '⚠ ' : ''}{fmt.date(r.due_date)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${r.is_overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.is_overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/* Broker performance */}
      {(brokers || []).length > 0 && (
        <ChartCard title="Broker Performance" tag="brokers" loading={l5}>
          <div className="table-wrapper">
            <table className="w-full bg-white dark:bg-slate-800">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  {['Broker','Agency','RERA No','Commission','Leads Referred'].map(h=>(
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(brokers || []).map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell font-semibold">{r.name}</td>
                    <td className="table-cell">{r.agency_name || '—'}</td>
                    <td className="table-cell font-mono text-xs">{r.rera_number || '—'}</td>
                    <td className="table-cell text-brand-600 font-semibold">{r.commission_pct}%</td>
                    <td className="table-cell font-bold">{r.referred_leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  )
}
