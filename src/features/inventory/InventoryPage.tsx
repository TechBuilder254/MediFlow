import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, Plus, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAddMedicine } from '@/services/inventoryService'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/cn'

export function InventoryPage() {
  const [addOpen, setAddOpen] = useState(false)
  const addMedicine = useAddMedicine()
  const [form, setForm] = useState({
    name: '', generic_name: '', unit: 'tablets', unit_price: '', reorder_level: '20', initial_stock: '100',
    batch_number: '', expiry_date: '', location: 'Pharmacy',
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, medicine:medicines(name, reorder_level)')
        .order('item_name')
      if (error) throw error
      return data
    },
  })

  const lowStock = items?.filter((item) => {
    const med = item.medicine as { reorder_level: number } | null
    const threshold = med?.reorder_level ?? 10
    return item.quantity <= threshold
  }) ?? []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addMedicine.mutateAsync({
        name: form.name,
        generic_name: form.generic_name || undefined,
        unit: form.unit,
        unit_price: parseFloat(form.unit_price) || 0,
        reorder_level: parseInt(form.reorder_level, 10) || 20,
        initial_stock: parseInt(form.initial_stock, 10) || 0,
        batch_number: form.batch_number || undefined,
        expiry_date: form.expiry_date || undefined,
        location: form.location,
      })
      toast(`${form.name} added — available to doctors and pharmacists.`)
      setAddOpen(false)
      setForm({ name: '', generic_name: '', unit: 'tablets', unit_price: '', reorder_level: '20', initial_stock: '100', batch_number: '', expiry_date: '', location: 'Pharmacy' })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add medicine.', 'error')
    }
  }

  const typeVariant = { medicine: 'primary' as const, equipment: 'info' as const, consumable: 'default' as const }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track equipment, medicines, and consumables"
        action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Medicine</Button>}
      />

      {lowStock.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span><strong>{lowStock.length} item(s)</strong> are at or below reorder level. Restock from Pharmacy or add new stock here.</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Item</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Type</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Quantity</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Location</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => {
                const med = item.medicine as { reorder_level: number } | null
                const isLow = item.quantity <= (med?.reorder_level ?? 10)
                return (
                  <tr key={item.id} className={`border-b border-navy-50 hover:bg-navy-50/30 ${isLow ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-navy-400" />
                        <span className="font-medium text-navy-900">{item.item_name}</span>
                        {isLow && <Badge variant="warning">Low</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={typeVariant[item.item_type as keyof typeof typeVariant] || 'default'}>
                        {item.item_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-navy-500 hidden md:table-cell">{item.location || '—'}</td>
                    <td className="px-6 py-4 text-navy-500 hidden lg:table-cell">
                      {item.expiry_date ? formatDate(item.expiry_date) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Medicine">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Medicine Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Generic Name (optional)" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit" placeholder="tablets" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
            <Input label="Unit Price (KES)" type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
            <Input label="Initial Stock" type="number" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} required />
            <Input label="Reorder Level" type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} required />
            <Input label="Batch Number" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
          <Input label="Storage Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <p className="text-xs text-navy-500">New medicines appear immediately in doctor consultations and pharmacy dispensing.</p>
          <Button type="submit" className="w-full" loading={addMedicine.isPending}>Add Medicine</Button>
        </form>
      </Modal>
    </div>
  )
}
