import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Phone, Mail, MapPin, AlertCircle, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { usePatient } from '@/services/patientService'
import { formatDate, getInitials } from '@/utils/cn'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading } = usePatient(id!)

  if (isLoading) return <LoadingSpinner />
  if (!patient) return <div>Patient not found</div>

  return (
    <div>
      <Link to="/patients" className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-primary-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-3xl font-bold">
              {getInitials(`${patient.first_name} ${patient.last_name}`)}
            </div>
            <h2 className="mt-4 text-xl font-bold font-display text-navy-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <Badge variant="primary" className="mt-2">{patient.patient_number}</Badge>
            <div className="mt-6 p-4 bg-white rounded-xl border border-navy-100">
              <QRCodeSVG value={patient.patient_number} size={120} />
              <p className="text-xs text-navy-400 mt-2">Patient QR Code</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-navy-900 mb-4">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <InfoItem icon={Phone} label="Phone" value={patient.phone} />
              <InfoItem icon={Mail} label="Email" value={patient.email} />
              <InfoItem icon={MapPin} label="Address" value={patient.address} />
              <InfoItem label="Date of Birth" value={patient.date_of_birth ? formatDate(patient.date_of_birth) : null} />
              <InfoItem label="Gender" value={patient.gender} />
              <InfoItem label="Blood Group" value={patient.blood_group} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-navy-900 mb-4">Emergency & Insurance</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Emergency Contact" value={patient.emergency_contact_name} />
              <InfoItem icon={Phone} label="Emergency Phone" value={patient.emergency_contact_phone} />
              <InfoItem icon={Shield} label="Insurance Provider" value={patient.insurance_provider} />
              <InfoItem label="Policy Number" value={patient.insurance_number} />
            </div>
          </Card>

          {patient.allergies && patient.allergies.length > 0 && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger" /> Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a) => (
                  <Badge key={a} variant="danger">{a}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-navy-900 mb-4">Medical Timeline</h3>
            <p className="text-sm text-navy-500">Visit history, diagnoses, prescriptions, and lab results will appear here as records are added.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-navy-400 text-xs flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </p>
      <p className="text-navy-800 font-medium mt-0.5">{value || '—'}</p>
    </div>
  )
}
