import { useState, useCallback } from 'react'
import { Plus, Edit2, Warehouse, CheckCircle, Lock, XCircle } from 'lucide-react'
import { inventoryApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { INVENTORY_STATUSES, PROPERTY_TYPES, WINGS, FACINGS } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = { unit_number:'', wing:'A', floor:'', property_type:'2 BHK', carpet_area:'', builtup_area:'', terrace_area:'0', facing:'East', parking:'1', base_price:'', floor_rise:'0', gst_percent:'5', stamp_duty_percent:'6', reg_charges:'30000', status:'available', notes:'' }

export default function Inventory() {
  const [statusF, setStatusF] = useState('')
  const [wingF,   setWingF]   = useState('')
  const [typeF,   setTypeF]   = useState('')
  const [modal,   setModal]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [form,    setForm]    = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: units, loading, setParams, refetch } = useList(
    useCallback(p => inventoryApi.getAll(p), [])
  )

  const { mutate: create, loading: creating } = useMutation(
    d => inventoryApi.create(d),
    { successMsg: 'Unit added', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => inventoryApi.update(id, data),
    { successMsg: 'Unit updated', onSuccess: () => { setModal(null); refetch() } }
  )

  const openAdd  = () => { setForm(BLANK); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row }); setModal('edit') }

  const handleSave = async () => {
    if (!form.unit_number || !form.base_price) return toast.error('Unit number and price required')
    if (modal === 'add') await create(form)
    else await update({ id: selected.id, data: form })
  }

  const sc = s => units.filter(u => u.status === s).length
  const filtered = units.filter(u =>
    (!statusF || u.status === statusF) &&
    (!wingF   || u.wing === wingF) &&
    (!typeF   || u.property_type === typeF)
  )

  const columns = [
    { key:'unit_number',   label:'Unit',    cellClass:'font-bold text-gray-900 dark:text-white' },
    { key:'wing',          label:'Wing' },
    { key:'floor',         label:'Floor' },
    { key:'property_type', label:'Type' },
    { key:'carpet_area',   label:'Carpet (sqft)' },
    { key:'builtup_area',  label:'Built-up (sqft)' },
    { key:'facing',        label:'Facing' },
    { key:'parking',       label:'Parking' },
    { key:'base_price',    label:'Price', render: v => <span className="font-semibold text-brand-600">{fmt.lakhs(v)}</span> },
    { key:'status',        label:'Status', render: v => { const m = getStatusMeta(INVENTORY_STATUSES, v); return <Badge label={m.label} color={m.color} /> }},
    { key:'id', label:'', render:(_, r) => (
      <button onClick={() => openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Project Inventory" subtitle="Vandan Vihar — unit availability and pricing">
        <Button onClick={openAdd}><Plus className="w-4 h-4" />Add Unit</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Available" value={sc('available')} accent="green"  sub={`of ${units.length} total`} />
        <StatCard icon={Lock}        label="Blocked"   value={sc('blocked')}   accent="orange" />
        <StatCard icon={Warehouse}   label="Booked"    value={sc('booked')}    accent="blue"   />
        <StatCard icon={XCircle}     label="Sold"      value={sc('sold')}      accent="brand"  />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(u => {
          const m = getStatusMeta(INVENTORY_STATUSES, u.status)
          return (
            <div key={u.id} className="card card-hover p-3.5 cursor-pointer" onClick={() => openEdit(u)}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-base font-black text-gray-900 dark:text-white">{u.unit_number}</p>
                <Badge label={m.label} color={m.color} />
              </div>
              <p className="text-xs text-gray-500">{u.property_type} · {u.facing}</p>
              <p className="text-xs text-gray-400">{u.carpet_area} sqft · Wing {u.wing}</p>
              <p className="text-sm font-bold text-brand-600 mt-2">{fmt.lakhs(u.base_price)}</p>
            </div>
          )
        })}
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setParams({ status: e.target.value || undefined }) }} className="input w-36">
          <option value="">All Status</option>
          {INVENTORY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={wingF} onChange={e => { setWingF(e.target.value); setParams({ wing: e.target.value || undefined }) }} className="input w-28">
          <option value="">All Wings</option>
          {WINGS.map(w => <option key={w}>{w}</option>)}
        </select>
        <select value={typeF} onChange={e => { setTypeF(e.target.value); setParams({ property_type: e.target.value || undefined }) }} className="input w-32">
          <option value="">All Types</option>
          {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} units</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Unit' : 'Edit Unit'} size="lg">
        <div className="form-grid">
          <Input label="Unit Number *"       value={form.unit_number}        onChange={e => f('unit_number', e.target.value)} placeholder="A-101" />
          <Select label="Wing"               value={form.wing}               onChange={e => f('wing', e.target.value)}>
            {WINGS.map(w => <option key={w}>{w}</option>)}
          </Select>
          <Input label="Floor"               value={form.floor}              onChange={e => f('floor', e.target.value)} type="number" />
          <Select label="Property Type"      value={form.property_type}      onChange={e => f('property_type', e.target.value)}>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Carpet Area (sqft)"  value={form.carpet_area}        onChange={e => f('carpet_area', e.target.value)} type="number" />
          <Input label="Built-up (sqft)"     value={form.builtup_area}       onChange={e => f('builtup_area', e.target.value)} type="number" />
          <Input label="Terrace (sqft)"      value={form.terrace_area}       onChange={e => f('terrace_area', e.target.value)} type="number" />
          <Select label="Facing"             value={form.facing}             onChange={e => f('facing', e.target.value)}>
            {FACINGS.map(fc => <option key={fc}>{fc}</option>)}
          </Select>
          <Input label="Parking"             value={form.parking}            onChange={e => f('parking', e.target.value)} placeholder="1" />
          <Input label="Base Price (₹) *"    value={form.base_price}         onChange={e => f('base_price', e.target.value)} type="number" />
          <Input label="GST %"               value={form.gst_percent}        onChange={e => f('gst_percent', e.target.value)} type="number" />
          <Input label="Stamp Duty %"        value={form.stamp_duty_percent} onChange={e => f('stamp_duty_percent', e.target.value)} type="number" />
          <Input label="Reg. Charges (₹)"    value={form.reg_charges}        onChange={e => f('reg_charges', e.target.value)} type="number" />
          <Select label="Status"             value={form.status}             onChange={e => f('status', e.target.value)}>
            {INVENTORY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={creating || updating}>
            {creating || updating ? 'Saving…' : modal === 'add' ? 'Add Unit' : 'Update Unit'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
