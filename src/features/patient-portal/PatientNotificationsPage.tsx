import { Bell } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyNotifications, useMarkNotificationRead } from '@/services/patientPortalService'
import { formatDate } from '@/utils/cn'

export function PatientNotificationsPage() {
  const { user } = useAuthStore()
  const { data: notifications, isLoading } = useMyNotifications(user?.id)
  const markRead = useMarkNotificationRead()

  const handleClick = (id: string, isRead: boolean) => {
    if (!isRead) markRead.mutate(id)
  }

  return (
    <div>
      <PageHeader title="Notifications" description="Appointment reminders, lab results, bills, and more" />
      {isLoading ? <LoadingSpinner /> : !notifications?.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You'll be notified about appointments, results, and bills" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors ${!n.is_read ? 'border-primary-200 bg-primary-50/30' : ''}`}
              onClick={() => handleClick(n.id, n.is_read)}
            >
              <div className="flex gap-3">
                <Bell className={`h-5 w-5 flex-shrink-0 ${n.is_read ? 'text-navy-400' : 'text-primary-600'}`} />
                <div>
                  <p className="font-medium text-navy-900">{n.title}</p>
                  <p className="text-sm text-navy-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-navy-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
