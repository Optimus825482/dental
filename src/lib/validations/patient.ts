import { z } from "zod";

export const patientCreateSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  tcKimlik: z.string().optional(),
  phone: z.string().min(10, "Geçerli telefon numarası giriniz"),
  email: z
    .string()
    .email("Geçerli e-posta giriniz")
    .optional()
    .or(z.literal("")),
  birthDate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  insuranceType: z.string().optional(),
  insuranceNo: z.string().optional(),
  notes: z.string().optional(),
  allergies: z
    .array(
      z.object({
        allergen: z.string(),
        severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
    )
    .optional(),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
