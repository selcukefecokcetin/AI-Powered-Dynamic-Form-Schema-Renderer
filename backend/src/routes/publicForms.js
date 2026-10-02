import express from 'express';

import {
  validateSubmissionPayload,
} from '../validation/submissionValidator.js';

import {
  createSubmissionRequestSchema,
} from '../schemas/submissionSchemas.js';

import {
  supabase,
} from '../db/supabase.js';

import {
  publicTokenSchema,
} from '../schemas/formRecordSchemas.js';

const router = express.Router();

// --------------------------------------------------
// GET /api/public/forms/:token
//
// Yayınlanmış formu public token ile getirir.
// Bu endpoint müşteri tarafından kullanılacaktır.
// --------------------------------------------------

router.get('/:token', async (req, res) => {
  try {
    const tokenValidation =
      publicTokenSchema.safeParse(
        req.params.token
      );

    if (!tokenValidation.success) {
      return res.status(400).json({
        error:
          'Invalid public form token.',
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from('forms')
      .select(`
        id,
        form_title,
        schema_json,
        version,
        published_at
      `)
      .eq(
        'public_token',
        tokenValidation.data
      )
      .eq(
        'status',
        'published'
      )
      .maybeSingle();

    if (error) {
      console.error(
        'Supabase public form read error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load public form.',
      });
    }

    if (!data) {
      return res.status(404).json({
        error:
          'Published form not found.',
      });
    }

    return res
      .status(200)
      .json(data);

  } catch (error) {
    console.error(
      'Public form error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to load public form.',
    });
  }
});

// --------------------------------------------------
// POST /api/public/forms/:token/submissions
//
// Müşteri cevaplarını yayınlanmış forma kaydeder.
// --------------------------------------------------

router.post(
  '/:token/submissions',
  async (req, res) => {
    try {
      const tokenValidation =
        publicTokenSchema.safeParse(
          req.params.token
        );

      if (!tokenValidation.success) {
        return res.status(400).json({
          error:
            'Invalid public form token.',
        });
      }

      const requestValidation =
        createSubmissionRequestSchema.safeParse(
          req.body
        );

      if (!requestValidation.success) {
        return res.status(400).json({
          error:
            'Invalid submission data.',

          details:
            requestValidation.error.flatten(),
        });
      }

      const {
        payload,
      } = requestValidation.data;

      // Önce public formu bul.
      const {
        data: form,
        error: formError,
      } = await supabase
        .from('forms')
        .select(`
          id,
          schema_json,
          version,
          status
        `)
        .eq(
          'public_token',
          tokenValidation.data
        )
        .eq(
          'status',
          'published'
        )
        .maybeSingle();

      if (formError) {
        console.error(
          'Supabase form lookup error:',
          formError
        );

        return res.status(500).json({
          error:
            'Failed to process submission.',
        });
      }

      if (!form) {
        return res.status(404).json({
          error:
            'Published form not found.',
        });
      }

      // Şimdilik minimum kontrol:
      // payload gerçek bir object olmalı ve boş olmamalı.
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        Object.keys(payload).length === 0
      ) {
        return res.status(400).json({
          error:
            'Submission payload cannot be empty.',
        });
      }

      const validation =
        validateSubmissionPayload(
          form.schema_json,
          payload
        );

      if (!validation.success) {
        return res.status(400).json({
          error:
            'Submission validation failed.',

          fields:
            validation.errors,
        });
      }

      const {
        data: submission,
        error: submissionError,
      } = await supabase
        .from('submissions')
        .insert({
          form_id:
            form.id,

          form_version:
            form.version,

          schema_snapshot:
            form.schema_json,

          payload_json:
            validation.payload,
        })
        .select(`
          id,
          form_id,
          form_version,
          submitted_at
        `)
        .single();

      if (submissionError) {
        console.error(
          'Supabase submission insert error:',
          submissionError
        );

        return res.status(500).json({
          error:
            'Failed to save submission.',
        });
      }

      return res
        .status(201)
        .json({
          id:
            submission.id,

          submittedAt:
            submission.submitted_at,
        });

    } catch (error) {
      console.error(
        'Create submission error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to save submission.',
      });
    }
  }
);

export default router;