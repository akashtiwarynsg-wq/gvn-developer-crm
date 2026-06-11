import { useState, useCallback } from 'react'
import { Plus, Eye, Edit2, Trash2, Phone } from 'lucide-react'
import { Users, Flame, CalendarCheck, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, usersApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { LEAD_STATUSES, LEAD_SOURCES, PROPERTY_TYPES } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar, Spinner } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'

const BLANK = {
  first_name:'', last_name:'', mobile:'', alt_mobile:'', whatsapp:'', email:'',
  occupation:'', company_name:'', annual_income:'',
  address:'', area:'', city:'', state:'Gujarat', pincode:'',
  source:'facebook', status:'new',
  budget_min:'', budget_max:'', property_type:'2 BHK',
  preferred_floor:'', preferred_facing:'', family_size:'',
  loan_required: false, assigned_to:'', remarks:'',
}

export default function Leads() {
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [sourceF,  setSourceF]  = useState('')
  const [modal,    setModal]    = useState(null)   // null|'add'|'edit'|'view'
  const [selected, setSelected] = useState(null)
  const [form,     setForm]     = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: leads, total, loading, params, setParams, refetch } = useList(
    useCallback(p => leadsApi.getAll(p), []),
    { page: 1, limit: 25 }
  )

  // Apply filters with debounce
  const applySearch = (v) => { setSearch(v); setParams({ search: v }) }
  const applyStatus = (v) => { setStatusF(v); setParams({ status: v || undefined }) }
  const applySource = (v) => { setSourceF(v); setParams({ source: v || undefined }) }

  const { mutate: createLead, loading: creating } = useMutation(
    (data) => leadsApi.create(data),
    { successMsg: 'Lead created successfully', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: updateLead, loading: updating } = useMutation(
    ({ id, data }) => leadsApi.update(id, data),
    { successMsg: 'Lead updated', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: deleteLead } = useMutation(
    (id) => leadsApi.delete(id),
    { successMsg: 'Lead deleted', onSuccess: () => refetch() }
  )

  const openAdd  = () => { setForm(BLANK); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ ...BLANK, ...row, assigned_to: row.assigned_to || '' }); setModal('edit') }
  const openView = (row) => { setSelected(row); setModal('view') }

  const handleSave = async () => {
    if (!form.first_name || !form.mobile) return toast.error('First name and mobile are required')
    const payload = { ...form, budget_min: form.budget_min || null, budget_max: form.budget_max || null, assigned_to: form.assigned_to || null }
    if (modal === 'add') await createLead(payload)
    else await updateLead({ id: selected.id, data: payload })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    await deleteLead(id)
  }

  const stats = {
    total:  total,
    hot:    leads.filter(l => l.status === 'hot').length,
    visits: leads.filter(l => l.status === 'visit_scheduled').length,
    booked: leads.filter(l => l.status === 'booked').length,
  }

  const columns = [
    { key: 'lead_number', label: 'Lead ID', cellClass: 'font-mono text-xs font-bold text-brand-600' },
    { key: 'first_name', label: 'Customer', render: (_, r) => (
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.first_name} {r.last_name}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{r.mobile}</p>
      </div>
    )},
    { key: 'source', label: 'Source', render: v => <span className="text-xs">{LEAD_SOURCES.find(s => s.value === v)?.label || v}</span> },
    { key: 'status', label: 'Status', render: v => { const m = getStatusMeta(LEAD_STATUSES, v); return <Badge label={m.label} color={m.color} /> }},
    { key: 'budget_min', label: 'Budget', render: (_, r) => <span className="text-xs">{fmt.lakhs(r.budget_min)}–{fmt.lakhs(r.budget_max)}</span> },
    { key: 'assigned_name', label: 'Executive', render: v => <span className="text-xs">{v || '—'}</span> },
    { key: 'city', label: 'City' },
    { key: 'created_at', label: 'Date', render: v => <span className="text-xs text-gray-400">{fmt.date(v)}</span> },
    { key: 'id', label: '', render: (_, r) => (
      <div className="flex gap-1">
        <button onClick={() => openView(r)} className="btn-ghost p-1.5" title="View"><Eye className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEdit(r)} className="btn-ghost p-1.5" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(r.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Lead Management" subtitle={`${total} total leads · Vandan Vihar`}>
        <Button onClick={openAdd}><Plus className="w-4 h-4" />Add Lead</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Leads"      value={total}         accent="brand"  />
        <StatCard icon={Flame}        label="Hot Leads"        value={stats.hot}     accent="orange" />
        <StatCard icon={CalendarCheck}label="Visit Scheduled"  value={stats.visits}  accent="blue"   />
        <StatCard icon={CheckCircle}  label="Bookings Done"    value={stats.booked}  accent="green"  />
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e => applySearch(e.target.value)} placeholder="Search name, mobile, ID…" />
        <select value={statusF} onChange={e => applyStatus(e.target.value)} className="input w-44">
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={sourceF} onChange={e => applySource(e.target.value)} className="input w-44">
          <option value="">All Sources</option>
          {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{leads.length} of {total} records</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={leads} loading={loading} emptyMsg="No leads found. Add your first lead." />
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Lead' : 'Edit Lead'} size="lg">
        <div className="space-y-5">
          <div>
            <p className="section-title">Personal Information</p>
            <div className="form-grid">
              <Input label="First Name *"  value={form.first_name}  onChange={e => f('first_name', e.target.value)}  placeholder="Rajesh" />
              <Input label="Last Name"     value={form.last_name}   onChange={e => f('last_name', e.target.value)}   placeholder="Sharma" />
              <Input label="Mobile *"      value={form.mobile}      onChange={e => f('mobile', e.target.value)}      placeholder="9876543210" />
              <Input label="WhatsApp"      value={form.whatsapp}    onChange={e => f('whatsapp', e.target.value)}    placeholder="9876543210" />
              <Input label="Email"         value={form.email}       onChange={e => f('email', e.target.value)}       type="email" placeholder="email@domain.com" />
              <Input label="Occupation"    value={form.occupation}  onChange={e => f('occupation', e.target.value)}  placeholder="Business / Service" />
            </div>
          </div>
          <div>
            <p className="section-title">Lead Details</p>
            <div className="form-grid">
              <Select label="Lead Source"    value={form.source}        onChange={e => f('source', e.target.value)}>
                {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Select label="Lead Status"    value={form.status}        onChange={e => f('status', e.target.value)}>
                {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Input label="Budget Min (₹)"  value={form.budget_min}    onChange={e => f('budget_min', e.target.value)}  type="number" placeholder="4000000" />
              <Input label="Budget Max (₹)"  value={form.budget_max}    onChange={e => f('budget_max', e.target.value)}  type="number" placeholder="5000000" />
              <Select label="Property Type"  value={form.property_type} onChange={e => f('property_type', e.target.value)}>
                {PROPERTY_TYPES.map(p => <option key={p}>{p}</option>)}
              </Select>
              <Select label="Loan Required"  value={form.loan_required ? 'yes' : 'no'} onChange={e => f('loan_required', e.target.value === 'yes')}>
                <option value="no">No</option><option value="yes">Yes</option>
              </Select>
            </div>
          </div>
          <div>
            <p className="section-title">Address</p>
            <div className="form-grid">
              <Input label="City"    value={form.city}    onChange={e => f('city', e.target.value)}    placeholder="Surat" />
              <Input label="Area"    value={form.area}    onChange={e => f('area', e.target.value)}    placeholder="Vesu" />
              <Input label="State"   value={form.state}   onChange={e => f('state', e.target.value)}   placeholder="Gujarat" />
              <Input label="Pincode" value={form.pincode} onChange={e => f('pincode', e.target.value)} placeholder="395007" />
            </div>
          </div>
          <Textarea label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Additional notes…" />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating || updating}>
              {creating || updating ? 'Saving…' : modal === 'add' ? 'Save Lead' : 'Update Lead'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Lead Details" size="md">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-700 font-black text-lg">
                {selected.first_name?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base">{selected.first_name} {selected.last_name}</p>
                <p className="text-gray-500 text-xs">Lead #{selected.lead_number}</p>
              </div>
              <div className="ml-auto">
                {(() => { const m = getStatusMeta(LEAD_STATUSES, selected.status); return <Badge label={m.label} color={m.color} /> })()}
              </div>
            </div>
            {[
              ['Mobile', selected.mobile], ['Email', selected.email],
              ['Source', LEAD_SOURCES.find(s => s.value === selected.source)?.label],
              ['Budget', `${fmt.lakhs(selected.budget_min)} – ${fmt.lakhs(selected.budget_max)}`],
              ['City / Area', `${selected.city || '—'}${selected.area ? ` · ${selected.area}` : ''}`],
              ['Executive', selected.assigned_name],
              ['Added', fmt.date(selected.created_at)],
            ].map(([k, v]) => v && (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50 dark:border-slate-800">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
            {selected.remarks && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg text-xs text-gray-500">{selected.remarks}</div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="secondary" size="sm" onClick={() => openEdit(selected)}><Edit2 className="w-3.5 h-3.5" />Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
