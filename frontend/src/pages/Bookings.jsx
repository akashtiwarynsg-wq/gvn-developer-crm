import { useState, useCallback } from 'react'
import { Plus, Edit2, Eye, ClipboardList, CheckCircle, FileText, IndianRupee } from 'lucide-react'
import { bookingsApi, inventoryApi, customersApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { BOOKING_STATUSES, PAYMENT_MODES } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = { customer_id:'', inventory_id:'', booking_date:'', booking_amount:'', payment_mode:'Cheque', agreement_status:'pending', loan_required:false, loan_bank:'', loan_amount:'', status:'confirmed', notes:'' }

export default function Bookings() {
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(null)
  const [form,     setForm]     = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: bookings, total, loading, setParams, refetch } = useList(
    useCallback(p => bookingsApi.getAll(p), [])
  )
  const { items: customers } = useList(useCallback(p => customersApi.getAll(p), []), { limit: 100 })
  const { items: availableUnits } = useList(
    useCallback(() => inventoryApi.getAll({ status: 'available', limit: 100 }), [])
  )

  const { mutate: create, loading: creating } = useMutation(
    d => bookingsApi.create(d),
    { successMsg: 'Booking created! Unit marked as booked.', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => bookingsApi.update(id, data),
    { successMsg: 'Booking updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openAdd  = () => { setForm(BLANK); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row }); setModal('edit') }
  const openView = row => { setSelected(row); setModal('view') }

  const handleSave = async () => {
    if (!form.booking_amount) return toast.error('Booking amount is required')
    if (modal === 'add' && (!form.customer_id || !form.inventory_id)) return toast.error('Customer and unit are required')
    const payload = { ...form, booking_amount: Number(form.booking_amount), loan_amount: form.loan_amount ? Number(form.loan_amount) : null }
    if (modal === 'add') await create(payload)
    else await update({ id: selected.id, data: payload })
  }

  const stats = {
    total:      total,
    confirmed:  bookings.filter(b => b.status === 'confirmed').length,
    registered: bookings.filter(b => b.status === 'registered').length,
    revenue:    bookings.reduce((a, b) => a + Number(b.booking_amount || 0), 0),
  }

  const agreeColor = { signed:'bg-green-100 text-green-700', pending:'bg-yellow-100 text-yellow-700', sent:'bg-blue-100 text-blue-700' }

  const columns = [
    { key:'booking_number', label:'Booking ID', cellClass:'font-mono text-xs font-bold text-brand-600' },
    { key:'customer_name',  label:'Customer', render:(v,r)=>(
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-400">{r.customer_mobile}</p>
      </div>
    )},
    { key:'unit_number', label:'Unit', render:(v,r)=>(
      <div>
        <p className="font-bold text-brand-600">{v}</p>
        <p className="text-xs text-gray-400">{r.property_type} · Wing {r.wing}</p>
      </div>
    )},
    { key:'booking_date',   label:'Date',      render: v => fmt.date(v) },
    { key:'booking_amount', label:'Amount',    render: v => <span className="font-semibold">{fmt.lakhs(v)}</span> },
    { key:'payment_mode',   label:'Mode' },
    { key:'agreement_status', label:'Agreement', render: v => <span className={`badge ${agreeColor[v]||'bg-gray-100 text-gray-600'}`}>{v}</span> },
    { key:'status', label:'Status', render: v => { const m=getStatusMeta(BOOKING_STATUSES,v); return <Badge label={m.label} color={m.color}/> }},
    { key:'id', label:'', render:(_,r)=>(
      <div className="flex gap-1">
        <button onClick={()=>openView(r)} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5"/></button>
        <button onClick={()=>openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Booking Management" subtitle={`${total} total bookings · Vandan Vihar`}>
        <Button onClick={openAdd}><Plus className="w-4 h-4"/>New Booking</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Bookings"  value={stats.total}                 accent="brand"  />
        <StatCard icon={CheckCircle}   label="Confirmed"       value={stats.confirmed}              accent="green"  />
        <StatCard icon={FileText}      label="Registered"      value={stats.registered}             accent="blue"   />
        <StatCard icon={IndianRupee}   label="Booking Revenue" value={fmt.lakhs(stats.revenue)}     accent="orange" />
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setParams({search:e.target.value})}} placeholder="Customer, unit, booking ID…"/>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setParams({status:e.target.value||undefined})}} className="input w-44">
          <option value="">All Statuses</option>
          {BOOKING_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{bookings.length} of {total}</span>
      </div>

      <div className="card overflow-hidden"><Table columns={columns} data={bookings} loading={loading} emptyMsg="No bookings yet."/></div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)}
        title={modal==='add'?'Create New Booking':'Edit Booking'} size="lg">
        <div className="space-y-5">
          <div>
            <p className="section-title">Customer & Unit</p>
            <div className="form-grid">
              {modal==='add' ? (
                <>
                  <Select label="Select Customer *" value={form.customer_id} onChange={e=>f('customer_id',e.target.value)}>
                    <option value="">-- Select Customer --</option>
                    {customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.mobile}</option>)}
                  </Select>
                  <Select label="Select Unit *" value={form.inventory_id} onChange={e=>f('inventory_id',e.target.value)}>
                    <option value="">-- Select Available Unit --</option>
                    {availableUnits.map(u=><option key={u.id} value={u.id}>{u.unit_number} · {u.property_type} · {fmt.lakhs(u.base_price)}</option>)}
                  </Select>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Booking locked — customer and unit cannot be changed</p>
                    <p className="font-semibold text-sm">{selected?.customer_name} · {selected?.unit_number}</p>
                  </div>
                </>
              )}
              <Input label="Booking Date *" value={form.booking_date} onChange={e=>f('booking_date',e.target.value)} type="date"/>
              <Input label="Booking Amount (₹) *" value={form.booking_amount} onChange={e=>f('booking_amount',e.target.value)} type="number"/>
            </div>
          </div>
          <div>
            <p className="section-title">Payment & Agreement</p>
            <div className="form-grid">
              <Select label="Payment Mode" value={form.payment_mode} onChange={e=>f('payment_mode',e.target.value)}>
                {PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}
              </Select>
              <Select label="Agreement Status" value={form.agreement_status} onChange={e=>f('agreement_status',e.target.value)}>
                {['pending','sent','signed'].map(v=><option key={v}>{v}</option>)}
              </Select>
              <Select label="Booking Status" value={form.status} onChange={e=>f('status',e.target.value)}>
                {BOOKING_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Select label="Loan Required" value={form.loan_required?'yes':'no'} onChange={e=>f('loan_required',e.target.value==='yes')}>
                <option value="no">No</option><option value="yes">Yes</option>
              </Select>
              {form.loan_required && <>
                <Input label="Bank Name" value={form.loan_bank} onChange={e=>f('loan_bank',e.target.value)} placeholder="SBI / HDFC"/>
                <Input label="Loan Amount (₹)" value={form.loan_amount} onChange={e=>f('loan_amount',e.target.value)} type="number"/>
              </>}
            </div>
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e=>f('notes',e.target.value)}/>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating||updating}>{creating||updating?'Saving…':modal==='add'?'Create Booking':'Update'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal==='view'} onClose={()=>setModal(null)} title="Booking Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm">
              {[
                ['Booking ID', selected.booking_number],['Status', null],
                ['Customer', selected.customer_name],['Mobile', selected.customer_mobile],
                ['Unit', selected.unit_number],['Type', `${selected.property_type} · Wing ${selected.wing}`],
                ['Date', fmt.date(selected.booking_date)],['Amount', fmt.lakhs(selected.booking_amount)],
                ['Payment Mode', selected.payment_mode],['Agreement', selected.agreement_status],
                ['Loan', selected.loan_required ? `Yes – ${selected.loan_bank}` : 'No'],
              ].map(([k,v],i) => (
                <div key={i}>
                  <p className="text-xs text-gray-400">{k}</p>
                  {k==='Status'
                    ? (() => { const m=getStatusMeta(BOOKING_STATUSES,selected.status); return <Badge label={m.label} color={m.color}/> })()
                    : <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{v||'—'}</p>
                  }
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={()=>openEdit(selected)}><Edit2 className="w-3.5 h-3.5"/>Edit</Button>
              <Button variant="secondary" size="sm" onClick={()=>setModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
