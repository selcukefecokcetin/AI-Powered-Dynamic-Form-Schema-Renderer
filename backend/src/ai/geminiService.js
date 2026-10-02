import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

import {
  geminiFormSchema,
} from './geminiSchema.js';

import {
  systemInstruction,
} from './systemPrompt.js';

const apiKey =
  process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY is missing from backend/.env'
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

// --------------------------------------------------
// GEMINI MODEL
//
// Eski sistem:
// 3 model × model başına 2 deneme
// = tek kullanıcı promptu için en kötü durumda 6 API çağrısı.
//
// Günlük düşük request kotasında bu çok pahalı.
//
// Yeni sistem:
// 1 kullanıcı AI aksiyonu = en fazla 1 Gemini çağrısı.
//
// 503 gelirse otomatik olarak diğer modellere geçmiyoruz
// ve aynı isteği tekrar tekrar göndermiyoruz.
//
// GEMINI_MODEL environment variable verilirse onu kullanır.
// Verilmezse varsayılan model kullanılır.
// --------------------------------------------------

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.6-flash';


// --------------------------------------------------
// SINGLE GEMINI REQUEST
// --------------------------------------------------

async function callGemini(
  model,
  fullPrompt
) {
  const response =
    await ai.models.generateContent({
      model,

      contents:
        fullPrompt,

      config: {
        systemInstruction,

        responseMimeType:
          'application/json',

        responseSchema:
          geminiFormSchema,
      },
    });

  // AI boş response döndürürse geçerli form
  // üretilemeyeceği için isteği başarısız sayıyoruz.
  if (!response.text) {
    throw new Error(
      'Gemini returned an empty response.'
    );
  }

  // Structured output beklesek bile gelen veriyi
  // JSON parse ederek doğruluyoruz.
  try {
    return JSON.parse(
      response.text
    );
  } catch {
    throw new Error(
      'Gemini returned invalid JSON.'
    );
  }
}


// --------------------------------------------------
// GENERATE / EDIT FORM
// --------------------------------------------------

export async function generateFormWithGemini(
  prompt,
  currentSchema = null
) {
  let fullPrompt =
    prompt;

  // currentSchema varsa bu yeni form üretme isteği değil,
  // mevcut form üzerinde AI edit isteğidir.
  //
  // Mevcut schema Gemini'ye gönderilir ve AI'dan
  // güncellenmiş TAM schema istenir.
  if (currentSchema) {
    fullPrompt =
      `Current JSON Schema:\n` +
      `${JSON.stringify(
        currentSchema,
        null,
        2
      )}\n\n` +

      `User Edit Request:\n${prompt}\n\n` +

      `IMPORTANT EDIT REQUIREMENTS:\n` +
      `- Apply EVERY explicit change requested by the user.\n` +
      `- Return the COMPLETE updated schema, not only changed fields.\n` +
      `- Preserve all fields and properties that the user did not ask to change.\n` +
      `- Preserve existing options for select, radio, and multiselect fields unless the user explicitly asks to modify them.\n` +
      `- If the user asks to add options, append ALL requested options without removing existing options.\n` +
      `- Before responding, verify that every requested modification is present in the final schema.`;
  }

  console.log(
    `Gemini request: ${GEMINI_MODEL}`
  );

  // Bilerek retry/fallback yapmıyoruz.
  //
  // Böylece bir 503 durumunda tek kullanıcı aksiyonu
  // günlük kotadan 6 request tüketmez.
  return callGemini(
    GEMINI_MODEL,
    fullPrompt
  );
}