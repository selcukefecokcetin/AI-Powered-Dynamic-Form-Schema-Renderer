import React, { useState } from 'react';
import { DynamicForm } from './DynamicForm';
import type { FormSchema } from './DynamicForm';
import { Code, Eye, Copy, Check, LayoutTemplate, Sliders } from 'lucide-react';

const PRESETS: Record<string, FormSchema> = {
  realEstate: {
    brandName: 'Neuron Real Estate',
    formTitle: 'Add New Listing',
    formSubtitle: 'Please fill in the property details completely.',
    themeConfig: { primaryColor: '#e11d48', darkMode: true, borderRadius: 'xl', density: 'normal' },
    fields: [
      { id: 'title', label: 'Listing Title', type: 'text', placeholder: 'e.g. Luxury 3+1 Apartment', required: true, gridSpan: 'full' },
      { id: 'price', label: 'Price ($)', type: 'number', placeholder: '250000', required: true, gridSpan: 'half' },
      { id: 'type', label: 'Property Type', type: 'select', options: ['Residential', 'Commercial', 'Land'], required: true, gridSpan: 'half' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter property details...', gridSpan: 'full' }
    ]
  },
  contact: {
    brandName: 'Customer Support',
    formTitle: 'Contact Us',
    formSubtitle: 'Fill out the form below to reach our team.',
    themeConfig: { primaryColor: '#2563eb', darkMode: true, borderRadius: 'lg', density: 'normal' },
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, gridSpan: 'half' },
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true, gridSpan: 'half' },
      { id: 'subject', label: 'Subject', type: 'text', placeholder: 'How can we help?', required: true, gridSpan: 'full' },
      { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Write your message here...', required: true, gridSpan: 'full' }
    ]
  }
};

export const FormBuilderPage: React.FC = () => {
  const [schema, setSchema] = useState<FormSchema>(PRESETS.realEstate);
  const [copied, setCopied] = useState(false);

  const handleAiPrompt = async (prompt: string) => {
    const p = prompt.toLowerCase();
    const updated = { ...schema };

    if (p.includes('phone') || p.includes('contact')) {
      const newField = { id: 'phone', label: 'Phone Number', type: 'text' as const, placeholder: '+1 (555) 000-0000', gridSpan: 'half' as const };
      updated.fields = [...(updated.fields || []), newField];
    } else if (p.includes('blue')) {
      updated.themeConfig = { ...updated.themeConfig, primaryColor: '#2563eb' };
    } else if (p.includes('light') || p.includes('white')) {
      updated.themeConfig = { ...updated.themeConfig, darkMode: false };
    } else if (p.includes('dark')) {
      updated.themeConfig = { ...updated.themeConfig, darkMode: true };
    } else {
      const newField = { id: 'field_' + Date.now(), label: prompt, type: 'text' as const, placeholder: 'Enter value...', gridSpan: 'full' as const };
      updated.fields = [...(updated.fields || []), newField];
    }

    setSchema(updated);
  };

  const setDensity = (density: 'compact' | 'normal' | 'spacious') => {
    setSchema(prev => ({
      ...prev,
      themeConfig: {
        ...prev.themeConfig,
        density
      }
    }));
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-white shadow-lg">
            F
          </div>
          <span className="font-bold text-sm tracking-wide">Dynamic Form Builder</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <Sliders className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-xs text-slate-400 mr-1">Density:</span>
            {(['compact', 'normal', 'spacious'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                  (schema.themeConfig?.density || 'normal') === d
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <LayoutTemplate className="w-3.5 h-3.5" /> Presets:
            </span>
            <button
              onClick={() => setSchema(PRESETS.realEstate)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Real Estate
            </button>
            <button
              onClick={() => setSchema(PRESETS.contact)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] w-full mx-auto">
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-500" /> Interactive Preview
            </h1>
          </div>

          <DynamicForm
            schema={schema}
            onSchemaChange={(newSchema) => setSchema(newSchema)}
            onAiPromptSubmit={handleAiPrompt}
            onSubmitComplete={(data) => console.log('Form Submit Data:', data)}
          />
        </section>

        <section className="lg:col-span-5 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" /> Live JSON Schema
            </h2>
            
            <button
              onClick={copyJson}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>

          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-auto max-h-[calc(100vh-200px)] shadow-inner text-emerald-400">
            <pre>{JSON.stringify(schema, null, 2)}</pre>
          </div>
        </section>
      </main>
    </div>
  );
};