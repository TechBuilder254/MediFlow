import { useState } from 'react'
import { Settings, Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import {
  useHospitalSettings,
  useUpdateSettings,
  useManageAnnouncements,
  useCreateAnnouncement,
} from '@/services/settingsService'
import { toast } from '@/hooks/useToast'

export function SettingsPage() {
  const { profile } = useAuthStore()
  const { data: settings, isLoading } = useHospitalSettings()
  const updateSettings = useUpdateSettings()
  const { data: announcements } = useManageAnnouncements()
  const createAnnouncement = useCreateAnnouncement()
  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')

  if (isLoading || !settings) return <LoadingSpinner />

  const workingHours = (settings.working_hours as { start?: string; end?: string }) ?? {}

  return (
    <div>
      <PageHeader title="Settings" description="Hospital configuration, working hours, and announcements" />

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          try {
            await updateSettings.mutateAsync({
              id: settings.id,
              hospital_name: fd.get('hospital_name') as string,
              address: fd.get('address') as string,
              phone: fd.get('phone') as string,
              email: fd.get('email') as string,
              tax_rate: Number(fd.get('tax_rate')),
              currency: fd.get('currency') as string,
              appointment_duration_minutes: Number(fd.get('appointment_duration')),
              working_hours: {
                start: fd.get('opens') as string,
                end: fd.get('closes') as string,
              },
              theme: fd.get('theme') as string,
              language: fd.get('language') as string,
            })
            toast('Settings saved successfully.')
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Failed to save settings.', 'error')
          }
        }}
      >
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold font-display text-navy-900">Hospital Information</h3>
            </div>
            <div className="space-y-4">
              <Input label="Hospital Name" name="hospital_name" defaultValue={settings.hospital_name} />
              <Input label="Address" name="address" defaultValue={settings.address ?? ''} />
              <Input label="Phone" name="phone" defaultValue={settings.phone ?? ''} />
              <Input label="Email" name="email" defaultValue={settings.email ?? ''} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold font-display text-navy-900 mb-6">Billing & Appointments</h3>
            <div className="space-y-4">
              <Input label="Tax Rate (%)" name="tax_rate" type="number" defaultValue={settings.tax_rate} />
              <Input label="Currency" name="currency" defaultValue={settings.currency} />
              <Input label="Appointment Duration (minutes)" name="appointment_duration" type="number" defaultValue={settings.appointment_duration_minutes ?? 30} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold font-display text-navy-900 mb-6">Working Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opens" name="opens" type="time" defaultValue={workingHours.start ?? '08:00'} />
              <Input label="Closes" name="closes" type="time" defaultValue={workingHours.end ?? '17:00'} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold font-display text-navy-900 mb-6">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Theme</label>
                <select name="theme" defaultValue={settings.theme} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Language</label>
                <select name="language" defaultValue={settings.language} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" loading={updateSettings.isPending}>Save Settings</Button>
        </div>
      </form>

      <Card className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-navy-900">Hospital Announcements</h3>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!profile) return
          try {
            await createAnnouncement.mutateAsync({ title: annTitle, body: annBody, created_by: profile.id })
            setAnnTitle('')
            setAnnBody('')
            toast('Announcement posted to patient portal.')
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Failed to post announcement.', 'error')
          }
        }} className="space-y-3 mb-6">
          <Input label="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required />
          <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={2} className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm" placeholder="Announcement message for patients..." />
          <Button type="submit" size="sm" loading={createAnnouncement.isPending}>Post Announcement</Button>
        </form>
        <ul className="space-y-2">
          {announcements?.map((a) => (
            <li key={a.id} className="text-sm border-b border-navy-50 py-2">
              <p className="font-medium text-navy-900">{a.title}</p>
              <p className="text-navy-500">{a.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
