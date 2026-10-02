import express from 'express';

import {
  generateFormWithGemini,
} from '../ai/geminiService.js';

import {
  generateFormRequestSchema,
} from '../schemas/requestSchemas.js';

import {
  generatedFormSchema,
} from '../schemas/formSchemas.js';

import {
  applyFormSafetyRules,
  FormRuleError,
} from '../rules/formRules.js';

import {
  applyPropertyRules,
} from '../rules/propertyRules.js';

const router = express.Router();

const selectableFieldTypes = new Set([
  'select',
  'radio',
  'multiselect',
]);

function getSchemaFields(schema) {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  if (
    schema.isMultiStep &&
    Array.isArray(schema.steps)
  ) {
    return schema.steps.flatMap(
      (step) =>
        Array.isArray(step?.fields)
          ? step.fields
          : []
    );
  }

  return Array.isArray(schema.fields)
    ? schema.fields
    : [];
}

function restoreMissingChoiceOptions(
  generatedSchema,
  currentSchema
) {
  if (!currentSchema) {
    return generatedSchema;
  }

  const repairedSchema =
    structuredClone(generatedSchema);

  const currentFieldMap = new Map(
    getSchemaFields(currentSchema).map(
      (field) => [field.id, field]
    )
  );

  for (const field of
    getSchemaFields(repairedSchema)) {
    if (
      !selectableFieldTypes.has(
        field.type
      )
    ) {
      continue;
    }

    if (
      Array.isArray(field.options) &&
      field.options.length > 0
    ) {
      continue;
    }

    const previousField =
      currentFieldMap.get(field.id);

    if (
      previousField?.type === field.type &&
      Array.isArray(previousField.options) &&
      previousField.options.length > 0
    ) {
      // AI edit sırasında options kaybolursa mevcut güvenli seçenekleri koruyoruz.
      field.options = [
        ...previousField.options,
      ];
    }
  }

  return repairedSchema;
}

// --------------------------------------------------
// POST /api/generate-form
// --------------------------------------------------

router.post('/', async (req, res) => {
  try {
    // ----------------------------------------------
    // 1. VALIDATE USER REQUEST
    // ----------------------------------------------

    const requestValidation =
      generateFormRequestSchema.safeParse(
        req.body
      );

        if (!requestValidation.success) {
      // Root-level validation hatalarını da görebilmek için
      // sadece fieldErrors yerine tüm Zod hata detayını döndürüyoruz.
      console.error(
        'Invalid generate-form request:',
        {
          body: req.body,
          errors:
            requestValidation.error.flatten(),
        }
      );

      return res.status(400).json({
        error: 'Invalid request.',
        details:
          requestValidation.error.flatten(),
      });
    }

    const {
     prompt,
    currentSchema,
    } = requestValidation.data;
    // ----------------------------------------------
    // 2. CALL GEMINI
    // ----------------------------------------------

    const parsedData =
      await generateFormWithGemini(
        prompt,
        currentSchema
      );

    // ----------------------------------------------
    // 3. VALIDATE AI RESPONSE WITH ZOD
    // ----------------------------------------------

    const repairedParsedData =
      restoreMissingChoiceOptions(
        parsedData,
        currentSchema
  );

    const schemaValidation =
      generatedFormSchema.safeParse(
       repairedParsedData
  );
    if (!schemaValidation.success) {
      console.error(
        'Invalid AI form schema:',
        schemaValidation.error.flatten()
      );

      return res.status(502).json({
        error:
          'AI returned an invalid form schema.',

        details:
          schemaValidation.error.flatten(),
      });
    }

    // ----------------------------------------------
    // 4. APPLY GENERAL SAFETY RULES
    // ----------------------------------------------

    let generalSafeSchema;

    try {
      generalSafeSchema =
        applyFormSafetyRules(
          schemaValidation.data
        );
    } catch (ruleError) {
      if (
        ruleError instanceof FormRuleError
      ) {
        console.error(
          'General form safety rule rejected AI output:',
          ruleError.message
        );

        return res.status(502).json({
          error:
            'AI form schema failed safety rules.',

          details:
            ruleError.message,
        });
      }

      throw ruleError;
    }

    // Ek güvenlik kontrolü.
    if (!generalSafeSchema) {
      throw new Error(
        'applyFormSafetyRules returned undefined.'
      );
    }

    // ----------------------------------------------
    // 5. APPLY PROPERTY-SPECIFIC RULES
    // ----------------------------------------------

    const safeSchema =
      applyPropertyRules(
        generalSafeSchema
      );

    if (!safeSchema) {
      throw new Error(
        'applyPropertyRules returned undefined.'
      );
    }

    // ----------------------------------------------
    // 6. RETURN SAFE SCHEMA
    // ----------------------------------------------

    return res
      .status(200)
      .json(safeSchema);

  } catch (error) {
    // Geliştirme sırasında gerçek backend hatasını görebilmek için hata mesajını logluyoruz.
    console.error(
      'Generate form error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to generate form schema.',

      // Sorunun Gemini, JSON parse veya başka bir backend adımından geldiğini görmemizi sağlar.
      details:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

export default router;""