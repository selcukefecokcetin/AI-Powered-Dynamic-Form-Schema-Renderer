import { z } from 'zod';

export const generateFormRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(
      3,
      'Prompt must contain at least 3 characters.'
    )
    .max(
      2000,
      'Prompt must not exceed 2000 characters.'
    ),

  // Mevcut form AI ile düzenlenirken gönderilen schema nesnesini kabul eder.
  currentSchema: z
    .record(z.string(), z.unknown())
    .optional(),
});