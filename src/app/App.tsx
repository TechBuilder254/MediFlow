import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/features/auth/useAuthInit'
import { ProtectedRoute, PublicRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PatientLayout } from '@/components/layouts/PatientLayout'
import { PatientRouteGuard } from '@/features/patient-portal/components/ApprovalGate'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { DoctorsPage } from '@/features/doctors/DoctorsPage'
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage'
import { QueuePage } from '@/features/appointments/QueuePage'
import { AdmissionsPage } from '@/features/admissions/AdmissionsPage'
import { LaboratoryPage } from '@/features/laboratory/LaboratoryPage'
import { DoctorLabResultsPage } from '@/features/laboratory/DoctorLabResultsPage'
import { PharmacyPage } from '@/features/pharmacy/PharmacyPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { BillingPage } from '@/features/billing/BillingPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { UsersPage } from '@/features/settings/UsersPage'
import { AuditLogsPage } from '@/features/settings/AuditLogsPage'
import { DepartmentsPage } from '@/features/settings/DepartmentsPage'
import { ReceptionPage } from '@/features/reception/ReceptionPage'
import { ConsultationPage } from '@/features/consultation/ConsultationPage'
import { NurseAssessmentPage } from '@/features/nurse/NurseAssessmentPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PatientDashboardPage } from '@/features/patient-portal/PatientDashboardPage'
import { ProfileCompletionPage } from '@/features/patient-portal/ProfileCompletionPage'
import { BookAppointmentPage } from '@/features/patient-portal/BookAppointmentPage'
import { PatientProfilePage } from '@/features/patient-portal/PatientProfilePage'
import { PatientAppointmentsPage } from '@/features/patient-portal/PatientAppointmentsPage'
import { PatientQueuePage } from '@/features/patient-portal/PatientQueuePage'
import { PatientMedicalRecordsPage } from '@/features/patient-portal/PatientMedicalRecordsPage'
import { PatientPrescriptionsPage } from '@/features/patient-portal/PatientPrescriptionsPage'
import { PatientLabPage } from '@/features/patient-portal/PatientLabPage'
import { PatientBillingPage } from '@/features/patient-portal/PatientBillingPage'
import { PatientInsurancePage } from '@/features/patient-portal/PatientInsurancePage'
import { PatientFamilyPage } from '@/features/patient-portal/PatientFamilyPage'
import { PatientHealthTrackerPage } from '@/features/patient-portal/PatientHealthTrackerPage'
import { PatientTimelinePage } from '@/features/patient-portal/PatientTimelinePage'
import { PatientNotificationsPage } from '@/features/patient-portal/PatientNotificationsPage'
import { PatientMessagesPage } from '@/features/patient-portal/PatientMessagesPage'
import { PatientDocumentsPage } from '@/features/patient-portal/PatientDocumentsPage'
import { PatientFeedbackPage } from '@/features/patient-portal/PatientFeedbackPage'
import { PatientSettingsPage } from '@/features/patient-portal/PatientSettingsPage'

export default function App() {
  useAuthInit()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Staff portal */}
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute route="/dashboard" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<RoleRoute route="/patients" />}>
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
          </Route>

          <Route element={<RoleRoute route="/doctors" />}>
            <Route path="/doctors" element={<DoctorsPage />} />
          </Route>

          <Route element={<RoleRoute route="/appointments" />}>
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>

          <Route element={<RoleRoute route="/consultation" />}>
            <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
          </Route>

          <Route element={<RoleRoute route="/reception" />}>
            <Route path="/reception" element={<ReceptionPage />} />
          </Route>

          <Route element={<RoleRoute route="/assessments" />}>
            <Route path="/assessments" element={<NurseAssessmentPage />} />
          </Route>

          <Route element={<RoleRoute route="/queue" />}>
            <Route path="/queue" element={<QueuePage />} />
          </Route>

          <Route element={<RoleRoute route="/admissions" />}>
            <Route path="/admissions" element={<AdmissionsPage />} />
          </Route>

          <Route element={<RoleRoute route="/laboratory" />}>
            <Route path="/laboratory" element={<LaboratoryPage />} />
          </Route>

          <Route element={<RoleRoute route="/lab-results" />}>
            <Route path="/lab-results" element={<DoctorLabResultsPage />} />
          </Route>

          <Route element={<RoleRoute route="/pharmacy" />}>
            <Route path="/pharmacy" element={<PharmacyPage />} />
          </Route>

          <Route element={<RoleRoute route="/inventory" />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RoleRoute route="/billing" />}>
            <Route path="/billing" element={<BillingPage />} />
          </Route>

          <Route element={<RoleRoute route="/reports" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleRoute route="/users" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route element={<RoleRoute route="/audit-logs" />}>
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          <Route element={<RoleRoute route="/settings" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<RoleRoute route="/departments" />}>
            <Route path="/departments" element={<DepartmentsPage />} />
          </Route>
        </Route>

        {/* Patient portal — completely separate from staff */}
        <Route element={<PatientRouteGuard />}>
          <Route element={<PatientLayout />}>
            <Route path="/portal" element={<PatientDashboardPage />} />
            <Route path="/portal/complete-profile" element={<ProfileCompletionPage />} />
            <Route path="/portal/book" element={<BookAppointmentPage />} />
            <Route path="/portal/profile" element={<PatientProfilePage />} />
            <Route path="/portal/appointments" element={<PatientAppointmentsPage />} />
            <Route path="/portal/queue" element={<PatientQueuePage />} />
            <Route path="/portal/records" element={<PatientMedicalRecordsPage />} />
            <Route path="/portal/prescriptions" element={<PatientPrescriptionsPage />} />
            <Route path="/portal/lab" element={<PatientLabPage />} />
            <Route path="/portal/billing" element={<PatientBillingPage />} />
            <Route path="/portal/insurance" element={<PatientInsurancePage />} />
            <Route path="/portal/family" element={<PatientFamilyPage />} />
            <Route path="/portal/tracker" element={<PatientHealthTrackerPage />} />
            <Route path="/portal/timeline" element={<PatientTimelinePage />} />
            <Route path="/portal/notifications" element={<PatientNotificationsPage />} />
            <Route path="/portal/messages" element={<PatientMessagesPage />} />
            <Route path="/portal/documents" element={<PatientDocumentsPage />} />
            <Route path="/portal/feedback" element={<PatientFeedbackPage />} />
            <Route path="/portal/settings" element={<PatientSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
