import express from 'express';
import cors from 'cors';
import publicFormsRouter
  from './routes/publicForms.js';
import formsRouter
  from './routes/forms.js';
import generateFormRouter
  from './routes/generateForm.js';
import submissionsRouter
  from './routes/submissions.js';

// --------------------------------------------------
// APP
// --------------------------------------------------

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: '2mb',
  })
);

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

const configuredOrigins =
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const developmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? configuredOrigins
    : [
        ...developmentOrigins,
        ...configuredOrigins,
      ];

app.use(
  cors({
    origin(origin, callback) {
      // PowerShell, Postman, server-to-server gibi
      // Origin header göndermeyen istekleri engelleme.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    methods: [
      'GET',
      'POST',
      'PATCH',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
);

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use(
  '/api/generate-form',
  generateFormRouter
);

app.use(
  '/api/forms',
  formsRouter
);

app.use(
  '/api/public/forms',
  publicFormsRouter
);

app.use(
  '/api/submissions',
  submissionsRouter
);

// --------------------------------------------------
// 404
// --------------------------------------------------

app.use((_req, res) => {
  return res.status(404).json({
    error: 'Route not found.',
  });
});

export default app;