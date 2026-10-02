import { z } from 'zod';

export const fieldValidationSchema = z
  .object({
    minLength: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    maxLength: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    min: z
      .number()
      .optional(),

    max: z
      .number()
      .optional(),

    pattern: z
      .string()
      .optional(),

    customErrorMessage: z
      .string()
      .optional(),

    errorMessage: z
      .string()
      .optional(),
  })
  .strict();

export const dependsOnSchema = z
  .object({
    fieldId: z.string().min(1),

    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
    ]),
  })
  .strict();

export const themeConfigSchema = z
  .object({
    primaryColor: z
      .string()
      .optional(),

    accentColor: z
      .string()
      .optional(),

    borderRadius: z
      .string()
      .optional(),

    darkMode: z
      .boolean()
      .optional(),

    density: z
      .enum([
        'compact',
        'normal',
        'spacious',
      ])
      .optional(),

    showLogo: z
      .boolean()
      .optional(),

    logoUrl: z
      .string()
      .optional(),
  })
  .strict();

export const formFieldSchema = z
  .object({
    id: z
      .string()
      .min(1),

    label: z
      .string()
      .min(1),

    type: z.enum([
      'text',
      'number',
      'select',
      'radio',
      'checkbox',
      'textarea',
      'email',
      'date',
      'file',
      'rating',
      'multiselect',
    ]),

    placeholder: z
      .string()
      .optional(),

    defaultValue: z
      .union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(
          z.string().min(1)
    ),
      ])
      .optional(),

    required: z
      .boolean()
      .default(false),

    icon: z
      .string()
      .optional(),

    gridSpan: z
      .enum([
        'half',
        'full',
      ])
      .optional(),
    autoPlusThreshold: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    multipleSelection: z
      .boolean()
      .optional(),

    options: z
      .array(
        z.string().min(1)
      )
      .optional(),

    validation:
      fieldValidationSchema.optional(),

    dependsOn:
      dependsOnSchema.optional(),
  })
  .strict();

export const formStepSchema = z
  .object({
    id: z
      .string()
      .min(1),

    title: z
      .string()
      .min(1),

    description: z
      .string()
      .optional(),

    fields: z
      .array(formFieldSchema)
      .min(1)
      .max(30),
  })
  .strict();

export const generatedFormSchema = z
  .object({
    brandName: z
      .string()
      .optional(),

    formTitle: z
      .string()
      .min(1),

    formSubtitle: z
      .string()
      .optional(),

    infoBoxText: z
      .string()
      .optional(),

    // Public formda tema ayarlarının da korunması için schema içinde saklıyoruz.
    themeConfig:
      themeConfigSchema.optional(),

    isMultiStep: z
      .boolean(),

    fields: z
      .array(formFieldSchema)
      .max(30)
      .optional(),

    steps: z
      .array(formStepSchema)
      .max(10)
      .optional(),
  })
  .strict();