import { useState } from 'react'
import { Plus, Building2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useDepartmentsAdmin, useCreateDepartment, useUpdateDepartment } from '@/services/settingsService'
import { toast } from '@/hooks/useToast'

type DeptRow = { id: string; name: string; description?: string | null }

export function DepartmentsPage() {
  const [open, setOpen] = useState(false)
  const [editDept, setEditDept] = useState<DeptRow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { data: departments, isLoading, isError, refetch } = useDepartmentsAdmin()
  const create = useCreateDepartment()
  const update = useUpdateDepartment()

  const openCreate = () => {
    setEditDept(null)
    setName('')
    setDescription('')
    setOpen(true)
  }

  const openEdit = (d: DeptRow) => {
    setEditDept(d)
    setName(d.name)
    setDescription(d.description ?? '')
    setOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editDept) {
        await update.mutateAsync({ id: editDept.id, name, description: description || undefined })
        toast('Department updated.')
      } else {
        await create.mutateAsync({ name, description: description || undefined })
        toast('Department created.')
      }
      setOpen(false)
      setName('')
      setDescription('')
      setEditDept(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save department.', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage hospital departments — used in doctor profiles and appointment booking"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Department</Button>}
      />

      {isLoading ? <LoadingSpinner /> : isError ? (
        <EmptyState icon={Building2} title="Could not load departments" description="Check your connection and try again" action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !departments?.length ? (
        <EmptyState icon={Building2} title="No departments" description="Add departments like Dental, Cardiology, Pediatrics" action={<Button onClick={openCreate}>Add Department</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openEdit(d)}
              className="rounded-2xl border border-navy-100 bg-white p-5 text-left hover:border-primary-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-navy-900">{d.name}</h3>
                </div>
                <Pencil className="h-4 w-4 text-navy-300 group-hover:text-primary-600" />
              </div>
              {d.description ? <p className="text-sm text-navy-500">{d.description}</p> : <p className="text-sm text-navy-400 italic">No description</p>}
            </button>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editDept ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Cardiology" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description for patients" />
          <Button type="submit" loading={create.isPending || update.isPending} className="w-full">
            {editDept ? 'Save Changes' : 'Create Department'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
