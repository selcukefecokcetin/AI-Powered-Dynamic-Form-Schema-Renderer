import { z } from 'zod';

export const createSubmissionRequestSchema =
  z
    .object({
      payload: z.record(
        z.string(),
        z.unknown()
      ),
    })
    .strict();

export const submissionIdSchema =
  z.string().uuid();