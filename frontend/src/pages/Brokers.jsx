import { useState, useCallback } from 'react'
import { Plus, Edit2, Handshake, TrendingUp, Users, IndianRupee } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { brokersApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = { name:'', agency_name:'', mobile:'', email:'', rera_number:'', commission_pct:'2.0', address:'', is_active:true }

export default function Brokers() {
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: brokers, total, loading, setParams, refetch } = useList(
    useCallback(p => brokersApi.getAll(p), [])
  )

  const { mutate: create, loading: creating } = useMutation(
    d => brokersApi.create(d),
    { successMsg: 'Broker registered', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => brokersApi.update(id, data),
    { successMsg: 'Broker updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openAdd  = ()  => { setForm(BLANK); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row, commission_pct: String(row.commission_pct) }); setModal('edit') }

  const handleSave = async () => {
    if (!form.name || !form.mobile) return toast.error('Name and mobile are required')
    const payload = { ...form, commission_pct: parseFloat(form.commission_pct) || 2.0 }
    if (modal === 'add') await create(payload)
    else await update({ id: selected.id, data: payload })
  }

  const totals = {
    active:    brokers.filter(b => b.is_active).length,
    leads:     brokers.reduce((a, b) => a + Number(b.total_leads || 0), 0),
    bookings:  brokers.reduce((a, b) => a + Number(b.total_bookings || 0), 0),
  }

  const chartData = brokers.filter(b => b.is_active).map(b => ({
    name: b.name.split(' ')[0],
    leads: Number(b.total_leads || 0),
    bookings: Number(b.total_bookings || 0),
  }))

  const columns = [
    { key:'name', label:'Broker', render:(v,r)=>(
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-400">{r.agency_name}</p>
      </div>
    )},
    { key:'mobile',      label:'Mobile' },
    { key:'email',       label:'Email',      render:v=><span className="text-xs">{v||'—'}</span> },
    { key:'rera_number', label:'RERA No',    cellClass:'font-mono text-xs' },
    { key:'commission_pct', label:'Commission', render:v=><span className="font-semibold text-brand-600">{v}%</span> },
    { key:'total_leads',    label:'Leads',   render:v=><span className="font-bold">{v||0}</span> },
    { key:'total_bookings', label:'Bookings',render:v=><span className={`font-bold ${v>0?'text-green-600':'text-gray-400'}`}>{v||0}</span> },
    { key:'is_active', label:'Status', render:v=>(
      <span className={`badge ${v?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{v?'Active':'Inactive'}</span>
    )},
    { key:'id', label:'', render:(_,r)=>(
      <button onClick={()=>openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Broker Management" subtitle="RERA-registered channel partners">
        <Button onClick={openAdd}><Plus className="w-4 h-4"/>Register Broker</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Handshake}   label="Active Brokers"   value={totals.active}   accent="brand"  />
        <StatCard icon={Users}       label="Leads Referred"   value={totals.leads}    accent="blue"   />
        <StatCard icon={TrendingUp}  label="Bookings Closed"  value={totals.bookings} accent="green"  />
      </div>

      {chartData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Broker Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="leads"    fill="#1e293b" radius={[4,4,0,0]} name="Leads"/>
              <Bar dataKey="bookings" fill="#dc2626" radius={[4,4,0,0]} name="Bookings"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setParams({search:e.target.value})}} placeholder="Search broker, agency, RERA…"/>
        <span className="ml-auto text-xs text-gray-400">{brokers.length} of {total}</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={brokers} loading={loading} emptyMsg="No brokers registered yet."/>
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)}
        title={modal==='add'?'Register Broker':'Edit Broker'} size="md">
        <div className="form-grid">
          <Input label="Broker Name *"    value={form.name}           onChange={e=>f('name',e.target.value)}           placeholder="Full name"/>
          <Input label="Agency Name"      value={form.agency_name}    onChange={e=>f('agency_name',e.target.value)}    placeholder="Firm name"/>
          <Input label="Mobile *"         value={form.mobile}         onChange={e=>f('mobile',e.target.value)}         placeholder="9876543210"/>
          <Input label="Email"            value={form.email}          onChange={e=>f('email',e.target.value)}          type="email"/>
          <Input label="RERA Number"      value={form.rera_number}    onChange={e=>f('rera_number',e.target.value)}    placeholder="RERA-GJ-XXXXX"/>
          <Input label="Commission %"     value={form.commission_pct} onChange={e=>f('commission_pct',e.target.value)} type="number" step="0.25"/>
          <Input label="Address"          value={form.address}        onChange={e=>f('address',e.target.value)}        placeholder="Area, City" />
          <Select label="Status"          value={form.is_active?'active':'inactive'} onChange={e=>f('is_active',e.target.value==='active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={creating||updating}>{creating||updating?'Saving…':modal==='add'?'Register':'Update'}</Button>
        </div>
      </Modal>
    </div>
  )
}
