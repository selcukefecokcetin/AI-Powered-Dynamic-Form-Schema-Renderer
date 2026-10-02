import React, { useState } from 'react';
import { Download, Upload, Send, FileSpreadsheet, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import type { FormSchema } from './DynamicForm';

export interface ExportWebhookCenterProps {
  schema: FormSchema;
  onImportSchema: (importedSchema: FormSchema) => void;
  submissions: Record<string, any>[];
  isAppDarkMode?: boolean;
}

export const ExportWebhookCenter: React.FC<ExportWebhookCenterProps> = ({
  schema,
  onImportSchema,
  submissions,
  isAppDarkMode = true,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Export JSON Schema
  const handleExportSchema = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schema, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(schema.formTitle || 'form').toLowerCase().replace(/\s+/g, '_')}_schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Import JSON Schema
  const handleImportSchema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.formTitle && (parsed.fields || parsed.steps)) {
          onImportSchema(parsed);
          alert('Form schema imported successfully!');
        } else {
          alert('Invalid schema format.');
        }
      } catch (err) {
        alert('Failed to read JSON file or invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Export Submissions as CSV
  const handleExportCSV = () => {
    if (!submissions || submissions.length === 0) {
      alert('No form submissions available to export.');
      return;
    }

    const allKeys = Array.from(
      new Set(submissions.flatMap((sub) => Object.keys(sub)))
    );

    const headers = allKeys.join(',');
    const rows = submissions.map((sub) =>
      allKeys
        .map((key) => {
          const val = sub[key];
          if (val === undefined || val === null) return '""';
          const formatted = Array.isArray(val) ? val.join('; ') : String(val);
          return `"${formatted.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'form_submissions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 4. Trigger Webhook
  const handleSendWebhook = async () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a valid Webhook URL.');
      return;
    }
    if (!submissions || submissions.length === 0) {
      alert('No active form submissions to send. Please submit the form first.');
      return;
    }

    setWebhookStatus('sending');
    setStatusMessage('');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          formTitle: schema.formTitle,
          submissions: submissions,
          lastSubmission: submissions[submissions.length - 1],
        }),
      });

      if (response.ok) {
        setWebhookStatus('success');
        setStatusMessage('Data successfully sent to the Webhook endpoint.');
      } else {
        setWebhookStatus('error');
        setStatusMessage(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setWebhookStatus('error');
      setStatusMessage(`Request failed: ${error.message || 'CORS or network error.'}`);
    }
  };

  return (
    <div className={`border rounded-3xl p-6 space-y-6 shadow-xl transition-colors duration-200 ${
      isAppDarkMode 
        ? 'bg-slate-900 border-slate-800 text-white shadow-slate-900/20' 
        : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
    }`}>
      <h3 className={`text-sm font-bold flex items-center gap-2 border-b pb-3 ${
        isAppDarkMode ? 'text-white border-slate-800' : 'text-slate-800 border-slate-200'
      }`}>
        <Code className="w-4 h-4 text-blue-400" /> Integration & Export Center
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schema Management */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isAppDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <h4 className={`text-xs font-semibold ${isAppDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Schema Management
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportSchema}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                isAppDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-blue-400" /> Export JSON Schema
            </button>
            <label className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              isAppDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import JSON Schema
              <input type="file" accept=".json" onChange={handleImportSchema} className="hidden" />
            </label>
          </div>
        </div>

        {/* Submissions Export */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isAppDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <h4 className={`text-xs font-semibold ${isAppDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Submissions Export ({submissions?.length || 0})
          </h4>
          <button
            onClick={handleExportCSV}
            disabled={!submissions || submissions.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
              submissions && submissions.length > 0
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 cursor-pointer'
                : isAppDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Download Submissions (CSV)
          </button>
        </div>
      </div>

      {/* Webhook Dispatcher */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${
          isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <Send className="w-3.5 h-3.5 text-indigo-400" /> Webhook Dispatcher
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://api.example.com/webhook"
            className={`flex-1 px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:border-blue-500 transition ${
              isAppDarkMode 
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
            }`}
          />
          <button
            onClick={handleSendWebhook}
            disabled={webhookStatus === 'sending'}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {webhookStatus === 'sending' ? 'Sending...' : 'Trigger Webhook'}
          </button>
        </div>

        {webhookStatus === 'success' && (
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> {statusMessage}
          </p>
        )}
        {webhookStatus === 'error' && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
};