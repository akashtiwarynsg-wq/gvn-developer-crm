import { useState, useCallback } from 'react'
import { Plus, Edit2, CreditCard, CheckCircle, Clock, AlertTriangle, IndianRupee } from 'lucide-react'
import { paymentsApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { PAYMENT_STATUSES, PAYMENT_MODES } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const PAYMENT_TYPES = ['Booking Amount','Down Payment','Installment 1','Installment 2','Installment 3','Installment 4','Full Payment','Registration Charges','Stamp Duty','GST','Other']
const BLANK = { payment_type:'Installment 1', amount:'', due_date:'', received_date:'', payment_mode:'RTGS', reference_no:'', status:'pending', notes:'' }

export default function Payments() {
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal,   setModal]   = useState(null)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: payments, total, loading, setParams, refetch } = useList(
    useCallback(p => paymentsApi.getAll(p), [])
  )

  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => paymentsApi.update(id, data),
    { successMsg: 'Payment updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row, received_date: row.received_date || '' }); setModal('edit') }

  const markPaid = async (id) => {
    const { ok } = await update({ id, data: { status:'paid', received_date: new Date().toISOString().slice(0,10) } })
    if (ok) refetch()
  }

  const handleSave = async () => {
    if (!form.amount) return toast.error('Amount is required')
    await update({ id: selected.id, data: { ...form, amount: Number(form.amount) } })
  }

  const summary = {
    collected:    payments.filter(p=>p.status==='paid').reduce((a,p)=>a+Number(p.amount||0),0),
    pending:      payments.filter(p=>p.status==='pending').reduce((a,p)=>a+Number(p.amount||0),0),
    overdue:      payments.filter(p=>p.status==='overdue').reduce((a,p)=>a+Number(p.amount||0),0),
    pendingCount: payments.filter(p=>p.status==='pending').length,
    paidCount:    payments.filter(p=>p.status==='paid').length,
  }

  const isOverdue = p => p.status !== 'paid' && p.due_date && new Date(p.due_date) < new Date()

  const columns = [
    { key:'customer_name', label:'Customer', render:(v,r)=>(
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-400">{r.unit_number}</p>
      </div>
    )},
    { key:'payment_type',  label:'Type' },
    { key:'amount',        label:'Amount',   render: v=><span className="font-bold">{fmt.lakhs(v)}</span> },
    { key:'due_date',      label:'Due Date', render:(v,r)=>{
      const od = isOverdue(r)
      return <span className={`text-xs font-medium ${od?'text-red-500':'text-gray-500'}`}>{od&&'⚠ '}{fmt.date(v)}</span>
    }},
    { key:'received_date', label:'Received', render:v=><span className="text-xs text-gray-500">{fmt.date(v)}</span> },
    { key:'payment_mode',  label:'Mode',     render:v=><span className="text-xs">{v||'—'}</span> },
    { key:'reference_no',  label:'Ref No',   render:v=><span className="font-mono text-xs">{v||'—'}</span> },
    { key:'status', label:'Status', render:v=>{ const m=getStatusMeta(PAYMENT_STATUSES,v); return <Badge label={m.label} color={m.color}/> }},
    { key:'id', label:'', render:(_,r)=>(
      <div className="flex gap-1.5">
        {(r.status==='pending'||r.status==='overdue') && (
          <button onClick={()=>markPaid(r.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-semibold hover:bg-green-200 transition-colors">Mark Paid</button>
        )}
        <button onClick={()=>openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ]

  const overdues = payments.filter(p => isOverdue(p))

  return (
    <div className="space-y-5">
      <PageHeader title="Payment Management" subtitle="Track collections, installments and outstanding dues"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee}   label="Total Collected"   value={fmt.crores(summary.collected)}   accent="green"  />
        <StatCard icon={Clock}         label="Pending Amount"    value={fmt.lakhs(summary.pending)}      accent="orange" sub={`${summary.pendingCount} dues`}/>
        <StatCard icon={AlertTriangle} label="Overdue Amount"    value={fmt.lakhs(summary.overdue)}      accent="brand"  />
        <StatCard icon={CheckCircle}   label="Payments Received" value={summary.paidCount}               accent="blue"   />
      </div>

      {overdues.length > 0 && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20">
          <p className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4"/> Overdue Payments — Immediate Action Required ({overdues.length})
          </p>
          <div className="space-y-2">
            {overdues.map(p=>(
              <div key={p.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5 shadow-sm">
                <div>
                  <span className="font-semibold text-sm">{p.customer_name}</span>
                  <span className="text-xs text-gray-400 ml-2">· {p.unit_number} · {p.payment_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">{fmt.lakhs(p.amount)}</span>
                  <span className="text-xs text-red-400">Due {fmt.date(p.due_date)}</span>
                  <button onClick={()=>markPaid(p.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 font-semibold">Mark Paid</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setParams({search:e.target.value})}} placeholder="Search customer or unit…"/>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setParams({status:e.target.value||undefined})}} className="input w-40">
          <option value="">All Status</option>
          {PAYMENT_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{payments.length} of {total}</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={payments} loading={loading} emptyMsg="No payment records found."/>
      </div>

      <Modal open={modal==='edit'} onClose={()=>setModal(null)} title="Edit Payment Record" size="md">
        <div className="space-y-4">
          <div className="form-grid">
            <Select label="Payment Type"  value={form.payment_type}  onChange={e=>f('payment_type',e.target.value)}>
              {PAYMENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </Select>
            <Input label="Amount (₹)"     value={form.amount}        onChange={e=>f('amount',e.target.value)}        type="number"/>
            <Input label="Due Date"        value={form.due_date}      onChange={e=>f('due_date',e.target.value)}      type="date"/>
            <Input label="Received Date"   value={form.received_date} onChange={e=>f('received_date',e.target.value)} type="date"/>
            <Select label="Payment Mode"  value={form.payment_mode}  onChange={e=>f('payment_mode',e.target.value)}>
              <option value="">-- Select --</option>
              {PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}
            </Select>
            <Input label="Reference No"   value={form.reference_no}  onChange={e=>f('reference_no',e.target.value)}  placeholder="Cheque/RTGS ref"/>
            <Select label="Status"        value={form.status}        onChange={e=>f('status',e.target.value)}>
              {PAYMENT_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e=>f('notes',e.target.value)}/>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updating}>{updating?'Saving…':'Update Payment'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
