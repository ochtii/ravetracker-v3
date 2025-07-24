import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich'),
  password: z
    .string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .min(1, 'Passwort ist erforderlich')
})

export const registerSchema = z.object({
  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'),
  confirmPassword: z
    .string()
    .min(1, 'Passwort bestätigen ist erforderlich'),
  firstName: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen lang sein')
    .max(50, 'Vorname darf maximal 50 Zeichen lang sein')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen lang sein')
    .max(50, 'Nachname darf maximal 50 Zeichen lang sein')
    .optional(),
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(30, 'Benutzername darf maximal 30 Zeichen lang sein')
    .regex(/^[a-zA-Z0-9_]+$/, 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten')
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword']
})

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen lang sein')
    .max(50, 'Vorname darf maximal 50 Zeichen lang sein')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen lang sein')
    .max(50, 'Nachname darf maximal 50 Zeichen lang sein')
    .optional(),
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(30, 'Benutzername darf maximal 30 Zeichen lang sein')
    .regex(/^[a-zA-Z0-9_]+$/, 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio darf maximal 500 Zeichen lang sein')
    .optional(),
  website: z
    .string()
    .url('Bitte gib eine gültige URL ein')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Standort darf maximal 100 Zeichen lang sein')
    .optional(),
  birthDate: z
    .string()
    .refine((date) => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 13 && age <= 120
    }, 'Du musst mindestens 13 Jahre alt sein')
    .optional()
})

export const passwordResetSchema = z.object({
  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich')
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z
    .string()
    .min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'),
  confirmNewPassword: z
    .string()
    .min(1, 'Neues Passwort bestätigen ist erforderlich')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmNewPassword']
})

export const magicLinkSchema = z.object({
  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich')
})

// Type exports
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ProfileData = z.infer<typeof profileSchema>
export type PasswordResetData = z.infer<typeof passwordResetSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>
export type MagicLinkData = z.infer<typeof magicLinkSchema>

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}
