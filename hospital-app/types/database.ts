/**
 * MediConnect database types.
 *
 * Hand-authored to mirror the SQL schema in `supabase/migrations`. Once the
 * Supabase CLI is linked you can regenerate this file with:
 *   npm run types   (supabase gen types typescript --local > types/database.ts)
 */

export type UserRole = 'patient' | 'doctor' | 'admin'
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          full_name: string
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: UserRole
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: UserRole
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          profile_id: string
          specialty: string
          bio: string | null
          consultation_fee: number | null
          buffer_minutes: number
          is_active: boolean
        }
        Insert: {
          id?: string
          profile_id: string
          specialty: string
          bio?: string | null
          consultation_fee?: number | null
          buffer_minutes?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          profile_id?: string
          specialty?: string
          bio?: string | null
          consultation_fee?: number | null
          buffer_minutes?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'doctors_profile_id_fkey'
            columns: ['profile_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      blocked_dates: {
        Row: {
          id: string
          doctor_id: string
          date: string
          reason: string | null
        }
        Insert: {
          id?: string
          doctor_id: string
          date: string
          reason?: string | null
        }
        Update: {
          id?: string
          doctor_id?: string
          date?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'blocked_dates_doctor_id_fkey'
            columns: ['doctor_id']
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          }
        ]
      }
      availability_slots: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_minutes: number
          is_active: boolean
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_minutes?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_duration_minutes?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'availability_slots_doctor_id_fkey'
            columns: ['doctor_id']
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          slot_date: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          notes: string | null
          created_at: string
          updated_at: string
          reminder_sent_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          slot_date: string
          start_time: string
          end_time: string
          status?: AppointmentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          reminder_sent_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          slot_date?: string
          start_time?: string
          end_time?: string
          status?: AppointmentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          reminder_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_patient_id_fkey'
            columns: ['patient_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_doctor_id_fkey'
            columns: ['doctor_id']
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          }
        ]
      }
      appointment_history: {
        Row: {
          id: string
          appointment_id: string
          changed_by: string | null
          old_status: string | null
          new_status: string
          reason: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          changed_by?: string | null
          old_status?: string | null
          new_status: string
          reason?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          changed_by?: string | null
          old_status?: string | null
          new_status?: string
          reason?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_history_appointment_id_fkey'
            columns: ['appointment_id']
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointment_history_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Json | null
          sent_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          payload?: Json | null
          sent_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          payload?: Json | null
          sent_at?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      book_appointment_atomic: {
        Args: {
          p_doctor_id: string
          p_slot_date: string
          p_start_time: string
          p_end_time: string
          p_notes: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      user_role: UserRole
      appointment_status: AppointmentStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}

/* ---------- Convenience row aliases ---------- */

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Doctor = Database['public']['Tables']['doctors']['Row']
export type BlockedDate = Database['public']['Tables']['blocked_dates']['Row']
export type AvailabilitySlot =
  Database['public']['Tables']['availability_slots']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type AppointmentHistory =
  Database['public']['Tables']['appointment_history']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

/* ---------- Joined / composite helper types ---------- */

export type DoctorWithProfile = Doctor & {
  profile: Profile
}

export type AppointmentWithProfiles = Appointment & {
  patient: Profile
  doctor: DoctorWithProfile
}
