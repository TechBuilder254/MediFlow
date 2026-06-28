import { Settings, Shield, Trash2, Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PatientSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Privacy, data, and account preferences" />

      <div className="space-y-4 max-w-lg">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-navy-900">Privacy</h3>
          </div>
          <p className="text-sm text-navy-600 mb-4">Control who can access your medical records</p>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded" />
            Allow assigned doctors to view my records
          </label>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Download className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-navy-900">Download My Data</h3>
          </div>
          <p className="text-sm text-navy-600 mb-4">Request a copy of all your health data</p>
          <Button variant="outline" size="sm">Request Data Export</Button>
        </Card>

        <Card className="border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="h-5 w-5 text-danger" />
            <h3 className="font-semibold text-navy-900">Delete Account</h3>
          </div>
          <p className="text-sm text-navy-600 mb-4">Request permanent deletion of your portal account</p>
          <Button variant="danger" size="sm">Request Deletion</Button>
        </Card>

        <Card>
          <Settings className="h-5 w-5 text-primary-600 mb-2" />
          <h3 className="font-semibold text-navy-900 mb-2">Support</h3>
          <p className="text-sm text-navy-600">Emergency: <strong>999</strong> · Hospital: <strong>+254 700 123 456</strong></p>
        </Card>
      </div>
    </div>
  )
}
