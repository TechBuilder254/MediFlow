import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import type { QueueStatus } from '@/types'

const columns: { status: QueueStatus; label: string; color: string }[] = [
  { status: 'waiting', label: 'Waiting', color: 'border-amber-200 bg-amber-50' },
  { status: 'being_served', label: 'Being Served', color: 'border-primary-200 bg-primary-50' },
  { status: 'completed', label: 'Completed', color: 'border-emerald-200 bg-emerald-50' },
]

export function QueuePage() {
  const qc = useQueryClient()

  const { data: queue, isLoading } = useQuery({
    queryKey: ['queue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*, patient:patients(first_name, last_name, patient_number)')
        .gte('checked_in_at', `${today}T00:00:00`)
        .order('ticket_number')
      if (error) throw error
      return data
    },
    refetchInterval: 10000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QueueStatus }) => {
      const updates: Record<string, unknown> = { status }
      if (status === 'being_served') updates.served_at = new Date().toISOString()
      if (status === 'completed') updates.completed_at = new Date().toISOString()
      const { error } = await supabase.from('queue_entries').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Queue Management" description="Reception queue — track waiting patients in real time" />

      <div className="grid md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const items = queue?.filter((q) => q.status === col.status) ?? []
          return (
            <div key={col.status}>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-5 w-5 text-navy-500" />
                <h3 className="font-semibold text-navy-900">{col.label}</h3>
                <Badge>{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.map((entry) => {
                  const patient = entry.patient as { first_name: string; last_name: string; patient_number: string } | null
                  const waitMins = Math.floor((Date.now() - new Date(entry.checked_in_at).getTime()) / 60000)
                  return (
                    <Card key={entry.id} className={col.color}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-navy-900">#{entry.ticket_number}</p>
                          <p className="font-medium text-navy-800">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</p>
                          <p className="text-xs text-navy-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {waitMins} min waiting
                          </p>
                        </div>
                        {col.status === 'waiting' && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: entry.id, status: 'being_served' })}>
                            Serve
                          </Button>
                        )}
                        {col.status === 'being_served' && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: entry.id, status: 'completed' })}>
                            Done
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
                {items.length === 0 && (
                  <p className="text-sm text-navy-400 text-center py-8">No patients</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
