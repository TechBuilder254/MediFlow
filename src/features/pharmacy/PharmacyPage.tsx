import { useState } from 'react'
import { Pill, AlertTriangle, Package, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { usePendingPrescriptions } from '@/services/billingService'
import { useDispensePrescription, useDispensedPrescriptions } from '@/services/clinicalService'
import { useRestockMedicine } from '@/services/inventoryService'
import { toast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/utils/cn'

export function PharmacyPage() {
  const [tab, setTab] = useState<'prescriptions' | 'dispensed' | 'inventory'>('prescriptions')
  const { profile } = useAuthStore()
  const { data: prescriptions, isLoading: rxLoading } = usePendingPrescriptions()
  const { data: dispensed, isLoading: dispLoading } = useDispensedPrescriptions()
  const dispense = useDispensePrescription()
  const restock = useRestockMedicine()
  const [restockModal, setRestockModal] = useState<{ id: string; name: string } | null>(null)
  const [restockQty, setRestockQty] = useState('')

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

  const handleDispense = async (rx: {
    id: string
    medicine_id: string
    quantity?: number
    patient: { user_id?: string }
    patient_id: string
    medicine: { unit_price: number }
  }) => {
    if (!profile?.id) return
    try {
      await dispense.mutateAsync({
        prescriptionId: rx.id,
        medicineId: rx.medicine_id,
        quantity: rx.quantity ?? 1,
        pharmacistId: profile.id,
        patientUserId: (rx.patient as { user_id?: string })?.user_id,
        patientId: rx.patient_id,
        unitPrice: Number((rx.medicine as { unit_price: number })?.unit_price ?? 0),
      })
      toast('Medicine dispensed — stock updated and bill created.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Cannot dispense — check stock levels.', 'error')
    }
  }

  const handleRestock = async () => {
    if (!restockModal) return
    const qty = parseInt(restockQty, 10)
    if (!qty || qty < 1) return
    try {
      await restock.mutateAsync({
        medicine_id: restockModal.id,
        item_name: restockModal.name,
        quantity: qty,
      })
      toast(`Added ${qty} units of ${restockModal.name}`)
      setRestockModal(null)
      setRestockQty('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Restock failed.', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Pharmacy" description="Dispense prescriptions and manage medicine stock" />

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ['prescriptions', `Pending Rx (${prescriptions?.length ?? 0})`],
          ['dispensed', 'Dispensed'],
          ['inventory', 'Inventory'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'prescriptions' && (
        rxLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {!prescriptions?.length ? (
              <Card className="text-center py-8 text-navy-500">No pending prescriptions</Card>
            ) : prescriptions.map((rx) => {
              const patient = rx.patient as { first_name: string; last_name: string; patient_number: string; user_id?: string }
              const medicine = rx.medicine as { name: string; unit: string; unit_price: number }
              return (
                <Card key={rx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-navy-900">{medicine?.name}</p>
                    <p className="text-sm text-navy-600">{patient?.first_name} {patient?.last_name} · {patient?.patient_number}</p>
                    <p className="text-xs text-navy-500 mt-1">
                      {rx.dosage} · {rx.frequency} · {rx.duration} · Qty: {rx.quantity ?? 1}
                    </p>
                    {medicine?.unit_price > 0 && (
                      <p className="text-xs text-primary-600 mt-1">Bill: {formatCurrency(medicine.unit_price * (rx.quantity ?? 1))}</p>
                    )}
                  </div>
                  <Button size="sm" loading={dispense.isPending} onClick={() => handleDispense(rx as Parameters<typeof handleDispense>[0])}>
                    <Package className="h-4 w-4" /> Dispense
                  </Button>
                </Card>
              )
            })}
          </div>
        )
      )}

      {tab === 'dispensed' && (
        dispLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {!dispensed?.length ? (
              <Card className="text-center py-8 text-navy-500">No dispensed prescriptions yet</Card>
            ) : dispensed.map((rx) => {
              const patient = rx.patient as { first_name: string; last_name: string }
              const medicine = rx.medicine as { name: string }
              return (
                <Card key={rx.id} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <div>
                    <p className="font-medium text-navy-900">{medicine?.name} → {patient?.first_name} {patient?.last_name}</p>
                    <p className="text-xs text-navy-500">
                      Qty {rx.quantity ?? 1} · Dispensed {rx.dispensed_at ? formatDate(rx.dispensed_at) : '—'}
                    </p>
                  </div>
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
                    {isLow && <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Low stock</Badge>}
                  </div>
                  <h3 className="mt-3 font-semibold text-navy-900">{med.name}</h3>
                  <div className="mt-4 pt-3 border-t border-navy-50 grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-navy-400 text-xs">Remaining</p><p className="font-semibold">{stock?.quantity ?? 0} {med.unit}</p></div>
                    <div><p className="text-navy-400 text-xs">Reorder at</p><p className="font-semibold">{med.reorder_level}</p></div>
                    <div><p className="text-navy-400 text-xs">Price</p><p className="font-semibold text-primary-600">{formatCurrency(med.unit_price)}</p></div>
                    <div><p className="text-navy-400 text-xs">Expiry</p><p className="font-semibold text-xs">{stock?.expiry_date ? formatDate(stock.expiry_date) : '—'}</p></div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setRestockModal({ id: med.id, name: med.name })}>
                    Restock
                  </Button>
                </Card>
              )
            })}
          </div>
        )
      )}

      <Modal open={!!restockModal} onClose={() => setRestockModal(null)} title={`Restock ${restockModal?.name}`}>
        <div className="space-y-4">
          <Input label="Quantity to add" type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
          <Button className="w-full" loading={restock.isPending} onClick={handleRestock}>Add Stock</Button>
        </div>
      </Modal>
    </div>
  )
}
