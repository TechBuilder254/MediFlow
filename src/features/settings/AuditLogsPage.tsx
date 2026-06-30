import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/cn'

export function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      if (!logs?.length) return []

      const userIds = logs.map((l) => l.user_id).filter(Boolean) as string[]
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string }[] }

      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
      return logs.map((log) => ({
        ...log,
        profile: log.user_id ? { full_name: nameMap.get(log.user_id) ?? 'System' } : null,
      }))
    },
  })

  return (
    <div>
      <PageHeader title="Audit Logs" description="Track all system actions and changes" />

      {isLoading ? (
        <LoadingSpinner />
      ) : !logs?.length ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Actions will be logged here automatically" />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const profile = log.profile as { full_name: string } | null
            const time = new Date(log.created_at)
            return (
              <div key={log.id} className="rounded-xl border border-navy-100 bg-white px-5 py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center flex-shrink-0">
                  <ScrollText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-900">
                    <span className="font-semibold">{profile?.full_name || 'System'}</span>
                    {' '}{log.action.toLowerCase()}{' '}
                    <span className="text-navy-500">{log.entity_type}</span>
                  </p>
                </div>
                <div className="text-right text-sm text-navy-500 flex-shrink-0">
                  <p>{formatDate(log.created_at)}</p>
                  <p className="text-xs">{time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
