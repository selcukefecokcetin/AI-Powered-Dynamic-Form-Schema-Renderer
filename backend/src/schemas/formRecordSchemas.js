import { z } from 'zod';

import {
  generatedFormSchema,
} from './formSchemas.js';

export const createFormRequestSchema =
  z
    .object({
      originalPrompt: z
        .string()
        .trim()
        .min(3)
        .max(2000),

      schema:
        generatedFormSchema,
    })
    .strict();

export const updateFormRequestSchema =
  z
    .object({
      schema:
        generatedFormSchema,
    })
    .strict();

export const formIdSchema =
  z.string().uuid();    

  export const publicTokenSchema =
  z.string().uuid();