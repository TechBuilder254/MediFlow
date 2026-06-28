import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt, Plus, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { useCreateInvoice, useRecordPayment } from '@/services/billingService'
import { formatCurrency } from '@/utils/cn'
import type { InvoiceStatus, PaymentMethod } from '@/types'

const statusVariant: Record<InvoiceStatus, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  draft: 'default', pending: 'warning', paid: 'success', partial: 'info', refunded: 'danger',
}

export function BillingPage() {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [payModal, setPayModal] = useState<{ id: string; total: number; paid: number; patientUserId?: string } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const { profile } = useAuthStore()
  const createInvoice = useCreateInvoice()
  const recordPayment = useRecordPayment()

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patient:patients(first_name, last_name, patient_number, user_id)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: patients } = useQuery({
    queryKey: ['patients-billing'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, first_name, last_name').is('deleted_at', null)
      return data ?? []
    },
  })

  const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) ?? 0
  const outstanding = invoices?.reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0) ?? 0

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Invoices, payments, and receipts"
        action={<Button onClick={() => setInvoiceOpen(true)}><Plus className="h-4 w-4" /> New Invoice</Button>}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white">
          <p className="text-primary-100 text-sm">Total Collected</p>
          <p className="text-3xl font-bold font-display mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white">
          <p className="text-navy-300 text-sm">Outstanding Balance</p>
          <p className="text-3xl font-bold font-display mt-1">{formatCurrency(outstanding)}</p>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : !invoices?.length ? (
        <EmptyState icon={Receipt} title="No invoices" description="Generate invoices for patient services" />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Invoice #</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Patient</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Total</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const patient = inv.patient as { first_name: string; last_name: string; user_id?: string } | null
                const balance = Number(inv.total_amount) - Number(inv.amount_paid)
                return (
                  <tr key={inv.id} className="border-b border-navy-50 hover:bg-navy-50/30">
                    <td className="px-6 py-4 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-6 py-4">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-6 py-4"><Badge variant={statusVariant[inv.status as InvoiceStatus]}>{inv.status}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      {balance > 0 && (
                        <Button size="sm" onClick={() => {
                          setPayModal({ id: inv.id, total: Number(inv.total_amount), paid: Number(inv.amount_paid), patientUserId: patient?.user_id })
                          setPayAmount(String(balance))
                        }}>
                          <CreditCard className="h-4 w-4" /> Receive Payment
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

      <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="New Invoice">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          await createInvoice.mutateAsync({
            patient_id: fd.get('patient_id') as string,
            description: fd.get('description') as string,
            amount: Number(fd.get('amount')),
          })
          setInvoiceOpen(false)
          refetch()
        }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-700">Patient</label>
            <select name="patient_id" required className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
              <option value="">Select patient</option>
              {patients?.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <Input label="Description" name="description" placeholder="Consultation fee" required />
          <Input label="Amount (KES)" name="amount" type="number" required />
          <Button type="submit" loading={createInvoice.isPending}>Create Invoice</Button>
        </form>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Receive Payment">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Balance: <strong>{formatCurrency((payModal?.total ?? 0) - (payModal?.paid ?? 0))}</strong></p>
          <Input label="Amount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-700">Payment Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mpesa">M-Pesa</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>
          <Button onClick={async () => {
            if (!payModal || !profile) return
            await recordPayment.mutateAsync({
              invoice_id: payModal.id,
              amount: Number(payAmount),
              payment_method: payMethod,
              received_by: profile.id,
              patientUserId: payModal.patientUserId,
            })
            setPayModal(null)
            refetch()
          }} loading={recordPayment.isPending}>Record Payment</Button>
        </div>
      </Modal>
    </div>
  )
}
