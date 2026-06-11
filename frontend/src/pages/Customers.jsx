import { useState, useCallback } from 'react'
import { Plus, Edit2, Eye, UserCheck, Phone, Mail, FileText, Home } from 'lucide-react'
import { customersApi } from '@/lib/api'
import { useList, useOne, useMutation } from '@/hooks/useApi'
import { fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = {
  name:'', email:'', mobile:'', pan_number:'', aadhaar:'', occupation:'',
  address:'', city:'', state:'Gujarat', pincode:'',
  nominee_name:'', nominee_rel:'', nominee_mobile:'',
  emergency_name:'', emergency_phone:'',
}

const TYPE_COLOR = { booking:'bg-blue-500', payment:'bg-green-500', document:'bg-purple-500', agreement:'bg-orange-500', loan:'bg-yellow-500', registration:'bg-teal-500', possession:'bg-brand-500' }
const TABS = ['profile', 'kyc', 'documents', 'timeline']

function CustomerDetail({ id, onEdit, onClose }) {
  const { data: customer, loading } = useOne(useCallback(i => customersApi.getOne(i), []), id)
  const [tab, setTab] = useState('profile')

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
  if (!customer) return null

  const statusColor = { confirmed:'bg-green-100 text-green-700', registered:'bg-blue-100 text-blue-700', cancelled:'bg-red-100 text-red-700' }

  const timeline = customer.payments?.map(p => ({
    date: p.created_at, type:'payment',
    event: p.payment_type, detail: `${fmt.lakhs(p.amount)} · ${p.status}`
  })) || []

  return (
    <div>
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">
        <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-700 font-black text-xl flex-shrink-0">{customer.name[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{customer.name}</p>
          <p className="text-sm text-gray-500 flex flex-wrap gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{customer.mobile}</span>
            {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{customer.email}</span>}
          </p>
        </div>
        {customer.unit_number && (
          <div className="text-right flex-shrink-0">
            <p className="font-black text-brand-600 text-lg">{customer.unit_number}</p>
            <span className={`badge text-[11px] ${statusColor[customer.booking_status]||''}`}>{customer.booking_status}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-slate-900 p-1 rounded-lg">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${tab===t?'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==='profile' && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Customer ID',`CUS-${String(customer.customer_number).padStart(3,'0')}`],['Occupation',customer.occupation],
            ['City',customer.city],['State',customer.state],
            ['Booking ID',customer.booking_number?`BK-${String(customer.booking_number).padStart(3,'0')}`:'—'],
            ['Nominee',customer.nominee_name?`${customer.nominee_name} (${customer.nominee_rel})`:'—'],
            ['Emergency Contact',customer.emergency_name||'—'],['Since',fmt.date(customer.created_at)]
          ].map(([k,v])=>(
            <div key={k} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{v||'—'}</p>
            </div>
          ))}
        </div>
      )}

      {tab==='kyc' && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['PAN Number',customer.pan_number],['Aadhaar',customer.aadhaar],
            ['Email',customer.email],['Mobile',customer.mobile]
          ].map(([k,v])=>(
            <div key={k} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
              <p className="font-mono font-semibold text-gray-800 dark:text-gray-200">{v||'Not provided'}</p>
            </div>
          ))}
        </div>
      )}

      {tab==='documents' && (
        <div className="space-y-2">
          {['Aadhaar Card','PAN Card','Passport Photo','Bank Statement','Salary Slip','Agreement Copy'].map((doc,i)=>(
            <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${i<2?'text-green-500':'text-gray-300'}`}/>
                <span className="text-sm font-medium">{doc}</span>
              </div>
              {i<2
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Uploaded</span>
                : <button className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 px-2 py-0.5 rounded-full hover:bg-brand-50 hover:text-brand-700 transition-colors">Upload</button>
              }
            </div>
          ))}
        </div>
      )}

      {tab==='timeline' && (
        <div className="relative pl-5 space-y-3">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700"/>
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No timeline events yet</p>
          ) : timeline.map((t,i)=>(
            <div key={i} className="relative flex gap-3">
              <div className={`absolute -left-3 w-3 h-3 rounded-full ${TYPE_COLOR[t.type]||'bg-gray-400'} mt-1`}/>
              <div className="flex-1 bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-sm">{t.event}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmt.date(t.date)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
        <Button variant="secondary" size="sm" onClick={onEdit}><Edit2 className="w-3.5 h-3.5"/>Edit</Button>
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export default function Customers() {
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(null)
  const [form,     setForm]     = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: customers, total, loading, setParams, refetch } = useList(
    useCallback(p => customersApi.getAll(p), [])
  )

  const { mutate: create, loading: creating } = useMutation(
    d => customersApi.create(d),
    { successMsg: 'Customer profile created', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => customersApi.update(id, data),
    { successMsg: 'Customer updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openView = row => { setSelected(row); setModal('view') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row }); setModal('edit') }
  const openAdd  = ()  => { setForm(BLANK); setModal('add') }

  const handleSave = async () => {
    if (!form.name || !form.mobile) return toast.error('Name and mobile are required')
    if (modal === 'add') await create(form)
    else await update({ id: selected.id, data: form })
  }

  const statusColor = { confirmed:'bg-green-100 text-green-700', registered:'bg-blue-100 text-blue-700' }

  const columns = [
    { key:'customer_number', label:'ID', render:v=><span className="font-mono text-xs font-bold text-brand-600">CUS-{String(v).padStart(3,'0')}</span> },
    { key:'name', label:'Customer', render:(v,r)=>(
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/>{r.mobile}</p>
      </div>
    )},
    { key:'email',       label:'Email',   render:v=><span className="text-xs">{v||'—'}</span> },
    { key:'pan_number',  label:'PAN',     cellClass:'font-mono text-xs' },
    { key:'unit_number', label:'Unit',    render:(v,r)=>v?(
      <div>
        <p className="font-bold text-brand-600">{v}</p>
        <span className={`badge text-[10px] ${statusColor[r.booking_status]||'bg-gray-100 text-gray-600'}`}>{r.booking_status}</span>
      </div>
    ):'—'},
    { key:'city',       label:'City' },
    { key:'created_at', label:'Since', render:v=><span className="text-xs text-gray-400">{fmt.date(v)}</span> },
    { key:'id', label:'', render:(_,r)=>(
      <div className="flex gap-1">
        <button onClick={()=>openView(r)} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5"/></button>
        <button onClick={()=>openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Customer Management" subtitle={`${total} customer profiles`}>
        <Button onClick={openAdd}><Plus className="w-4 h-4"/>Add Customer</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Total Customers" value={total}                                                                accent="brand" />
        <StatCard icon={Home}      label="Units Booked"    value={customers.filter(c=>c.booking_status==='confirmed').length}           accent="green" />
        <StatCard icon={FileText}  label="Registered"      value={customers.filter(c=>c.booking_status==='registered').length}          accent="blue"  />
        <StatCard icon={UserCheck} label="KYC Pending"     value={customers.filter(c=>!c.pan_number||!c.aadhaar).length}               accent="orange"/>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setParams({search:e.target.value})}} placeholder="Name, mobile, PAN, unit…"/>
        <span className="ml-auto text-xs text-gray-400">{customers.length} of {total}</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={customers} loading={loading} emptyMsg="No customers yet."/>
      </div>

      {/* View Detail Modal */}
      <Modal open={modal==='view'} onClose={()=>setModal(null)} title="Customer Profile" size="lg">
        {selected && (
          <CustomerDetail id={selected.id}
            onEdit={() => openEdit(selected)}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)}
        title={modal==='add'?'Add Customer':'Edit Customer'} size="lg">
        <div className="space-y-5">
          <div>
            <p className="section-title">Basic Information</p>
            <div className="form-grid">
              <Input label="Full Name *"    value={form.name}       onChange={e=>f('name',e.target.value)}       placeholder="Rajesh Sharma"/>
              <Input label="Mobile *"       value={form.mobile}     onChange={e=>f('mobile',e.target.value)}     placeholder="9876543210"/>
              <Input label="Email"          value={form.email}      onChange={e=>f('email',e.target.value)}      type="email"/>
              <Input label="Occupation"     value={form.occupation} onChange={e=>f('occupation',e.target.value)} placeholder="Business / IT"/>
              <Input label="City"           value={form.city}       onChange={e=>f('city',e.target.value)}/>
              <Input label="State"          value={form.state}      onChange={e=>f('state',e.target.value)}/>
            </div>
          </div>
          <div>
            <p className="section-title">KYC Details</p>
            <div className="form-grid">
              <Input label="PAN Number"     value={form.pan_number} onChange={e=>f('pan_number',e.target.value.toUpperCase())} placeholder="ABCDE1234F"/>
              <Input label="Aadhaar Number" value={form.aadhaar}    onChange={e=>f('aadhaar',e.target.value)}    placeholder="XXXX-XXXX-XXXX"/>
            </div>
          </div>
          <div>
            <p className="section-title">Nominee</p>
            <div className="form-grid">
              <Input label="Nominee Name"   value={form.nominee_name}   onChange={e=>f('nominee_name',e.target.value)}/>
              <Input label="Relationship"   value={form.nominee_rel}    onChange={e=>f('nominee_rel',e.target.value)}   placeholder="Spouse / Child"/>
              <Input label="Nominee Mobile" value={form.nominee_mobile} onChange={e=>f('nominee_mobile',e.target.value)}/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating||updating}>{creating||updating?'Saving…':modal==='add'?'Create Profile':'Update'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
