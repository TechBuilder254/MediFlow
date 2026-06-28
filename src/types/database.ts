export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string; full_name: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      patients: {
        Row: {
          id: string
          user_id: string | null
          patient_number: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          gender: string | null
          blood_group: string | null
          phone: string | null
          email: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          insurance_provider: string | null
          insurance_number: string | null
          allergies: string[] | null
          photo_url: string | null
          qr_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['patients']['Row']> & { patient_number: string; first_name: string; last_name: string }
        Update: Partial<Database['public']['Tables']['patients']['Row']>
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          department_id: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status: string
          reason: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['appointments']['Row']> & { patient_id: string; doctor_id: string; appointment_date: string; start_time: string; end_time: string }
        Update: Partial<Database['public']['Tables']['appointments']['Row']>
      }
      doctors: {
        Row: {
          id: string
          user_id: string | null
          department_id: string | null
          license_number: string | null
          specialization: string | null
          qualification: string | null
          years_experience: number
          consultation_fee: number
          is_on_duty: boolean
          schedule: Json
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['doctors']['Row']>
        Update: Partial<Database['public']['Tables']['doctors']['Row']>
      }
      departments: {
        Row: { id: string; name: string; description: string | null; head_doctor_id: string | null; created_at: string }
        Insert: Partial<Database['public']['Tables']['departments']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['departments']['Row']>
      }
      medicines: {
        Row: {
          id: string
          name: string
          generic_name: string | null
          category: string | null
          unit: string
          barcode: string | null
          reorder_level: number
          unit_price: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['medicines']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['medicines']['Row']>
      }
      inventory: {
        Row: {
          id: string
          medicine_id: string | null
          item_name: string
          item_type: string
          quantity: number
          unit: string | null
          expiry_date: string | null
          batch_number: string | null
          supplier_id: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['inventory']['Row']> & { item_name: string; item_type: string }
        Update: Partial<Database['public']['Tables']['inventory']['Row']>
      }
      laboratory_tests: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string | null
          technician_id: string | null
          test_name: string
          test_type: string | null
          status: string
          ordered_at: string
          completed_at: string | null
          notes: string | null
        }
        Insert: Partial<Database['public']['Tables']['laboratory_tests']['Row']> & { patient_id: string; test_name: string }
        Update: Partial<Database['public']['Tables']['laboratory_tests']['Row']>
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          patient_id: string
          appointment_id: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          amount_paid: number
          status: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['invoices']['Row']> & { invoice_number: string; patient_id: string }
        Update: Partial<Database['public']['Tables']['invoices']['Row']>
      }
      wards: {
        Row: { id: string; name: string; type: string; floor: number; capacity: number; created_at: string }
        Insert: Partial<Database['public']['Tables']['wards']['Row']> & { name: string; type: string }
        Update: Partial<Database['public']['Tables']['wards']['Row']>
      }
      beds: {
        Row: { id: string; room_id: string; bed_number: string; status: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['beds']['Row']> & { room_id: string; bed_number: string }
        Update: Partial<Database['public']['Tables']['beds']['Row']>
      }
      admissions: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string | null
          bed_id: string | null
          ward_id: string | null
          admission_date: string
          discharge_date: string | null
          status: string
          diagnosis: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['admissions']['Row']> & { patient_id: string }
        Update: Partial<Database['public']['Tables']['admissions']['Row']>
      }
      queue_entries: {
        Row: {
          id: string
          patient_id: string
          department_id: string | null
          ticket_number: number
          status: string
          checked_in_at: string
          served_at: string | null
          completed_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['queue_entries']['Row']> & { patient_id: string; ticket_number: number }
        Update: Partial<Database['public']['Tables']['queue_entries']['Row']>
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['activity_logs']['Row']> & { action: string }
        Update: Partial<Database['public']['Tables']['activity_logs']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string | null
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { user_id: string; title: string; message: string }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      hospital_settings: {
        Row: {
          id: string
          hospital_name: string
          logo_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          tax_rate: number
          currency: string
          working_hours: Json
          payment_methods: string[]
          theme: string
          language: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['hospital_settings']['Row']>
        Update: Partial<Database['public']['Tables']['hospital_settings']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
