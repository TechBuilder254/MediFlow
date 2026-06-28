import { useQuery } from '@tanstack/react-query'
import { BedDouble } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/cn'
import type { BedStatus } from '@/types'
import { cn } from '@/utils/cn'

const bedColors: Record<BedStatus, string> = {
  available: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  occupied: 'bg-red-100 border-red-300 text-red-700',
  cleaning: 'bg-amber-100 border-amber-300 text-amber-700',
}

export function AdmissionsPage() {
  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wards').select('*').order('name')
      if (error) throw error
      return data
    },
  })

  const { data: beds } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beds')
        .select('*, room:rooms(room_number, ward_id)')
      if (error) throw error
      return data
    },
  })

  const { data: admissions } = useQuery({
    queryKey: ['admissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select('*, patient:patients(first_name, last_name), ward:wards(name)')
        .eq('status', 'admitted')
        .order('admission_date', { ascending: false })
      if (error) throw error
      return data
    },
  })

  if (wardsLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Admissions & Bed Management" description="Track patient admissions and bed availability" />

      <div className="flex gap-4 mb-8">
        {(['available', 'occupied', 'cleaning'] as BedStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 text-sm">
            <div className={cn('h-4 w-4 rounded border', bedColors[s])} />
            <span className="capitalize text-navy-600">{s}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {wards?.map((ward) => {
          const wardBeds = beds?.filter((b) => (b.room as { ward_id: string })?.ward_id === ward.id) ?? []
          return (
            <Card key={ward.id}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-display text-navy-900">{ward.name}</h3>
                <Badge variant="info">{ward.type}</Badge>
              </div>
              {wardBeds.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {wardBeds.map((bed) => (
                    <div
                      key={bed.id}
                      className={cn(
                        'rounded-xl border-2 p-3 text-center text-xs font-semibold',
                        bedColors[bed.status as BedStatus],
                      )}
                    >
                      <BedDouble className="h-4 w-4 mx-auto mb-1" />
                      {(bed.room as { room_number: string })?.room_number}-{bed.bed_number}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 py-4 text-center">No beds configured for this ward</p>
              )}
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="font-semibold text-navy-900 mb-4">Current Admissions</h3>
        {!admissions?.length ? (
          <p className="text-sm text-navy-400 py-4">No active admissions</p>
        ) : (
          <div className="space-y-3">
            {admissions.map((adm) => {
              const patient = adm.patient as { first_name: string; last_name: string } | null
              const ward = adm.ward as { name: string } | null
              return (
                <div key={adm.id} className="flex items-center justify-between py-3 border-b border-navy-50 last:border-0">
                  <div>
                    <p className="font-medium text-navy-900">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</p>
                    <p className="text-sm text-navy-500">{ward?.name} &middot; {adm.diagnosis || 'Under observation'}</p>
                  </div>
                  <p className="text-sm text-navy-500">{formatDate(adm.admission_date)}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
