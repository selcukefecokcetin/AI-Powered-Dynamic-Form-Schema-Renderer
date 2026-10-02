import express from 'express';

import {
  supabase,
} from '../db/supabase.js';

import {
  createFormRequestSchema,
  updateFormRequestSchema,
  formIdSchema,
} from '../schemas/formRecordSchemas.js';

import {
  applyFormSafetyRules,
  FormRuleError,
} from '../rules/formRules.js';

const router =
  express.Router();

// --------------------------------------------------
// POST /api/forms
//
// Generated / edited form'u draft olarak kaydeder.
// --------------------------------------------------

router.post('/', async (req, res) => {
  try {
    const requestValidation =
      createFormRequestSchema.safeParse(
        req.body
      );

    if (!requestValidation.success) {
      return res.status(400).json({
        error:
          'Invalid form data.',

        details:
          requestValidation.error
            .flatten(),
      });
    }

    const {
      originalPrompt,
      schema,
    } =
      requestValidation.data;

    // Form manuel olarak düzenlenmiş olsa bile
    // temel güvenlik kurallarından tekrar geçsin.
    let safeSchema;

    try {
      safeSchema =
        applyFormSafetyRules(
          schema
        );
    } catch (ruleError) {
      if (
        ruleError instanceof
        FormRuleError
      ) {
        return res.status(400).json({
          error:
            'Form failed safety validation.',

          details:
            ruleError.message,
        });
      }

      throw ruleError;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from('forms')
        .insert({
          original_prompt:
            originalPrompt,

          form_title:
            safeSchema.formTitle,

          schema_json:
            safeSchema,

          status:
            'draft',
        })
        .select(`
          id,
          owner_id,
          original_prompt,
          form_title,
          schema_json,
          status,
          public_token,
          version,
          published_at,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        'Supabase insert error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to save form.',
      });
    }

    return res
      .status(201)
      .json(data);

  } catch (error) {
    console.error(
      'Create form error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to save form.',
    });
  }
});

// --------------------------------------------------
// PATCH /api/forms/:id
//
// Draft form schema'sını günceller.
// --------------------------------------------------

router.patch('/:id', async (req, res) => {
  try {
    const idValidation =
      formIdSchema.safeParse(
        req.params.id
      );

    if (!idValidation.success) {
      return res.status(400).json({
        error:
          'Invalid form ID.',
      });
    }

    const requestValidation =
      updateFormRequestSchema.safeParse(
        req.body
      );

    if (!requestValidation.success) {
      return res.status(400).json({
        error:
          'Invalid form data.',

        details:
          requestValidation.error.flatten(),
      });
    }

    const {
      schema,
    } =
      requestValidation.data;

    let safeSchema;

    try {
      safeSchema =
        applyFormSafetyRules(
          schema
        );
    } catch (ruleError) {
      if (
        ruleError instanceof
        FormRuleError
      ) {
        return res.status(400).json({
          error:
            'Form failed safety validation.',

          details:
            ruleError.message,
        });
      }

      throw ruleError;
    }

    // Şimdilik sadece draft formlar düzenlenebilir.
    const {
      data,
      error,
    } =
      await supabase
        .from('forms')
        .update({
          form_title:
            safeSchema.formTitle,

          schema_json:
            safeSchema,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          idValidation.data
        )
        .eq(
          'status',
          'draft'
        )
        .select(`
          id,
          owner_id,
          original_prompt,
          form_title,
          schema_json,
          status,
          public_token,
          version,
          published_at,
          created_at,
          updated_at
        `)
        .maybeSingle();

    if (error) {
      console.error(
        'Supabase update error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to update form.',
      });
    }

    if (!data) {
      return res.status(404).json({
        error:
          'Draft form not found.',
      });
    }

    return res
      .status(200)
      .json(data);

  } catch (error) {
    console.error(
      'Update form error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to update form.',
    });
  }
});

// --------------------------------------------------
// GET /api/forms/:id
//
// Kaydedilmiş formu ID ile getirir.
// --------------------------------------------------

router.get('/:id', async (req, res) => {
  try {
    const idValidation =
      formIdSchema.safeParse(
        req.params.id
      );

    if (!idValidation.success) {
      return res.status(400).json({
        error:
          'Invalid form ID.',
      });
    }

    const {
      data,
      error,
    } =
      await supabase
        .from('forms')
        .select(`
          id,
          owner_id,
          original_prompt,
          form_title,
          schema_json,
          status,
          public_token,
          version,
          published_at,
          created_at,
          updated_at
        `)
        .eq(
          'id',
          idValidation.data
        )
        .maybeSingle();

    if (error) {
      console.error(
        'Supabase read error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load form.',
      });
    }

    if (!data) {
      return res.status(404).json({
        error:
          'Form not found.',
      });
    }

    return res
      .status(200)
      .json(data);

  } catch (error) {
    console.error(
      'Get form error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to load form.',
    });
  }
});

export default router;