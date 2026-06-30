import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['patient', 'doctor'], {
    required_error: 'Choose how you’ll use MediConnect.',
  }),
})
export type SignupValues = z.infer<typeof signupSchema>

export const patientOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  phone: z.string().min(7, 'Enter a valid phone number.'),
})
export type PatientOnboardingValues = z.infer<typeof patientOnboardingSchema>

export const doctorOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  phone: z.string().min(7, 'Enter a valid phone number.'),
  specialty: z.string().min(2, 'Enter your specialty.'),
  bio: z.string().max(600, 'Keep your bio under 600 characters.').optional().or(z.literal('')),
})
export type DoctorOnboardingValues = z.infer<typeof doctorOnboardingSchema>
