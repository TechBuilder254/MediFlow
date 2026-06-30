export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_technician'
  | 'cashier'
  | 'patient'

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined' | 'checked_in' | 'suggested' | 'in_progress'
export type AppointmentUrgency = 'routine' | 'moderate' | 'urgent'
export type BedStatus = 'available' | 'occupied' | 'cleaning'
export type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'insurance'
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'refunded'
export type LabStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type QueueStatus = 'waiting' | 'being_served' | 'completed'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string | null
  phone?: string | null
  is_active: boolean
  created_at: string
}

export type PortalStatus = 'pending' | 'approved' | 'rejected'

export interface Patient {
  id: string
  user_id?: string | null
  patient_number: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  gender?: 'male' | 'female' | 'other' | null
  blood_group?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  insurance_provider?: string | null
  insurance_number?: string | null
  allergies?: string[] | null
  photo_url?: string | null
  notes?: string | null
  portal_status?: PortalStatus
  profile_completed?: boolean
  national_id?: string | null
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  chronic_diseases?: string[] | null
  medical_conditions?: string[] | null
  vaccination_history?: Record<string, unknown>[] | null
  next_of_kin_name?: string | null
  next_of_kin_phone?: string | null
  next_of_kin_relationship?: string | null
  current_medications?: string[] | null
  created_at: string
}

export interface Department {
  id: string
  name: string
  description?: string | null
}

export interface Doctor {
  id: string
  user_id?: string | null
  display_name?: string | null
  department_id?: string | null
  license_number?: string | null
  specialization?: string | null
  qualification?: string | null
  years_experience: number
  consultation_fee: number
  is_on_duty: boolean
  is_active?: boolean
  consultation_room?: string | null
  languages?: string[] | null
  schedule?: DoctorSchedule
  department?: Department
  profile?: Profile
}

export interface DoctorSchedule {
  working_days?: number[]
  slots?: string[]
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  department_id?: string | null
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  urgency?: AppointmentUrgency
  reason?: string | null
  symptoms?: string | null
  notes?: string | null
  room_number?: string | null
  checked_in_at?: string | null
  suggested_date?: string | null
  suggested_start_time?: string | null
  suggested_end_time?: string | null
  doctor_message?: string | null
  decline_reason?: string | null
  patient?: Patient
  doctor?: Doctor
  department?: Department
}

export interface Ward {
  id: string
  name: string
  type: string
  floor: number
  capacity: number
}

export interface Bed {
  id: string
  room_id: string
  bed_number: string
  status: BedStatus
  room?: { room_number: string; ward?: Ward }
}

export interface Medicine {
  id: string
  name: string
  generic_name?: string | null
  category?: string | null
  unit: string
  barcode?: string | null
  reorder_level: number
  unit_price: number
}

export interface InventoryItem {
  id: string
  medicine_id?: string | null
  item_name: string
  item_type: 'medicine' | 'equipment' | 'consumable'
  quantity: number
  unit?: string | null
  expiry_date?: string | null
  batch_number?: string | null
  location?: string | null
  medicine?: Medicine
}

export interface LabTest {
  id: string
  patient_id: string
  doctor_id?: string | null
  technician_id?: string | null
  test_name: string
  test_type?: string | null
  status: LabStatus
  ordered_at: string
  completed_at?: string | null
  notes?: string | null
  patient?: Patient
}

export interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  amount_paid: number
  status: InvoiceStatus
  due_date?: string | null
  created_at: string
  patient?: Patient
}

export interface ActivityLog {
  id: string
  user_id?: string | null
  action: string
  entity_type?: string | null
  entity_id?: string | null
  details?: Record<string, unknown>
  created_at: string
  profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type?: string | null
  is_read: boolean
  link?: string | null
  created_at: string
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  medicine_id: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string | null
  quantity: number
  dispensed: boolean
  dispensed_at?: string | null
  dispensed_by?: string | null
  created_at: string
  medicine?: Medicine
  doctor?: Doctor
}

export interface PatientMessage {
  id: string
  patient_id: string
  sender_id: string
  recipient_role: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface DashboardStats {
  todayPatients: number
  appointments: number
  doctorsOnDuty: number
  revenueToday: number
  bedsAvailable: number
  emergencyCases: number
  pendingLabResults: number
  lowStockMedicines: number
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  cashier: 'Cashier',
  patient: 'Patient',
}

export const STAFF_ROLES: UserRole[] = [
  'super_admin', 'admin', 'doctor', 'nurse', 'receptionist',
  'pharmacist', 'lab_technician', 'cashier',
]

// Re-export from permissions for convenience
export { ROUTE_PERMISSIONS, canAccessRoute, getDefaultRoute } from '@/lib/permissions'
