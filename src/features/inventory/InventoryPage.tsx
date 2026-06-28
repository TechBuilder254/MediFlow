import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/cn'

export function InventoryPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name')
      if (error) throw error
      return data
    },
  })

  const typeVariant = { medicine: 'primary' as const, equipment: 'info' as const, consumable: 'default' as const }

  return (
    <div>
      <PageHeader title="Inventory" description="Track equipment, medicines, and consumables" />

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
              {items?.map((item) => (
                <tr key={item.id} className="border-b border-navy-50 hover:bg-navy-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-navy-400" />
                      <span className="font-medium text-navy-900">{item.item_name}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
