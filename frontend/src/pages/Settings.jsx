import { useState, useCallback } from 'react'
import { Plus, Edit2, Save, Users, Shield, Database, Bell, Building2 } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { USER_ROLES, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/constants'
import { getStatusMeta } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal  from '@/components/ui/Modal'
import Badge  from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Misc'
import toast from 'react-hot-toast'

const ROLE_PERMS = {
  admin:           { leads:'Full',   inventory:'Full',  bookings:'Full',   payments:'Full',     reports:'Full',    users:'Full',  settings:'Full'    },
  sales_manager:   { leads:'Full',   inventory:'Edit',  bookings:'Full',   payments:'View',     reports:'Full',    users:'View',  settings:'View'    },
  sales_executive: { leads:'Full',   inventory:'View',  bookings:'Create', payments:'View',     reports:'Own',     users:'None',  settings:'None'    },
  accounts:        { leads:'View',   inventory:'View',  bookings:'View',   payments:'Full',     reports:'Payments',users:'None',  settings:'None'    },
}
const PERM_COLS  = ['leads','inventory','bookings','payments','reports','users','settings']
const PERM_COLOR = {
  Full:'bg-green-100 text-green-700', Edit:'bg-blue-100 text-blue-700',
  View:'bg-gray-100 text-gray-600',   Create:'bg-purple-100 text-purple-700',
  Own:'bg-yellow-100 text-yellow-700',None:'bg-red-50 text-red-400',
  Payments:'bg-teal-100 text-teal-700',
}
const TABS = [
  { key:'users',   label:'User Management', icon:Users    },
  { key:'roles',   label:'Role Permissions',icon:Shield   },
  { key:'sources', label:'Lead Sources',    icon:Database },
  { key:'company', label:'Company Settings',icon:Building2},
  { key:'notif',   label:'Notifications',   icon:Bell     },
]
const BLANK_USER = { name:'', email:'', phone:'', role:'sales_executive', password:'' }
const COMPANY_DEFAULTS = {
  name:'GVN Developer', project:'Vandan Vihar', location:'Wadki, Pune',
  phone:'9000000000', email:'info@gvndeveloper.com',
  website:'www.gvndeveloper.com', rera:'RERA-MH-XXXXX', gstin:'27AAAAA0000A1Z5'
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
      <div>
        <p className="font-semibold text-sm text-gray-800 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value?'bg-brand-600':'bg-gray-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value?'left-[22px]':'left-0.5'}`}/>
      </button>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users')
  const [modal,    setModal]      = useState(null)
  const [selected, setSelected]   = useState(null)
  const [form,     setForm]       = useState(BLANK_USER)
  const [company,  setCompany]    = useState(COMPANY_DEFAULTS)
  const [notifs,   setNotifs]     = useState({
    followup:true, visits:true, payment:true, booking:true,
    newLead:true,  taskDue:false, weeklyReport:false, whatsapp:false, sms:false
  })
  const fc = (k,v) => setForm(p=>({...p,[k]:v}))
  const cc = (k,v) => setCompany(p=>({...p,[k]:v}))

  const { items:users, loading, refetch } = useList(useCallback(()=>usersApi.getAll(),[]),{ limit:50 })

  const { mutate:createUser, loading:creating } = useMutation(
    d => usersApi.create(d),
    { successMsg:'User created. Default password set.', onSuccess:()=>{ setModal(null); refetch() } }
  )
  const { mutate:updateUser, loading:updating } = useMutation(
    ({id,data}) => usersApi.update(id,data),
    { successMsg:'User updated', onSuccess:()=>{ setModal(null); refetch() } }
  )

  const openAdd  = ()  => { setForm(BLANK_USER); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({...BLANK_USER,...row,password:''}); setModal('edit') }

  const handleSaveUser = async () => {
    if (!form.name||!form.email) return toast.error('Name and email are required')
    if (modal==='add' && !form.password) return toast.error('Password is required for new users')
    if (modal==='add') await createUser(form)
    else await updateUser({ id:selected.id, data:{ name:form.name, phone:form.phone, role:form.role } })
  }

  const handleToggleActive = async (user) => {
    await updateUser({ id:user.id, data:{ is_active: !user.is_active } })
    refetch()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage users, roles and system configuration</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${activeTab===t.key?'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm':'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Icon className="w-4 h-4"/>{t.label}
            </button>
          )
        })}
      </div>

      {/* ── USERS ── */}
      {activeTab==='users' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">Team Members ({users.length})</h3>
            <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4"/>Add User</Button>
          </div>
          {loading ? <Spinner/> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    {['Name','Email','Phone','Role','Status','Actions'].map(h=>(
                      <th key={h} className="table-head">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>{
                    const rm = getStatusMeta(USER_ROLES, u.role)
                    return (
                      <tr key={u.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                              {u.name[0]}
                            </div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="table-cell text-xs">{u.email}</td>
                        <td className="table-cell text-xs">{u.phone||'—'}</td>
                        <td className="table-cell"><Badge label={rm.label} color={rm.color}/></td>
                        <td className="table-cell">
                          <span className={`badge ${u.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                            {u.is_active?'Active':'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button onClick={()=>openEdit(u)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button onClick={()=>handleToggleActive(u)}
                              className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${u.is_active?'bg-red-50 text-red-600 hover:bg-red-100':'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              {u.is_active?'Disable':'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ROLES ── */}
      {activeTab==='roles' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">Role Permissions Matrix</h3>
            <p className="text-xs text-gray-400 mt-0.5">Access control per module per role</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                  <th className="table-head">Role</th>
                  {PERM_COLS.map(c=><th key={c} className="table-head capitalize">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROLE_PERMS).map(([role,perms])=>{
                  const rm = getStatusMeta(USER_ROLES,role)
                  return (
                    <tr key={role} className="table-row">
                      <td className="table-cell"><Badge label={rm.label} color={rm.color}/></td>
                      {PERM_COLS.map(col=>(
                        <td key={col} className="table-cell">
                          <span className={`badge ${PERM_COLOR[perms[col]]||'bg-gray-100 text-gray-500'}`}>{perms[col]}</span>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SOURCES ── */}
      {activeTab==='sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Lead Sources</h3>
            <div className="space-y-2">
              {LEAD_SOURCES.map(s=>(
                <div key={s.value} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</span>
                  <span className="text-xs text-green-600 font-semibold">Active</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Lead Statuses</h3>
            <div className="space-y-2">
              {LEAD_STATUSES.map(s=>(
                <div key={s.value} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <Badge label={s.label} color={s.color}/>
                  <span className="text-xs text-green-600 font-semibold">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY ── */}
      {activeTab==='company' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <Building2 className="w-4 h-4"/>Company & Project Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name"  value={company.name}     onChange={e=>cc('name',e.target.value)}/>
            <Input label="Project Name"  value={company.project}  onChange={e=>cc('project',e.target.value)}/>
            <Input label="Location"      value={company.location} onChange={e=>cc('location',e.target.value)}/>
            <Input label="Phone"         value={company.phone}    onChange={e=>cc('phone',e.target.value)}/>
            <Input label="Email"         value={company.email}    onChange={e=>cc('email',e.target.value)} type="email"/>
            <Input label="Website"       value={company.website}  onChange={e=>cc('website',e.target.value)}/>
            <Input label="RERA Number"   value={company.rera}     onChange={e=>cc('rera',e.target.value)}/>
            <Input label="GSTIN"         value={company.gstin}    onChange={e=>cc('gstin',e.target.value)}/>
          </div>
          <div className="mt-5">
            <Button onClick={()=>toast.success('Company settings saved!')}><Save className="w-4 h-4"/>Save Settings</Button>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab==='notif' && (
        <div className="card p-6 space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2"><Bell className="w-4 h-4"/>Notification Settings</h3>
          {[
            ['followup',     'Follow-up Reminders',       'Alert when follow-ups are due today'],
            ['visits',       'Site Visit Alerts',          'Alert before scheduled site visits'],
            ['payment',      'Payment Due Reminders',      'Notify when payments are due or overdue'],
            ['booking',      'Booking Confirmation',       'Send confirmation on new booking'],
            ['newLead',      'New Lead Notifications',     'Alert executive on lead assignment'],
            ['taskDue',      'Task Due Reminders',         'Daily digest of tasks due today'],
            ['weeklyReport', 'Weekly Sales Summary Email', 'Send weekly report to managers'],
            ['whatsapp',     'WhatsApp Integration',       'Automated WhatsApp messages to leads'],
            ['sms',          'SMS Gateway',                'SMS alerts for bookings and payments'],
          ].map(([key,label,desc])=>(
            <Toggle key={key} value={notifs[key]} label={label} desc={desc}
              onChange={()=>{ setNotifs(p=>({...p,[key]:!p[key]})); toast.success(`${label} ${!notifs[key]?'enabled':'disabled'}`) }}
            />
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)}
        title={modal==='add'?'Add New User':'Edit User'} size="md">
        <div className="space-y-4">
          <div className="form-grid">
            <Input label="Full Name *" value={form.name}  onChange={e=>fc('name',e.target.value)}  placeholder="Team member name"/>
            <Input label="Email *"     value={form.email} onChange={e=>fc('email',e.target.value)} type="email" placeholder="name@gvndeveloper.com"/>
            <Input label="Phone"       value={form.phone} onChange={e=>fc('phone',e.target.value)} placeholder="9876543210"/>
            <Select label="Role"       value={form.role}  onChange={e=>fc('role',e.target.value)}>
              {USER_ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            {modal==='add' && (
              <div className="col-span-2">
                <Input label="Password *" value={form.password} onChange={e=>fc('password',e.target.value)} type="password" placeholder="Min 8 characters"/>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={creating||updating}>
              {creating||updating?'Saving…':modal==='add'?'Create User':'Update User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
