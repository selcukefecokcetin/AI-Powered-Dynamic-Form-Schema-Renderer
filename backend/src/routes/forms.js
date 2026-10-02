import express from 'express';
import { randomUUID } from 'node:crypto';
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

const router = express.Router();

// --------------------------------------------------
// POST /api/forms
// Draft form kaydeder.
// --------------------------------------------------

router.post('/', async (req, res) => {
  try {
    const requestValidation =
      createFormRequestSchema.safeParse(
        req.body
      );

    if (!requestValidation.success) {
      return res.status(400).json({
        error: 'Invalid form data.',
        details:
          requestValidation.error.flatten(),
      });
    }

    const {
      originalPrompt,
      schema,
    } = requestValidation.data;

    let safeSchema;

    try {
      safeSchema =
        applyFormSafetyRules(schema);
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
    } = await supabase
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
// GET /api/forms
//
// Bütün formları listeler.
// Şimdilik local/demo development içindir.
// Auth eklendiğinde sadece kullanıcının formları dönecek.
// --------------------------------------------------

router.get('/', async (_req, res) => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from('forms')
      .select(`
        id,
        original_prompt,
        form_title,
        status,
        public_token,
        version,
        published_at,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'Supabase forms list error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load forms.',
      });
    }

    return res
      .status(200)
      .json({
        count:
          data.length,

        forms:
          data,
      });

  } catch (error) {
    console.error(
      'Get forms error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to load forms.',
    });
  }
});

// --------------------------------------------------
// PATCH /api/forms/:id
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
    } = requestValidation.data;

    let safeSchema;

    try {
      safeSchema =
        applyFormSafetyRules(schema);
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
} = await supabase
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
      'Form not found.',
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
// POST /api/forms/:id/publish
// Draft formu publish eder ve public token oluşturur.
// --------------------------------------------------

router.post('/:id/publish', async (req, res) => {
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

    const publicToken =
      randomUUID();

    const now =
      new Date().toISOString();

    const {
      data,
      error,
    } = await supabase
      .from('forms')
      .update({
        status:
          'published',

        public_token:
          publicToken,

        published_at:
          now,

        updated_at:
          now,
      })
      .eq(
        'id',
        idValidation.data
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
        'Supabase publish error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to publish form.',
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
      'Publish form error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to publish form.',
    });
  }
});

// --------------------------------------------------
// GET /api/forms/:id/submissions
//
// Bir forma ait bütün submission'ları getirir.
// Şimdilik local development içindir.
// Auth eklendiğinde owner kontrolü yapılacaktır.
// --------------------------------------------------

router.get(
  '/:id/submissions',
  async (req, res) => {
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

      const formId =
        idValidation.data;

      // Önce form gerçekten var mı kontrol et.
      const {
        data: form,
        error: formError,
      } = await supabase
        .from('forms')
        .select(`
          id,
          form_title,
          status,
          schema_json
        `)
        .eq(
          'id',
          formId
        )
        .maybeSingle();

      if (formError) {
        console.error(
          'Supabase form lookup error:',
          formError
        );

        return res.status(500).json({
          error:
            'Failed to load form submissions.',
        });
      }

      if (!form) {
        return res.status(404).json({
          error:
            'Form not found.',
        });
      }

      const {
        data: submissions,
        error: submissionsError,
      } = await supabase
        .from('submissions')
        .select(`
          id,
          form_id,
          form_version,
          payload_json,
          submitted_at
        `)
        .eq(
          'form_id',
          formId
        )
        .order(
          'submitted_at',
          {
            ascending: false,
          }
        );

      if (submissionsError) {
        console.error(
          'Supabase submissions read error:',
          submissionsError
        );

        return res.status(500).json({
          error:
            'Failed to load form submissions.',
        });
      }

      return res
        .status(200)
        .json({
          form: {
            id:
              form.id,

            title:
              form.form_title,

            status:
              form.status,
            // Submission tablosu doğru published form alanlarını kullanabilsin.
            schema_json:
              form.schema_json,
          },

          count:
            submissions.length,

          submissions,
        });

    } catch (error) {
      console.error(
        'Get form submissions error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load form submissions.',
      });
    }
  }
);

// --------------------------------------------------
// GET /api/forms/:id
// Formu ID ile getirir.
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
    } = await supabase
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