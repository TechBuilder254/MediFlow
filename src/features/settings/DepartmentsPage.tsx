import { useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useDepartmentsAdmin, useCreateDepartment } from '@/services/settingsService'

export function DepartmentsPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { data: departments, isLoading } = useDepartmentsAdmin()
  const create = useCreateDepartment()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync({ name, description: description || undefined })
    setOpen(false)
    setName('')
    setDescription('')
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage hospital departments and specialties"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Department</Button>}
      />

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map((d) => (
            <div key={d.id} className="rounded-2xl border border-navy-100 bg-white p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-900">{d.name}</h3>
              </div>
              {d.description && <p className="text-sm text-navy-500">{d.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Department">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" loading={create.isPending}>Create</Button>
        </form>
      </Modal>
    </div>
  )
}
