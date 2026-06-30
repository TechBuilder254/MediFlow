import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FlaskConical, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useUpdateLabTest } from '@/services/clinicalService'
import { useAuthStore } from '@/hooks/useAuth'
import { formatDate } from '@/utils/cn'
import type { LabStatus } from '@/types'
import { toast } from '@/hooks/useToast'

const statusMap: Record<LabStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export function LaboratoryPage() {
  const [resultModal, setResultModal] = useState<{ id: string; patientUserId?: string } | null>(null)
  const [resultText, setResultText] = useState('')
  const { profile, user } = useAuthStore()
  const isLabTech = profile?.role === 'lab_technician'
  const updateLab = useUpdateLabTest()

  const { data: tests, isLoading, refetch } = useQuery({
    queryKey: ['lab-tests', user?.id, profile?.role],
    queryFn: async () => {
      let query = supabase
        .from('laboratory_tests')
        .select('*, patient:patients(first_name, last_name, patient_number, user_id), doctor:doctors(display_name)')
        .order('ordered_at', { ascending: false })

      if (isLabTech && user?.id) {
        query = query.eq('technician_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const handleStatus = async (id: string, status: LabStatus, patientUserId?: string) => {
    if (status === 'completed') {
      setResultModal({ id, patientUserId })
      return
    }
    try {
      await updateLab.mutateAsync({
        id,
        status,
        technicianId: isLabTech ? user?.id : undefined,
      })
      refetch()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed.', 'error')
    }
  }

  const submitResult = async () => {
    if (!resultModal || !resultText.trim()) return
    try {
      await updateLab.mutateAsync({
        id: resultModal.id,
        status: 'completed',
        result_summary: resultText.trim(),
        patientUserId: resultModal.patientUserId,
        technicianId: user?.id,
      })
      setResultModal(null)
      setResultText('')
      toast('Results sent to doctor and patient.')
      refetch()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save results.', 'error')
    }
  }

  const pending = tests?.filter((t) => t.status === 'pending').length ?? 0
  const inProgress = tests?.filter((t) => t.status === 'in_progress').length ?? 0

  return (
    <div>
      <PageHeader
        title="Laboratory"
        description={isLabTech ? 'Tests assigned to you by doctors — enter results here' : 'All laboratory tests'}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-700">Pending Tests</p>
          <p className="text-2xl font-bold text-amber-900">{pending}</p>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
          <p className="text-sm text-sky-700">In Progress</p>
          <p className="text-2xl font-bold text-sky-900">{inProgress}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm text-emerald-700">Completed Today</p>
          <p className="text-2xl font-bold text-emerald-900">
            {tests?.filter((t) => t.status === 'completed' && t.completed_at?.startsWith(new Date().toISOString().split('T')[0])).length ?? 0}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !tests?.length ? (
        <EmptyState icon={FlaskConical} title="No lab tests" description={isLabTech ? 'Doctors will assign tests to you during consultations' : 'Tests ordered by doctors will appear here'} />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Test</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Patient</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Doctor instructions</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const patient = test.patient as { first_name: string; last_name: string; user_id?: string } | null
                const doctor = test.doctor as { display_name?: string } | null
                return (
                  <tr key={test.id} className="border-b border-navy-50 hover:bg-navy-50/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-900">{test.test_name}</p>
                      <p className="text-xs text-navy-500">Ordered by {doctor?.display_name || 'Doctor'}</p>
                    </td>
                    <td className="px-6 py-4">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</td>
                    <td className="px-6 py-4 text-navy-600 hidden md:table-cell max-w-xs">
                      <p className="line-clamp-2">{test.notes || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusMap[test.status as LabStatus]}>{test.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {test.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatus(test.id, 'in_progress')}>Start</Button>
                      )}
                      {test.status === 'in_progress' && (
                        <Button size="sm" onClick={() => handleStatus(test.id, 'completed', patient?.user_id)}>
                          <CheckCircle className="h-4 w-4" /> Submit Results
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!resultModal} onClose={() => setResultModal(null)} title="Enter Test Results">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Results are sent to the ordering doctor and patient. You cannot edit after saving.</p>
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-navy-200 px-4 py-3 text-sm"
            placeholder="Result summary — e.g. Hemoglobin: 14.2 g/dL (Normal)"
          />
          <Button onClick={submitResult} loading={updateLab.isPending} disabled={!resultText.trim()}>Submit to Doctor & Patient</Button>
        </div>
      </Modal>
    </div>
  )
}
