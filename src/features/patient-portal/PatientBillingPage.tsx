import { Receipt, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyInvoices } from '@/services/patientPortalService'
import { formatCurrency, formatDate } from '@/utils/cn'

export function PatientBillingPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: invoices, isLoading } = useMyInvoices(patient?.id)

  const outstanding = invoices?.filter((i) => ['pending', 'partial'].includes(i.status)) ?? []
  const paid = invoices?.filter((i) => i.status === 'paid') ?? []
  const totalDue = outstanding.reduce((s, i) => s + (i.total_amount - i.amount_paid), 0)

  return (
    <ApprovalGate>
      <PageHeader title="Billing & Payments" description="View bills, pay online, and download receipts" />

      {totalDue > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
          <p className="text-navy-300 text-sm">Total Outstanding</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalDue)}</p>
          <div className="flex gap-3 mt-4">
            <Button size="sm" className="bg-primary-500 hover:bg-primary-600">Pay with M-Pesa</Button>
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">Pay with Card</Button>
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
                  <InvoiceRow key={inv.id} inv={inv} />
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
    </ApprovalGate>
  )
}

function InvoiceRow({ inv }: { inv: { id: string; invoice_number: string; total_amount: number; amount_paid: number; status: string; created_at: string } }) {
  const due = inv.total_amount - inv.amount_paid
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-navy-400" />
        <div>
          <p className="font-mono text-sm font-medium">{inv.invoice_number}</p>
          <p className="text-xs text-navy-500">{formatDate(inv.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(due > 0 ? due : inv.total_amount)}</p>
        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge>
      </div>
    </Card>
  )
}
