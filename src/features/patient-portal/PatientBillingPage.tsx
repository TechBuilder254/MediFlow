import { useState } from 'react'
import { Receipt, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyInvoices } from '@/services/patientPortalService'
import { usePatientPayInvoice } from '@/services/billingService'
import { toast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/cn'
import type { PaymentMethod } from '@/types'

export function PatientBillingPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: invoices, isLoading } = useMyInvoices(patient?.id)
  const payInvoice = usePatientPayInvoice()
  const [payModal, setPayModal] = useState<{ id: string; due: number } | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('mpesa')
  const [phone, setPhone] = useState('')

  const outstanding = invoices?.filter((i) => ['pending', 'partial'].includes(i.status)) ?? []
  const paid = invoices?.filter((i) => i.status === 'paid') ?? []
  const totalDue = outstanding.reduce((s, i) => s + (i.total_amount - i.amount_paid), 0)

  const handlePay = async () => {
    if (!payModal || !user?.id) return
    try {
      await payInvoice.mutateAsync({
        invoice_id: payModal.id,
        amount: payModal.due,
        payment_method: payMethod,
        reference_number: payMethod === 'mpesa' ? `MPESA-${phone || 'STK'}` : `CARD-${Date.now()}`,
        userId: user.id,
      })
      toast('Payment successful — your bill has been paid.')
      setPayModal(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Payment failed. Please try again.', 'error')
    }
  }

  return (
    <ApprovalGate>
      <PageHeader title="Billing & Payments" description="View bills, pay online, and download receipts" />

      {totalDue > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
          <p className="text-navy-300 text-sm">Total Outstanding</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalDue)}</p>
          <div className="flex gap-3 mt-4">
            <Button
              size="sm"
              className="bg-primary-500 hover:bg-primary-600"
              onClick={() => {
                const first = outstanding[0]
                if (first) setPayModal({ id: first.id, due: first.total_amount - first.amount_paid })
                setPayMethod('mpesa')
              }}
            >
              Pay with M-Pesa
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                const first = outstanding[0]
                if (first) setPayModal({ id: first.id, due: first.total_amount - first.amount_paid })
                setPayMethod('card')
              }}
            >
              Pay with Card
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? <LoadingSpinner /> : !invoices?.length ? (
        <EmptyState icon={Receipt} title="No bills" description="Invoices from your visits will appear here" />
      ) : (
        <div className="space-y-6">
          {outstanding.length > 0 && (
            <section>
              <h3 className="font-semibold text-navy-900 mb-3">Outstanding Bills</h3>
              <div className="space-y-3">
                {outstanding.map((inv) => (
                  <InvoiceRow
                    key={inv.id}
                    inv={inv}
                    onPay={() => setPayModal({ id: inv.id, due: inv.total_amount - inv.amount_paid })}
                  />
                ))}
              </div>
            </section>
          )}
          {paid.length > 0 && (
            <section>
              <h3 className="font-semibold text-navy-900 mb-3">Paid Bills</h3>
              <div className="space-y-3">
                {paid.map((inv) => (
                  <InvoiceRow key={inv.id} inv={inv} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pay ${payModal ? formatCurrency(payModal.due) : ''}`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPayMethod('mpesa')}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium ${payMethod === 'mpesa' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-navy-200'}`}
            >
              M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setPayMethod('card')}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium ${payMethod === 'card' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-navy-200'}`}
            >
              Card
            </button>
          </div>
          {payMethod === 'mpesa' && (
            <Input label="M-Pesa Phone Number" placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}
          <p className="text-xs text-navy-500">
            {payMethod === 'mpesa'
              ? 'You will receive an STK push on your phone to complete payment.'
              : 'Enter your card details on the secure payment page.'}
          </p>
          <Button className="w-full" loading={payInvoice.isPending} onClick={handlePay}>
            Confirm Payment
          </Button>
        </div>
      </Modal>
    </ApprovalGate>
  )
}

function InvoiceRow({ inv, onPay }: { inv: { id: string; invoice_number: string; total_amount: number; amount_paid: number; status: string; created_at: string }; onPay?: () => void }) {
  const due = inv.total_amount - inv.amount_paid
  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-navy-400" />
        <div>
          <p className="font-mono text-sm font-medium">{inv.invoice_number}</p>
          <p className="text-xs text-navy-500">{formatDate(inv.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(due > 0 ? due : inv.total_amount)}</p>
          <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge>
        </div>
        {onPay && due > 0 && (
          <Button size="sm" onClick={onPay}>Pay</Button>
        )}
      </div>
    </Card>
  )
}
