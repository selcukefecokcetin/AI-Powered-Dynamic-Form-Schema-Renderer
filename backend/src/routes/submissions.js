import express from 'express';

import {
  supabase,
} from '../db/supabase.js';

import {
  submissionIdSchema,
} from '../schemas/submissionSchemas.js';

const router =
  express.Router();

// --------------------------------------------------
// GET /api/submissions/:id
//
// Tek submission'ın detayını getirir.
// Şimdilik local development içindir.
// Auth eklendiğinde owner kontrolü yapılacaktır.
// --------------------------------------------------

router.get('/:id', async (req, res) => {
  try {
    const idValidation =
      submissionIdSchema.safeParse(
        req.params.id
      );

    if (!idValidation.success) {
      return res.status(400).json({
        error:
          'Invalid submission ID.',
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from('submissions')
      .select(`
        id,
        form_id,
        form_version,
        schema_snapshot,
        payload_json,
        submitted_at
      `)
      .eq(
        'id',
        idValidation.data
      )
      .maybeSingle();

    if (error) {
      console.error(
        'Supabase submission read error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load submission.',
      });
    }

    if (!data) {
      return res.status(404).json({
        error:
          'Submission not found.',
      });
    }

    return res
      .status(200)
      .json(data);

  } catch (error) {
    console.error(
      'Get submission error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to load submission.',
    });
  }
});

export default router;