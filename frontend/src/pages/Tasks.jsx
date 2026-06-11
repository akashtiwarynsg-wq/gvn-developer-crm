import { useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, CheckSquare, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { tasksApi, usersApi } from '@/lib/api'
import { useList, useMutation } from '@/hooks/useApi'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'
import { getStatusMeta, fmt } from '@/lib/utils'
import { PageHeader, SearchBar } from '@/components/ui/Misc'
import Table    from '@/components/ui/Table'
import Badge    from '@/components/ui/Badge'
import Button   from '@/components/ui/Button'
import Modal    from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import Input, { Select, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const BLANK = { title:'', description:'', priority:'medium', assigned_to:'', due_date:'', status:'pending' }

export default function Tasks() {
  const [search,    setSearch]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [priorityF, setPriorityF] = useState('')
  const [modal,     setModal]     = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [form,      setForm]      = useState(BLANK)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { items: tasks, total, loading, setParams, refetch } = useList(
    useCallback(p => tasksApi.getAll(p), [])
  )
  const { items: users } = useList(useCallback(() => usersApi.getAll(), []), { limit: 20 })

  const { mutate: create, loading: creating } = useMutation(
    d => tasksApi.create(d),
    { successMsg: 'Task created', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: update, loading: updating } = useMutation(
    ({ id, data }) => tasksApi.update(id, data),
    { successMsg: 'Task updated', onSuccess: () => { setModal(null); refetch() } }
  )
  const { mutate: remove } = useMutation(
    id => tasksApi.delete(id),
    { successMsg: 'Task deleted', onSuccess: () => refetch() }
  )

  const openAdd  = ()  => { setForm(BLANK); setModal('add') }
  const openEdit = row => { setSelected(row); setForm({ ...BLANK, ...row, assigned_to: row.assigned_to || '' }); setModal('edit') }

  const handleSave = async () => {
    if (!form.title) return toast.error('Task title is required')
    const payload = { ...form, assigned_to: form.assigned_to || null }
    if (modal === 'add') await create(payload)
    else await update({ id: selected.id, data: payload })
  }

  const handleDelete = async id => {
    if (!confirm('Delete this task?')) return
    await remove(id)
  }

  const toggleComplete = async (row) => {
    const next = row.status === 'completed' ? 'pending' : 'completed'
    const { ok } = await update({ id: row.id, data: { status: next } })
    if (ok) refetch()
  }

  const counts = {
    pending:    tasks.filter(t=>t.status==='pending').length,
    inProgress: tasks.filter(t=>t.status==='in_progress').length,
    completed:  tasks.filter(t=>t.status==='completed').length,
    overdue:    tasks.filter(t=>t.status!=='completed'&&t.due_date&&new Date(t.due_date)<new Date()).length,
  }

  const isOverdue = t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()

  const columns = [
    { key:'status', label:'', render:(v,r)=>(
      <button onClick={()=>toggleComplete(r)} title={v==='completed'?'Reopen':'Complete'}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${v==='completed'?'bg-green-500 border-green-500':'border-gray-300 hover:border-green-400'}`}>
        {v==='completed'&&<CheckCircle className="w-3 h-3 text-white"/>}
      </button>
    )},
    { key:'title', label:'Task', render:(v,r)=>(
      <div className="max-w-xs">
        <p className={`font-semibold text-sm ${r.status==='completed'?'line-through text-gray-400':'text-gray-900 dark:text-white'}`}>{v}</p>
        {r.description&&<p className="text-xs text-gray-400 truncate mt-0.5">{r.description}</p>}
      </div>
    )},
    { key:'priority',      label:'Priority', render:v=>{ const m=getStatusMeta(TASK_PRIORITIES,v); return <Badge label={m.label} color={m.color}/> }},
    { key:'assigned_name', label:'Assigned To', render:v=><span className="text-sm">{v||'—'}</span> },
    { key:'due_date', label:'Due Date', render:(v,r)=>{
      const od=isOverdue(r)
      return <span className={`text-xs font-medium ${od?'text-red-500':'text-gray-500'}`}>{od&&'⚠ '}{fmt.date(v)}</span>
    }},
    { key:'status', label:'Status', render:v=>{ const m=getStatusMeta(TASK_STATUSES,v); return <Badge label={m.label} color={m.color}/> }},
    { key:'id', label:'', render:(_,r)=>(
      <div className="flex gap-1">
        <button onClick={()=>openEdit(r)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={()=>handleDelete(r.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Task Management" subtitle={`${total} total tasks`}>
        <Button onClick={openAdd}><Plus className="w-4 h-4"/>New Task</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock}         label="Pending"     value={counts.pending}    accent="orange" />
        <StatCard icon={CheckSquare}   label="In Progress" value={counts.inProgress} accent="blue"   />
        <StatCard icon={CheckCircle}   label="Completed"   value={counts.completed}  accent="green"  />
        <StatCard icon={AlertTriangle} label="Overdue"     value={counts.overdue}    accent="brand"  />
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setParams({search:e.target.value})}} placeholder="Search task or assignee…"/>
        <select value={statusF}   onChange={e=>{setStatusF(e.target.value);setParams({status:e.target.value||undefined})}}   className="input w-40">
          <option value="">All Status</option>
          {TASK_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={priorityF} onChange={e=>{setPriorityF(e.target.value);setParams({priority:e.target.value||undefined})}} className="input w-36">
          <option value="">All Priority</option>
          {TASK_PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{tasks.length} of {total}</span>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={tasks} loading={loading} emptyMsg="No tasks. Create your first task."/>
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)}
        title={modal==='add'?'Create Task':'Edit Task'} size="md">
        <div className="space-y-4">
          <Input label="Task Title *" value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Clear, actionable description"/>
          <Textarea label="Description" value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Additional details…"/>
          <div className="form-grid">
            <Select label="Priority" value={form.priority} onChange={e=>f('priority',e.target.value)}>
              {TASK_PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
            <Select label="Assigned To" value={form.assigned_to} onChange={e=>f('assigned_to',e.target.value)}>
              <option value="">-- Unassigned --</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role.replace('_',' ')})</option>)}
            </Select>
            <Input label="Due Date" value={form.due_date} onChange={e=>f('due_date',e.target.value)} type="date"/>
            <Select label="Status" value={form.status} onChange={e=>f('status',e.target.value)}>
              {TASK_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating||updating}>{creating||updating?'Saving…':modal==='add'?'Create Task':'Update'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
