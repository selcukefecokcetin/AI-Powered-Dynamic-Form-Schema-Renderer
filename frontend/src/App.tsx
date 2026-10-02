import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  Eye, 
  Edit3, 
  Table, 
  Share2, 
  Check, 
  Layers, 
  Download, 
  Search,
  Database,
  AlertTriangle,
  X,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { DynamicForm, type FormSchema, type ThemeConfig } from './components/DynamicForm';
import { ExportWebhookCenter } from './components/ExportWebhookCenter';
import { ThemeConfigurator } from './components/ThemeConfigurator';
import { API_URL } from './config/api';

export const App: React.FC = () => {
  const [schema, setSchema] = useState<FormSchema>({
    brandName: 'ICEBERG X UK',
    formTitle: 'Standalone Dynamic Form (UK)',
    formSubtitle: 'Fill in the information below to complete your submission.',
    isMultiStep: false,
    themeConfig: {
      primaryColor: '#e11d48',
      accentColor: '#06b6d4',
      borderRadius: 'xl',
      darkMode: true,
      density: 'normal',
      showLogo: true,
    },
    fields: [
      { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith', required: true, gridSpan: 'half' },
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john.smith@example.co.uk', required: true, gridSpan: 'half' },
      { id: 'postcode', label: 'UK Postal Code', type: 'text', placeholder: 'SW1A 1AA', required: true, gridSpan: 'half', validation: { pattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$', errorMessage: 'Please enter a valid UK postcode (e.g. SW1A 1AA)' } },
      { id: 'dob', label: 'Date of Birth', type: 'date', placeholder: 'DD/MM/YYYY', required: true, gridSpan: 'half' },
      { id: 'contactPref', label: 'Preferred Contact Method', type: 'radio', options: ['Email', 'Phone', 'SMS'], defaultValue: 'Email', gridSpan: 'full' },
      { id: 'rooms', label: 'Room Count', type: 'select', options: ['1', '2', '3', '4', '5', '6'], autoPlusThreshold: 5, gridSpan: 'full' }
    ]
  });

  const [submissions, setSubmissions] = useState<Record<string, any>[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'submissions'>('builder');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Shell dark mode state (Keeps application shell isolated from Form theme)
  const [isAppDarkMode, setIsAppDarkMode] = useState<boolean>(true);

  const [formId, setFormId] = useState<string | null>(() =>
    sessionStorage.getItem('activeFormId')
  );

  const [publicToken, setPublicToken] = useState<string | null>(() =>
    sessionStorage.getItem('activePublicToken')
  );
  const [lastPublishedFormId, setLastPublishedFormId] =
  useState<string | null>(() =>
    sessionStorage.getItem(
      'lastPublishedFormId'
    )
  );

  const [submissionSchema, setSubmissionSchema] =
  useState<FormSchema | null>(null);

  const schemaSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schemaSavePromiseRef =
  useRef<Promise<void> | null>(null);

const saveDraftSchema = async (
  targetFormId: string,
  schemaToSave: FormSchema
) => {
  const response = await fetch(
    `${API_URL}/api/forms/${targetFormId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schema: schemaToSave,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        'Draft form could not be updated.'
    );
  }
};
// --------------------------------------------------
// AI KULLANMADAN DRAFT OLUŞTURMA
//
// Amaç:
// Kullanıcının yeni bir form oluşturabilmesi için
// Gemini'nin çalışmasına bağımlı kalmıyoruz.
// Manuel form ve hazır template'ler doğrudan
// backend'de draft olarak kaydedilebilir.
// --------------------------------------------------

const createDraftFromSchema = async (
  schemaToSave: FormSchema,
  originalPrompt: string
) => {
  const response = await fetch(
    `${API_URL}/api/forms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalPrompt,
        schema: schemaToSave,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        'Draft form could not be created.'
    );
  }

  // Yeni draft artık aktif form oluyor.
  setFormId(data.id);
  setPublicToken(null);

  sessionStorage.setItem(
    'activeFormId',
    data.id
  );

  sessionStorage.removeItem(
    'activePublicToken'
  );

  return data;
};


// --------------------------------------------------
// HAZIR SCHEMA'YI DRAFT OLARAK UYGULAMA
//
// Aktif bir draft varsa onu günceller.
// Aktif form publish edilmişse eski published formun
// üzerine yazmak yerine yeni draft oluşturur.
// --------------------------------------------------

const applySchemaAsDraft = async (
  nextSchema: FormSchema,
  sourceLabel: string
) => {
  const schemaWithTheme: FormSchema = {
    ...nextSchema,

    // Template theme üretmiyorsa mevcut frontend
    // tasarım ayarlarını koruyoruz.
    themeConfig:
      nextSchema.themeConfig ||
      schema.themeConfig,
  };

  // Henüz publish edilmemiş aktif draft varsa
  // yeni kayıt açmak yerine onu güncelliyoruz.
  if (formId && !publicToken) {
    await saveDraftSchema(
      formId,
      schemaWithTheme
    );

    setSchema(schemaWithTheme);
    return;
  }

  // Form yoksa veya mevcut form publish edilmişse
  // bağımsız yeni bir draft oluşturuyoruz.
  await createDraftFromSchema(
    schemaWithTheme,
    sourceLabel
  );

  setSchema(schemaWithTheme);
};


// --------------------------------------------------
// YENİ MANUEL FORM
//
// Gemini çağrısı yapmadan kullanılabilir bir
// başlangıç draft'ı oluşturur.
// --------------------------------------------------

const handleCreateManualForm = async () => {
  const manualSchema: FormSchema = {
    brandName: 'ICEBERG X UK',

    formTitle: 'Untitled Form',

    formSubtitle:
      'Build this form manually using the control tools.',

    isMultiStep: false,

    // Mevcut tasarım korunuyor.
    themeConfig:
      schema.themeConfig,

    fields: [
      {
        id: 'fieldOne',
        label: 'New Field',
        type: 'text',
        placeholder: 'Enter a value...',
        required: false,
        gridSpan: 'full',
      },
    ],
  };

  try {
    await createDraftFromSchema(
      manualSchema,
      'Manual form'
    );

    setSchema(manualSchema);
    setActiveTab('builder');
    setIsPreviewMode(false);

    showNotification(
      'New manual draft created.'
    );
  } catch (error) {
    console.error(
      'Create manual form error:',
      error
    );

    showNotification(
      'Manual draft could not be created.'
    );
  }
};


// --------------------------------------------------
// READY TEMPLATE → BACKEND DRAFT
//
// Eskiden template yalnızca frontend state'ine
// uygulanıyordu.
// Artık gerçek backend draft kaydı da oluşturuluyor.
// Böylece template publish ve submit akışına katılabiliyor.
// --------------------------------------------------

const handleReadyTemplateApply = async (
  templateSchema: FormSchema,
  templateName: string
) => {
  try {
    await applySchemaAsDraft(
      templateSchema,
      `Ready template: ${templateName}`
    );

    showNotification(
      `${templateName} loaded as a draft.`
    );
  } catch (error) {
    console.error(
      'Apply ready template error:',
      error
    );

    showNotification(
      'Template could not be saved as a draft.'
    );
  }
};
  const quickPresetPrompts = [
    { title: 'UK Property Inquiry', prompt: 'Create a 2-step UK real estate appraisal form with UK postcode, property type radio, room count select, and inspection date.' },
    { title: 'Contact Us (UK)', prompt: 'Create a standard UK contact form with full name, UK phone number (+44), email, contact preference radio, and message.' },
    { title: 'Job Application', prompt: 'Create a multi-step job application form with applicant details, role selection radio, years of experience select, and resume upload.' },
    { title: 'Customer Feedback', prompt: 'Create a UK customer feedback survey with rating stars, support quality radio buttons, and feature multiselect.' }
  ];

  const showNotification = (msg: string) => {
    setNotification(msg);
  };

  useEffect(() => {
    return () => {
      if (schemaSaveTimeoutRef.current) {
        clearTimeout(schemaSaveTimeoutRef.current);
      }
    };
  }, []);

const handleSchemaChange = (
  updatedSchema: FormSchema
) => {
  setSchema(updatedSchema);

  if (!formId) return;

  if (schemaSaveTimeoutRef.current) {
    clearTimeout(
      schemaSaveTimeoutRef.current
    );
  }

  schemaSaveTimeoutRef.current =
    setTimeout(() => {
      schemaSaveTimeoutRef.current = null;

      // Son manuel değişikliğin backend kaydını takip ediyoruz.
      const savePromise =
        saveDraftSchema(
          formId,
          updatedSchema
        ).catch((error) => {
          console.error(
            'Manual form update error:',
            error
          );

          showNotification(
            'Failed to auto-save draft. Please check your connection or edit manually.'
          );
        });

      schemaSavePromiseRef.current =
        savePromise;

      savePromise.finally(() => {
        if (
          schemaSavePromiseRef.current ===
          savePromise
        ) {
          schemaSavePromiseRef.current =
            null;
        }
      });
    }, 500);
};

  useEffect(() => {
    const loadActiveForm = async () => {
      const storedFormId = sessionStorage.getItem('activeFormId');

      if (!storedFormId) return;

      try {
        const response = await fetch(`${API_URL}/api/forms/${storedFormId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Active form could not be loaded.');
        }

        setSchema((currentSchema) => ({
          ...data.schema_json,
          themeConfig: data.schema_json?.themeConfig || currentSchema.themeConfig,
        }));

        setFormId(data.id);

        if (data.public_token) {
          setPublicToken(data.public_token);
            sessionStorage.setItem(
            'activePublicToken',
            data.public_token
  );

  // Published forma ait submission'ları yeni draft açılsa bile kaybetmiyoruz.
          setLastPublishedFormId(data.id);
            sessionStorage.setItem(
            'lastPublishedFormId',
             data.id
  );
        } else {
          setPublicToken(null);
          sessionStorage.removeItem('activePublicToken');
        }
      } catch (error) {
        console.error('Load active form error:', error);
        sessionStorage.removeItem('activeFormId');
        sessionStorage.removeItem('activePublicToken');
        setFormId(null);
        setPublicToken(null);
      }
    };

    loadActiveForm();
  }, []);

  const handleFormSubmit = (data: Record<string, any>) => {
    const submissionWithMetadata = {
      _id: `sub_${Date.now()}`,
      _submittedAt: new Date().toLocaleString('en-GB'),
      ...data,
    };
    setSubmissions((prev) => [submissionWithMetadata, ...prev]);
    showNotification('Form response submitted successfully!');
  };

  const handleUpdateTheme = (updatedTheme: ThemeConfig) => {
    const updatedSchema: FormSchema = {
      ...schema,
      themeConfig: updatedTheme,
    };
    handleSchemaChange(updatedSchema);
  };

  const toggleAppDarkMode = () => {
    setIsAppDarkMode((prev) => !prev);
  };

 const handleOpenSubmissions = async () => {
  setActiveTab('submissions');

  try {
    // Bütün published formları alıyoruz; eski submission kayıtlarını da birlikte gösteriyoruz.
    const formsResponse = await fetch(
      `${API_URL}/api/forms`
    );

    const formsData =
      await formsResponse.json();

    if (!formsResponse.ok) {
      throw new Error(
        formsData?.error ||
          'Forms could not be loaded.'
      );
    }

    const publishedForms = (
      formsData.forms || []
    )
      .filter(
        (form: any) =>
          form.status === 'published'
      )
      .sort((a: any, b: any) => {
        if (
          a.id === lastPublishedFormId
        ) {
          return -1;
        }

        if (
          b.id === lastPublishedFormId
        ) {
          return 1;
        }

        return 0;
      });

    const submissionResponses =
      await Promise.all(
        publishedForms.map(
          async (form: any) => {
            const response = await fetch(
              `${API_URL}/api/forms/${form.id}/submissions`
            );

            if (!response.ok) {
              return null;
            }

            return response.json();
          }
        )
      );

    const validResponses =
      submissionResponses.filter(Boolean);

    // Farklı formların alanlarını mevcut submission tablosu için birleştiriyoruz.
    const fieldMap =
      new Map<string, any>();

    for (const result of validResponses) {
      const formSchema =
        result.form?.schema_json;

      if (!formSchema) {
        continue;
      }

      const fields =
        formSchema.isMultiStep &&
        formSchema.steps
          ? formSchema.steps.flatMap(
              (step: any) =>
                step.fields || []
            )
          : formSchema.fields || [];

      for (const field of fields) {
        if (!fieldMap.has(field.id)) {
          fieldMap.set(
            field.id,
            field
          );
        }
      }
    }

    const combinedSubmissions =
      validResponses
        .flatMap((result: any) =>
          (
            result.submissions || []
          ).map(
            (submission: any) => ({
              _id:
                submission.id,
              _submittedAt:
                new Date(
                  submission.submitted_at
                ).toLocaleString(
                  'en-GB'
                ),
              _submittedAtRaw:
                submission.submitted_at,
              ...submission.payload_json,
            })
          )
        )
        .sort(
          (a: any, b: any) =>
            new Date(
              b._submittedAtRaw
            ).getTime() -
            new Date(
              a._submittedAtRaw
            ).getTime()
        )
        .map(
          ({
            _submittedAtRaw,
            ...submission
          }: any) => submission
        );

    // Mevcut tablo yapısını değiştirmeden birleşik field listesini kullanıyoruz.
    if (fieldMap.size > 0) {
      setSubmissionSchema({
        ...schema,
        isMultiStep: false,
        fields:
          Array.from(
            fieldMap.values()
          ),
        steps: undefined,
      });
    } else {
      setSubmissionSchema(null);
    }

    setSubmissions(
      combinedSubmissions
    );
  } catch (error) {
    console.error(
      'Load submissions error:',
      error
    );

    showNotification(
      'Could not retrieve submissions from the server.'
    );
  }
};

  const handleCopyShareLink = async () => {
    try {
      if (!formId) {
  alert('Please generate a form first.');
  return;
}

// Draft publish edilmeden önce bekleyen son manuel değişikliği kesin olarak kaydediyoruz.
if (!publicToken) {
  if (schemaSaveTimeoutRef.current) {
    clearTimeout(
      schemaSaveTimeoutRef.current
    );

    schemaSaveTimeoutRef.current = null;
  }

  if (schemaSavePromiseRef.current) {
    await schemaSavePromiseRef.current;
  }

  await saveDraftSchema(
    formId,
    schema
  );
}

let token = publicToken;

      if (!token) {
        const publishResponse = await fetch(`${API_URL}/api/forms/${formId}/publish`, {
          method: 'POST',
        });

        const publishedForm = await publishResponse.json();

        if (!publishResponse.ok) {
          throw new Error(publishedForm?.error || 'Form could not be published.');
        }

        token = publishedForm.public_token;

        if (!token) {
          throw new Error('Backend did not return a public token.');
        }

        setPublicToken(token);
        sessionStorage.setItem('activePublicToken', token);
        // Submission'lar published form ID üzerinden takip edilecek.
        setLastPublishedFormId(
          publishedForm.id || formId
);

        sessionStorage.setItem(
         'lastPublishedFormId',
         publishedForm.id || formId
);
      }

      const shareUrl = `${window.location.origin}/form/${token}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Publish form error:', error);
      showNotification('Form link could not be generated. Please try again.');
    }
  };

  const executeAiPrompt = async (promptInput: string | { prompt?: string; text?: string; message?: string }) => {
    let rawPrompt = '';

    if (typeof promptInput === 'string') {
      rawPrompt = promptInput;
    } else if (promptInput && typeof promptInput === 'object') {
      rawPrompt = promptInput.prompt || promptInput.text || promptInput.message || '';
    }

    const prompt = rawPrompt.trim();
    if (!prompt || prompt.length < 3) {
      showNotification('Please enter a more descriptive prompt (at least 3 characters).');
      return;
    }

    const currentFormId = formId;
    const shouldCreateNewForm = !currentFormId || !!publicToken;
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/api/generate-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          ...(!shouldCreateNewForm ? { currentSchema: schema } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'AI Service Error');
      }

     const generatedSchema =
  data.schema || data;

const finalSchema: FormSchema = {
  ...generatedSchema,

  // AI themeConfig üretmediyse mevcut tasarım ayarlarını koruyoruz.
  themeConfig:
    generatedSchema.themeConfig ||
    schema.themeConfig,
};

// Backend'e de frontend'de kullanılan son schema'yı kaydediyoruz.
const generatedSchemaForBackend = {
  ...finalSchema,
};

      if (shouldCreateNewForm) {
        const saveResponse = await fetch(`${API_URL}/api/forms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPrompt: prompt,
            schema: generatedSchemaForBackend,
          }),
        });

        const savedForm = await saveResponse.json();

        if (!saveResponse.ok) {
          throw new Error(savedForm?.error || 'Generated form could not be saved.');
        }

        setFormId(savedForm.id);
        setPublicToken(null);
        sessionStorage.removeItem('activePublicToken');
        sessionStorage.setItem('activeFormId', savedForm.id);
      } else {
        const updateResponse = await fetch(`${API_URL}/api/forms/${currentFormId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema: generatedSchemaForBackend }),
        });

        if (!updateResponse.ok) {
          const saveResponse = await fetch(`${API_URL}/api/forms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalPrompt: prompt,
              schema: generatedSchemaForBackend,
            }),
          });

          const savedForm = await saveResponse.json();

          if (!saveResponse.ok) {
            throw new Error(savedForm?.error || 'Generated form could not be saved.');
          }

          setFormId(savedForm.id);
          setPublicToken(null);
          sessionStorage.removeItem('activePublicToken');
          sessionStorage.setItem('activeFormId', savedForm.id);
        }
      }

      setSchema(finalSchema);
      setAiPrompt('');
    } catch (error: any) {
      console.error('Generate form error:', error);
      showNotification(error?.message || 'AI service is temporarily unavailable. Please proceed by editing the form manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiPromptGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;
    await executeAiPrompt(aiPrompt);
  };

const schemaForSubmissions =
  submissionSchema || schema;

const submissionFields =
  schemaForSubmissions.isMultiStep &&
  schemaForSubmissions.steps
    ? schemaForSubmissions.steps.flatMap(
        (step) => step.fields
      )
    : schemaForSubmissions.fields || [];

  const filteredSubmissions = submissions.filter((sub) =>
    Object.values(sub).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const appPrimaryColor = '#e11d48';

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans antialiased selection:bg-rose-500 selection:text-white pb-20 transition-colors duration-500 ${
      isAppDarkMode ? 'bg-[#05070e] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background Canvas Animations */}
      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        .animate-grid {
          background-size: 40px 40px;
          background-image: ${
            isAppDarkMode
              ? 'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)'
          };
          animation: grid-move 4s linear infinite;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -inset-10 animate-grid opacity-60" />
        <div className={`absolute inset-0 ${
          isAppDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_20%,#05070e_90%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,transparent_20%,#f8fafc_90%)]'
        }`} />
      </div>

      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl text-amber-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{notification}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-amber-500/20 rounded-lg transition text-amber-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur-xl px-6 py-3.5 mb-8 transition-colors duration-300 ${
        isAppDarkMode ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-white/70'
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-rose-500/10 border border-slate-200 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <g fill="#0f172a">
                  <path d="M 36,24 L 46,30 L 36,36 L 26,30 Z M 26,32 L 34,37 L 34,48 L 26,42 Z M 38,37 L 46,32 L 46,42 L 38,48 Z" />
                  <path d="M 64,24 L 74,30 L 64,36 L 54,30 Z M 54,32 L 62,37 L 62,48 L 54,42 Z M 66,37 L 74,32 L 74,42 L 66,48 Z" />
                </g>
                <polygon points="48,46 54,50 48,54" fill={appPrimaryColor} />
              </svg>
            </div>
            <div>
              <span className={`font-bold text-sm tracking-widest block ${isAppDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                ICEBERG <span style={{ color: appPrimaryColor }} className="font-extrabold">X</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">AI Form SaaS Platform</span>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isAppDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('builder')}
              style={activeTab === 'builder' ? { backgroundColor: appPrimaryColor } : {}}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'builder'
                  ? 'text-white shadow-md'
                  : isAppDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Form Builder
            </button>
            <button
              onClick={handleOpenSubmissions}
              style={activeTab === 'submissions' ? { backgroundColor: appPrimaryColor } : {}}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer relative ${
                activeTab === 'submissions'
                  ? 'text-white shadow-md'
                  : isAppDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Submissions
              {submissions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAppDarkMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isAppDarkMode 
                  ? 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {isAppDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              {isAppDarkMode ? 'Light Shell' : 'Dark Shell'}
            </button>

            {activeTab === 'builder' && (
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  isPreviewMode
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isAppDarkMode 
                    ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700' 
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {isPreviewMode ? 'Edit Mode' : 'Live Preview'}
              </button>
            )}

            <button
              onClick={handleCopyShareLink}
              className={`flex items-center gap-2 px-3.5 py-1.5 border text-xs font-medium rounded-xl transition cursor-pointer ${
                isAppDarkMode 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' 
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" style={{ color: appPrimaryColor }} />}
              {copiedLink ? 'Copied!' : 'Share Form'}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-6">

        {activeTab === 'builder' && (
          <>
            {!isPreviewMode && (
              <div className={`border rounded-2xl p-4 shadow-xl backdrop-blur-xl transition-all duration-300 space-y-3 ${
                isAppDarkMode ? 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700' : 'bg-white/90 border-slate-200 hover:border-slate-300'
              }`}>
                <form onSubmit={handleAiPromptGenerate} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow" style={{ backgroundColor: `${appPrimaryColor}20`, color: appPrimaryColor }}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your form (e.g. 'UK Property Valuation Form' or 'UK Job Application')..."
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs focus:outline-none transition ${
                      isAppDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !aiPrompt.trim()}
                    style={{ backgroundColor: appPrimaryColor }}
                    className="w-full sm:w-auto px-6 py-2.5 hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow transition shrink-0 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Form'
                    )}
                  </button>
                </form>

                <div className={`flex flex-wrap items-center gap-2 pt-1 border-t ${isAppDarkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 text-slate-500">
                    <Zap className="w-3 h-3 text-amber-400" /> UK Preset Templates:
                  </span>
                  {/* 
                    AI çalışmasa bile kullanıcı yeni bir draft
                    oluşturabilsin diye manuel başlangıç butonu.
                    Mevcut tasarım class'larını kullanıyoruz.
                  */}
                  <button
                    type="button"
                    onClick={handleCreateManualForm}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      isAppDarkMode
                        ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    New Manual Form
                  </button>
                  {quickPresetPrompts.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeAiPrompt(preset.prompt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        isAppDarkMode ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="transition-all duration-300">
              <DynamicForm
                schema={schema}
                onSchemaChange={handleSchemaChange}
                onSubmitComplete={handleFormSubmit}
                onAiPromptSubmit={executeAiPrompt}
                isPreviewMode={isPreviewMode}
              />
            </div>

            {!isPreviewMode && (
              <div className="grid grid-cols-1 gap-6">
                <ThemeConfigurator
                  schema={schema}
                  onUpdateTheme={handleUpdateTheme}
                  isAppDarkMode={isAppDarkMode}
                />
                <ExportWebhookCenter
                  schema={schema}
                  onImportSchema={handleSchemaChange}
                  submissions={submissions}
                  isAppDarkMode={isAppDarkMode}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`border rounded-2xl p-4 flex items-center gap-4 ${isAppDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${appPrimaryColor}15`, borderColor: `${appPrimaryColor}30`, color: appPrimaryColor }}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-2xl font-bold block ${isAppDarkMode ? 'text-white' : 'text-slate-900'}`}>{submissions.length}</span>
                  <span className="text-xs text-slate-400">Total Submissions</span>
                </div>
              </div>

              <div className={`border rounded-2xl p-4 flex items-center gap-4 ${isAppDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-2xl font-bold block ${isAppDarkMode ? 'text-white' : 'text-slate-900'}`}>100%</span>
                  <span className="text-xs text-slate-400">Completion Rate</span>
                </div>
              </div>

              <div className={`border rounded-2xl p-4 flex items-center gap-4 ${isAppDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Active</span>
                  <span className="text-xs text-slate-400">Public Link Status</span>
                </div>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border p-4 rounded-2xl ${
              isAppDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none ${
                    isAppDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `submissions_uk_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                disabled={submissions.length === 0}
                className={`w-full sm:w-auto px-4 py-2 border rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isAppDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <Download className="w-3.5 h-3.5" style={{ color: appPrimaryColor }} />
                Export JSON
              </button>
            </div>

            <div className={`border rounded-2xl overflow-hidden shadow-2xl ${isAppDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Table className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs font-medium">No submission responses found.</p>
                  <p className="text-slate-500 text-[11px]">Fill out and submit the form in Form Builder tab to see responses here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${isAppDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <thead className={`uppercase tracking-wider text-[10px] border-b ${
                      isAppDarkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Submitted At (UK)</th>
                        {submissionFields.map((field) => (
                          <th key={field.id} className="py-3.5 px-4 font-semibold">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isAppDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {filteredSubmissions.map((submission, index) => (
                        <tr key={submission._id || index} className={isAppDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {submission._submittedAt}
                          </td>
                          {submissionFields.map((field) => (
                            <td key={field.id} className="py-3.5 px-4 whitespace-nowrap">
                              {submission[field.id] !== undefined
                                ? String(submission[field.id])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;