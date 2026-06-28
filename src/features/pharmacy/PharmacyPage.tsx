import { useState } from 'react'
import { Pill, AlertTriangle, Package } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePendingPrescriptions } from '@/services/billingService'
import { useDispensePrescription } from '@/services/clinicalService'
import { formatCurrency } from '@/utils/cn'

export function PharmacyPage() {
  const [tab, setTab] = useState<'prescriptions' | 'inventory'>('prescriptions')
  const { data: prescriptions, isLoading: rxLoading } = usePendingPrescriptions()
  const dispense = useDispensePrescription()

  const { data: medicines, isLoading: medLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*, inventory(quantity, expiry_date, batch_number)')
        .order('name')
      if (error) throw error
      return data
    },
    enabled: tab === 'inventory',
  })

  return (
    <div>
      <PageHeader title="Pharmacy" description="Dispense prescriptions and manage medicine stock" />

      <div className="flex gap-2 mb-6">
        {(['prescriptions', 'inventory'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200'}`}
          >
            {t === 'prescriptions' ? `Pending Rx (${prescriptions?.length ?? 0})` : 'Inventory'}
          </button>
        ))}
      </div>

      {tab === 'prescriptions' && (
        rxLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {!prescriptions?.length ? (
              <Card className="text-center py-8 text-navy-500">No pending prescriptions</Card>
            ) : prescriptions.map((rx) => {
              const patient = rx.patient as { first_name: string; last_name: string; patient_number: string }
              const medicine = rx.medicine as { name: string; unit: string }
              return (
                <Card key={rx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-navy-900">{medicine?.name}</p>
                    <p className="text-sm text-navy-600">{patient?.first_name} {patient?.last_name} · {patient?.patient_number}</p>
                    <p className="text-xs text-navy-500 mt-1">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                  </div>
                  <Button size="sm" loading={dispense.isPending} onClick={() => dispense.mutate({ prescriptionId: rx.id, medicineId: rx.medicine_id })}>
                    <Package className="h-4 w-4" /> Dispense
                  </Button>
                </Card>
              )
            })}
          </div>
        )
      )}

      {tab === 'inventory' && (
        medLoading ? <LoadingSpinner /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines?.map((med) => {
              const stock = (med.inventory as { quantity: number; expiry_date: string }[])?.[0]
              const isLow = stock && stock.quantity <= med.reorder_level
              return (
                <Card key={med.id} hover className={isLow ? 'border-amber-200' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Pill className="h-5 w-5" />
                    </div>
                    {isLow && <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Low</Badge>}
                  </div>
                  <h3 className="mt-3 font-semibold text-navy-900">{med.name}</h3>
                  <div className="mt-4 pt-3 border-t border-navy-50 grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-navy-400 text-xs">Stock</p><p className="font-semibold">{stock?.quantity ?? 0}</p></div>
                    <div><p className="text-navy-400 text-xs">Price</p><p className="font-semibold text-primary-600">{formatCurrency(med.unit_price)}</p></div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
