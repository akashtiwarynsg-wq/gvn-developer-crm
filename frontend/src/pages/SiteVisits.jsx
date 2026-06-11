import { useState, useCallback } from 'react'
import { Plus, Edit2, CalendarCheck, Users, CheckCircle, XCircle } from 'lucide-react'
import { siteVisitsApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { VISIT_STATUSES } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = { customer_name:'', contact:'', visit_date:'', visit_time:'', family_count:1, pickup_required:false, pickup_location:'', assigned_to:'', status:'scheduled', remarks:'', feedback:'' }

export default function SiteVisits() {
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(null)
  const [form,     setForm]     = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: visits, total, loading, setParams, refetch } = useList(
    useCallback(p => siteVisitsApi.getAll(p), [])
  )

  const { mutate: create, loading: creating } = useMutation(
    d => siteVisitsApi.create(d),
    { successMsg: 'Visit scheduled', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => siteVisitsApi.update(id, data),
    { successMsg: 'Visit updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openAdd  = () => { setForm(BLANK); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row }); setModal('edit') }

  const handleSave = async () => {
    if (!form.customer_name || !form.visit_date) return toast.error('Customer name and visit date are required')
    if (modal === 'add') await create(form)
    else await update({ id: selected.id, data: form })
  }

  const counts = {
    scheduled:   visits.filter(v => v.status === 'scheduled').length,
    completed:   visits.filter(v => v.status === 'completed').length,
    rescheduled: visits.filter(v => v.status === 'rescheduled').length,
    cancelled:   visits.filter(v => v.status === 'cancelled').length,
  }

  const columns = [
    { key:'visit_number',    label:'ID',      cellClass:'font-mono text-xs font-bold text-brand-600' },
    { key:'customer_name',   label:'Customer', render:(v,r) => (
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-400">{r.contact}</p>
      </div>
    )},
    { key:'visit_date',      label:'Date',    render: v => fmt.date(v) },
    { key:'visit_time',      label:'Time' },
    { key:'family_count',    label:'Family' },
    { key:'pickup_required', label:'Pickup',  render: v => v ? <span className="text-xs text-green-600 font-medium">Yes</span> : <span className="text-xs text-gray-400">No</span> },
    { key:'assigned_name',   label:'Executive' },
    { key:'status',          label:'Status',  render: v => { const m = getStatusMeta(VISIT_STATUSES, v); return <Badge label={m.label} color={m.color} /> }},
    { key:'id', label:'', render:(_, r) => (
      <button onClick={() => openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Site Visit Management" subtitle={`${total} total visits`}>
        <Button onClick={openAdd}><Plus className="w-4 h-4" />Schedule Visit</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Scheduled"   value={counts.scheduled}   accent="blue"   />
        <StatCard icon={CheckCircle}   label="Completed"   value={counts.completed}   accent="green"  />
        <StatCard icon={Users}         label="Rescheduled" value={counts.rescheduled} accent="orange" />
        <StatCard icon={XCircle}       label="Cancelled"   value={counts.cancelled}   accent="brand"  />
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e => { setSearch(e.target.value); setParams({ search: e.target.value }) }} placeholder="Search customer or contact…" />
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setParams({ status: e.target.value || undefined }) }} className="input w-44">
          <option value="">All Statuses</option>
          {VISIT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{visits.length} of {total}</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={visits} loading={loading} emptyMsg="No site visits scheduled." />
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Schedule Site Visit' : 'Update Visit'} size="md">
        <div className="space-y-4">
          <div className="form-grid">
            <Input label="Customer Name *" value={form.customer_name} onChange={e => f('customer_name', e.target.value)} />
            <Input label="Contact Number"  value={form.contact}       onChange={e => f('contact', e.target.value)} placeholder="9876543210" />
            <Input label="Visit Date *"    value={form.visit_date}    onChange={e => f('visit_date', e.target.value)} type="date" />
            <Input label="Visit Time"      value={form.visit_time}    onChange={e => f('visit_time', e.target.value)} type="time" />
            <Input label="Family Members"  value={form.family_count}  onChange={e => f('family_count', e.target.value)} type="number" />
            <Select label="Pickup Required" value={form.pickup_required ? 'yes' : 'no'} onChange={e => f('pickup_required', e.target.value === 'yes')}>
              <option value="no">No</option><option value="yes">Yes</option>
            </Select>
            {form.pickup_required && (
              <Input label="Pickup Location" value={form.pickup_location} onChange={e => f('pickup_location', e.target.value)} />
            )}
            <Select label="Status" value={form.status} onChange={e => f('status', e.target.value)}>
              {VISIT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <Textarea label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} />
          {modal === 'edit' && <Textarea label="Visit Feedback" value={form.feedback} onChange={e => f('feedback', e.target.value)} placeholder="Post-visit notes…" />}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating || updating}>
              {creating || updating ? 'Saving…' : modal === 'add' ? 'Schedule' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
