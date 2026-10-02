import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Plus, Trash2, Edit3, Check, Upload, FileText, Mail,
  Sparkles, Code2, RefreshCw, Zap, Calendar as CalendarIcon,
  Layers, CheckSquare, CircleDot, ListFilter,
  Type, AlignLeft, Hash, ShieldCheck, Wrench, Sun, Moon, Star
} from 'lucide-react';

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  darkMode?: boolean;
  density?: 'compact' | 'normal' | 'spacious';
  showLogo?: boolean;
  logoUrl?: string;
}

export interface FormFieldValidation {
  pattern?: string;
  errorMessage?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'multiselect' | 'date' | 'file' | 'rating';
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
  options?: string[];
  gridSpan?: 'full' | 'half';
  icon?: string;
  autoPlusThreshold?: number;
  validation?: FormFieldValidation;
  dependsOn?: {
    fieldId: string;
    value: string | number | boolean;
  };
  multipleSelection?: boolean;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  brandName?: string;
  formTitle: string;
  formSubtitle?: string;
  isMultiStep?: boolean;
  steps?: FormStep[];
  fields?: FormField[];
  themeConfig?: ThemeConfig;
}

export interface DynamicFormProps {
  schema: FormSchema;
  onSchemaChange: (updatedSchema: FormSchema) => void;
  onSubmitComplete?: (
    formData: Record<string, any>
  ) => void | Promise<void>;
  onAiPromptSubmit?: (prompt: string) => Promise<void> | void;
  onReadyTemplateApply?: (
    schema: FormSchema,
    templateName: string
  ) => Promise<void> | void;
  isPreviewMode?: boolean;
  externalAiPrompt?: string;
}

interface ValidationTemplate {
  name: string;
  pattern: string;
  errorMessage: string;
  placeholder: string;
}

const PRESET_TEMPLATES: ValidationTemplate[] = [
  {
    name: 'UK Postal Code',
    pattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$',
    errorMessage: 'Please enter a valid UK postcode (e.g. SW1A 1AA or M1 1AE).',
    placeholder: 'SW1A 1AA'
  },
  {
    name: 'UK Phone Number',
    pattern: '^(?:(?:\\+44\\s?|0)(?:7\\d{3}|\\d{4})\\s?\\d{3}\\s?\\d{3})$',
    errorMessage: 'Please enter a valid UK phone number (e.g. +44 7911 123456 or 07911 123456).',
    placeholder: '07911 123456'
  },
  {
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    errorMessage: 'Please enter a valid email address.',
    placeholder: 'john.smith@example.co.uk'
  },
  {
    name: 'National Insurance (UK)',
    pattern: '^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}[0-9]{6}[A-D]{1}$',
    errorMessage: 'Please enter a valid UK National Insurance Number (e.g. QQ123456C).',
    placeholder: 'QQ123456C'
  },
  {
    name: 'Date (DD/MM/YYYY)',
    pattern: '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(19|20)\\d\\d$',
    errorMessage: 'Format must be DD/MM/YYYY.',
    placeholder: '31/12/1990'
  }
];

const READY_TEMPLATES: { name: string; schema: FormSchema }[] = [
  {
    name: 'UK Property Inquiry & Valuation',
    schema: {
      brandName: 'NEURON REALTY UK',
      formTitle: 'UK Real Estate Valuation & Inquiry',
      formSubtitle: 'Specify UK property criteria to receive accurate estimations.',
      isMultiStep: true,
      steps: [
        {
          id: 'step_1',
          title: 'Property Details',
          description: 'Basic information about the property type and size.',
          fields: [
            { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Detached', 'Semi-Detached', 'Terraced', 'Flat / Apartment', 'Bungalow'], required: true, gridSpan: 'half' },
            { id: 'roomCount', label: 'Bedrooms Count', type: 'select', options: ['1', '2', '3', '4', '5+'], required: true, gridSpan: 'half' },
            { id: 'tenure', label: 'Tenure Type', type: 'radio', options: ['Freehold', 'Leasehold', 'Shared Ownership'], required: true, gridSpan: 'full' },
            { id: 'budget', label: 'Budget Limit (£)', type: 'number', placeholder: 'e.g. 350000', gridSpan: 'full' }
          ]
        },
        {
          id: 'step_2',
          title: 'Contact & Location',
          description: 'Your details in the UK so our estate agent can reach out.',
          fields: [
            { id: 'postcode', label: 'UK Postal Code', type: 'text', placeholder: 'SW1A 1AA', required: true, gridSpan: 'half', validation: { pattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$', errorMessage: 'Valid UK postcode required' } },
            { id: 'city', label: 'City / Region', type: 'text', placeholder: 'e.g. London, Manchester, Bristol', required: true, gridSpan: 'half' },
            { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Smith', required: true, gridSpan: 'half' },
            { id: 'phone', label: 'UK Phone Number', type: 'text', placeholder: '07911 123456', required: true, gridSpan: 'half', validation: { pattern: '^(?:(?:\\+44\\s?|0)(?:7\\d{3}|\\d{4})\\s?\\d{3}\\s?\\d{3})$', errorMessage: 'Valid UK phone number required' } }
          ]
        }
      ]
    }
  },
  {
    name: 'UK Customer Satisfaction Survey',
    schema: {
      brandName: 'ICEBERG INSIGHTS UK',
      formTitle: 'Customer Feedback Survey',
      formSubtitle: 'Help us improve our services across the UK.',
      isMultiStep: false,
      fields: [
        { id: 'overallRating', label: 'Overall Experience Rating', type: 'rating', required: true, gridSpan: 'full' },
        { id: 'serviceQuality', label: 'How would you rate our support quality?', type: 'radio', options: ['Excellent', 'Good', 'Average', 'Poor'], required: true, gridSpan: 'full' },
        { id: 'featuresUsed', label: 'Which features do you use most frequently?', type: 'multiselect', options: ['Form Builder', 'AI Assistant', 'Analytics Dashboard', 'API Webhooks'], gridSpan: 'full' },
        { id: 'recommend', label: 'Would you recommend us to a colleague?', type: 'radio', options: ['Definitely', 'Maybe', 'No'], required: true, gridSpan: 'full' },
        { id: 'comments', label: 'Additional Feedback or Suggestions', type: 'textarea', placeholder: 'Share your thoughts with us...', gridSpan: 'full' }
      ]
    }
  }
];

const CustomSelect: React.FC<{
  id: string;
  value: string;
  placeholder?: string;
  options: string[];
  autoPlusThreshold?: number;
  isDark: boolean;
  dynamicClass: string;
  hasError: boolean;
  primaryColor: string;
  onChange: (val: string) => void;
  formatLabel: (opt: string, threshold?: number) => string;
}> = ({ id, value, placeholder, options, autoPlusThreshold, isDark, dynamicClass, hasError, primaryColor, onChange, formatLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value ? formatLabel(value, autoPlusThreshold) : (placeholder || 'Select option...');

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${dynamicClass} ${
          isDark 
            ? 'bg-slate-900/90 text-white border-slate-700 hover:border-slate-600' 
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
        } ${
          hasError 
            ? 'border-rose-500' 
            : isOpen 
            ? 'ring-2' 
            : ''
        }`}
        style={isOpen ? { borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } : {}}
      >
        <span className={!value ? 'text-slate-400' : ''}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'text-slate-400'}`} style={isOpen ? { color: primaryColor } : {}} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in-0 zoom-in-95 ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/80'
        }`}>
          {options.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 text-center">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={isSelected ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'font-bold'
                      : isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{formatLabel(opt, autoPlusThreshold)}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker: React.FC<{
  id: string;
  value: string;
  placeholder?: string;
  isDark: boolean;
  dynamicClass: string;
  hasError: boolean;
  primaryColor?: string;
  onChange: (val: string) => void;
}> = ({ id, value, placeholder, isDark, dynamicClass, hasError, primaryColor = '#e11d48', onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; positionStyle: 'top' | 'bottom' }>({ top: 0, left: 0, positionStyle: 'bottom' });
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parseDateString = (str: string) => {
    if (!str) return new Date();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [viewDate, setViewDate] = useState(() => parseDateString(value));

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 320; 
    const popoverWidth = 288;  
    
    const spaceBelow = window.innerHeight - rect.bottom;
    const openTop = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let leftPos = rect.left;
    if (leftPos + popoverWidth > window.innerWidth) {
      leftPos = Math.max(10, window.innerWidth - popoverWidth - 10);
    }

    setPopoverPos({
      top: openTop ? rect.top + window.scrollY - popoverHeight - 6 : rect.bottom + window.scrollY + 6,
      left: leftPos + window.scrollX,
      positionStyle: openTop ? 'top' : 'bottom'
    });
  };

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      const handleScrollOrResize = () => calculatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handlePrev = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    } else {
      setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    } else {
      setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
    }
  };

  const handleSelectDay = (day: number) => {
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${formattedDay}/${month}/${viewDate.getFullYear()}`;
    onChange(dateStr);
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('months');
  };

  const currentYear = viewDate.getFullYear();
  const yearStart = Math.floor(currentYear / 12) * 12;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${dynamicClass} ${
          isDark 
            ? 'bg-slate-900/90 text-white border-slate-700 hover:border-slate-600' 
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
        } ${
          hasError 
            ? 'border-rose-500' 
            : isOpen 
            ? 'ring-2' 
            : ''
        }`}
        style={isOpen ? { borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } : {}}
      >
        <span className={!value ? 'text-slate-400' : ''}>
          {value || placeholder || 'DD/MM/YYYY'}
        </span>
        <CalendarIcon className="w-4 h-4 transition-colors" style={isOpen ? { color: primaryColor } : { color: '#94a3b8' }} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 9999
          }}
          className={`p-4 w-72 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in-0 zoom-in-95 ${
            isDark 
              ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-slate-950/80' 
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-400/50'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={handlePrev} className={`p-1 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'days') setViewMode('months');
                else if (viewMode === 'months') setViewMode('years');
                else setViewMode('days');
              }}
              className={`text-xs font-bold tracking-wide px-2 py-1 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
            >
              {viewMode === 'days' && `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
              {viewMode === 'months' && `${viewDate.getFullYear()}`}
              {viewMode === 'years' && `${yearStart} - ${yearStart + 11}`}
            </button>
            <button type="button" onClick={handleNext} className={`p-1 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days View */}
          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {dayLabels.map((d) => (
                  <span key={d} className="text-[10px] font-semibold text-slate-500 py-1">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const monthStr = String(viewDate.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(day).padStart(2, '0');
                  const currentFormatted = `${dayStr}/${monthStr}/${viewDate.getFullYear()}`;
                  const isSelected = value === currentFormatted;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      style={isSelected ? { backgroundColor: primaryColor } : {}}
                      className={`h-7 w-7 text-xs font-medium rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        isSelected
                          ? 'text-white font-bold shadow-md scale-105'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Months View */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {shortMonthNames.map((mName, idx) => {
                const isSelected = viewDate.getMonth() === idx;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    style={isSelected ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                    className={`py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                      isSelected
                        ? 'font-bold shadow-md'
                        : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Years View */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {Array.from({ length: 12 }).map((_, idx) => {
                const yr = yearStart + idx;
                const isSelected = viewDate.getFullYear() === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleSelectYear(yr)}
                    style={isSelected ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                    className={`py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                      isSelected
                        ? 'font-bold shadow-md'
                        : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  schema, 
  onSchemaChange, 
  onSubmitComplete,
  onAiPromptSubmit,
  onReadyTemplateApply,
  isPreviewMode = false,
  externalAiPrompt = ''
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, { name: string; previewUrl?: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonInput, setJsonInput] = useState(JSON.stringify(schema, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [showControlTools, setShowControlTools] = useState(true);
  const [activeControlTab, setActiveControlTab] = useState<'quick' | 'steps' | 'ai' | 'header' | 'uk'>('quick');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const presetPrompts = [
    'Switch theme mode',
    'Add UK Postcode and Mobile Number validation',
    'Change density to compact view',
    'Convert to a 3-step UK application form'
  ];

  useEffect(() => {
    setJsonInput(JSON.stringify(schema, null, 2));
  }, [schema]);

  useEffect(() => {
    const allFields = schema.isMultiStep
      ? (schema.steps ?? []).flatMap((step) => step.fields)
      : schema.fields ?? [];

    setFormData((prevData) => {
      const nextData = { ...prevData };
      allFields.forEach((field) => {
        if (nextData[field.id] === undefined) {
          if (field.defaultValue !== undefined) {
            nextData[field.id] = field.defaultValue;
          } else if (field.type === 'checkbox') {
            nextData[field.id] = false;
          } else if (field.type === 'multiselect' || (field.type === 'radio' && field.multipleSelection)) {
            nextData[field.id] = [];
          } else {
            nextData[field.id] = '';
          }
        }
      });
      return nextData;
    });
  }, [schema]);

  useEffect(() => {
    if (externalAiPrompt && externalAiPrompt.trim() !== '') {
      handleAiSubmit(externalAiPrompt);
    }
  }, [externalAiPrompt]);

  const theme = schema.themeConfig || {};
  const isDark = theme.darkMode === true; 
  const primaryBtnColor = theme.primaryColor || '#e11d48';
  const density = theme.density || 'normal';

  const gridGapMap = {
    compact: 'gap-2 sm:gap-3',
    normal: 'gap-4',
    spacious: 'gap-6 sm:gap-8'
  };

  const inputPaddingMap = {
    compact: 'h-9 px-2.5 text-[11px] rounded-lg',
    normal: 'h-10 px-3.5 text-xs rounded-xl',
    spacious: 'h-12 px-4 text-sm rounded-2xl'
  };

  const radiusMap: Record<string, string> = {
    sm: 'rounded-md',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-[2rem]',
  };
  const containerRadius = radiusMap[theme.borderRadius || 'xl'] || 'rounded-3xl';

  const isMultiStep = Boolean(schema.isMultiStep && schema.steps && schema.steps.length > 0);
  const currentFields = isMultiStep 
    ? schema.steps![currentStepIndex]?.fields || [] 
    : schema.fields || [];

  const toggleThemeMode = () => {
    onSchemaChange({
      ...schema,
      themeConfig: {
        ...theme,
        darkMode: !isDark
      }
    });
  };

  const isFieldVisible = (field: FormField) => {
    if (!field.dependsOn) return true;

    const parentVal = formData[field.dependsOn.fieldId];

    if (Array.isArray(parentVal)) {
      return parentVal.includes(field.dependsOn.value);
    }

    return parentVal === field.dependsOn.value;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fieldId]: file.name }));
      setFilePreviews(prev => ({ ...prev, [fieldId]: { name: file.name } }));
      if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateCurrentFields = () => {
    const newErrors: Record<string, string> = {};

    currentFields.forEach(field => {
      if (!isFieldVisible(field)) return;

      const val = formData[field.id];
      const strVal = String(val ?? '').trim();

      if (field.required && (val === undefined || val === null || strVal === '' || (Array.isArray(val) && val.length === 0))) {
        newErrors[field.id] = `${field.label} is required.`;
        return;
      }

      if (strVal !== '') {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(strVal)) {
            newErrors[field.id] = 'Please enter a valid email address.';
            return;
          }
        }

        if (field.validation) {
          const { pattern, errorMessage, minLength, maxLength, min, max } = field.validation;

          if (pattern) {
            const regex = new RegExp(pattern);
            if (!regex.test(strVal)) {
              newErrors[field.id] = errorMessage || 'Invalid format.';
              return;
            }
          }

          if (minLength && strVal.length < minLength) {
            newErrors[field.id] = `Must be at least ${minLength} characters.`;
            return;
          }

          if (maxLength && strVal.length > maxLength) {
            newErrors[field.id] = `Must be at most ${maxLength} characters.`;
            return;
          }

          if (field.type === 'number') {
            const num = Number(val);
            if (min !== undefined && num < min) {
              newErrors[field.id] = `Minimum value is ${min}.`;
              return;
            }
            if (max !== undefined && num > max) {
              newErrors[field.id] = `Maximum value is ${max}.`;
              return;
            }
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!isPreviewMode) {
      if (schema.steps && currentStepIndex < schema.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
      return;
    }

    if (validateCurrentFields()) {
      if (schema.steps && currentStepIndex < schema.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMultiStep && schema.steps && currentStepIndex < schema.steps.length - 1) {
      handleNextStep();
      return;
    }

    if (isPreviewMode && !validateCurrentFields()) {
      return;
    }

    try {
      if (onSubmitComplete) {
        await onSubmitComplete(formData);
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleApplyJsonSchema = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onSchemaChange(parsed);
      setJsonError(null);
      setActiveTab('form');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format.');
    }
  };

  const handleAddTemplateField = (type: FormField['type']) => {
    const id = 'field' + Math.random().toString(36).substring(2, 7);
    let newField: FormField;

    switch (type) {
      case 'radio':
        newField = { id, label: 'Select Option (Radio)', type: 'radio', options: ['Option 1', 'Option 2', 'Option 3'], defaultValue: 'Option 1', required: true, gridSpan: 'full', multipleSelection: false };
        break;
      case 'select':
        newField = { id, label: 'Dropdown Select', type: 'select', options: ['Select Option A', 'Select Option B', 'Select Option C'], placeholder: 'Choose an option...', required: true, gridSpan: 'half' };
        break;
      case 'date':
        newField = { id, label: 'Calendar Date Selection', type: 'date', placeholder: 'DD/MM/YYYY', required: true, gridSpan: 'half' };
        break;
      case 'checkbox':
        newField = { id, label: 'I accept the terms & conditions', type: 'checkbox', defaultValue: false, required: true, gridSpan: 'full' };
        break;
      case 'textarea':
        newField = { id, label: 'Detailed Description', type: 'textarea', placeholder: 'Enter details...', required: false, gridSpan: 'full' };
        break;
      case 'number':
        newField = { id, label: 'Amount (£)', type: 'number', placeholder: '0', required: false, gridSpan: 'half' };
        break;
      case 'email':
        newField = { id, label: 'Email Address', type: 'email', placeholder: 'example@domain.co.uk', required: true, gridSpan: 'half' };
        break;
      default:
        newField = { id, label: 'Text Input', type: 'text', placeholder: 'Enter text...', required: false, gridSpan: 'full' };
        break;
    }

    if (isMultiStep && schema.steps && schema.steps.length > 0) {
      const updatedSteps = schema.steps.map((step, idx) => {
        if (idx === currentStepIndex) {
          return { ...step, fields: [...step.fields, newField] };
        }
        return step;
      });
      onSchemaChange({ ...schema, steps: updatedSteps });
    } else {
      const updatedFields = [...(schema.fields || []), newField];
      onSchemaChange({ ...schema, fields: updatedFields });
    }
  };

  const handleAddStep = () => {
    const newStepNum = (schema.steps?.length || 0) + 1;

    const newStep: FormStep = {
      id: 'step' + Math.random().toString(36).substring(2, 7),
      title: `Step ${newStepNum}: Details`,
      description: 'Fill in step details.',
      fields: [
        {
          id: 'field' + Math.random().toString(36).substring(2, 7),
          label: 'New Field',
          type: 'text',
          placeholder: 'Enter value...',
          required: false,
          gridSpan: 'full',
        },
      ],
    };

    const existingFields = schema.fields || [];

    if (!schema.isMultiStep && existingFields.length > 0) {
      const firstStep: FormStep = {
        id: 'step1',
        title: 'Step 1: General Info',
        fields: existingFields,
      };

      onSchemaChange({
        ...schema,
        isMultiStep: true,
        steps: [firstStep, newStep],
        fields: undefined,
      });
    } else {
      const updatedSteps = [...(schema.steps || []), newStep];
      onSchemaChange({
        ...schema,
        isMultiStep: true,
        steps: updatedSteps,
      });
    }
  };

  const handleRemoveStep = (stepIdx: number) => {
    if (!schema.steps || schema.steps.length <= 1) {
      onSchemaChange({
        ...schema,
        isMultiStep: false,
        steps: undefined,
        fields: schema.steps?.[0]?.fields || []
      });
      setCurrentStepIndex(0);
      return;
    }

    const updatedSteps = schema.steps.filter((_, idx) => idx !== stepIdx);
    onSchemaChange({ ...schema, steps: updatedSteps });
    if (currentStepIndex >= updatedSteps.length) {
      setCurrentStepIndex(updatedSteps.length - 1);
    }
  };

  const handleUpdateStepTitle = (stepIdx: number, newTitle: string) => {
    if (!schema.steps) return;
    const updatedSteps = schema.steps.map((s, idx) => idx === stepIdx ? { ...s, title: newTitle } : s);
    onSchemaChange({ ...schema, steps: updatedSteps });
  };

  const handleRemoveField = (fieldId: string) => {
    if (isMultiStep && schema.steps) {
      const updatedSteps = schema.steps.map((step, idx) => {
        if (idx === currentStepIndex) {
          return { ...step, fields: step.fields.filter(f => f.id !== fieldId) };
        }
        return step;
      });
      onSchemaChange({ ...schema, steps: updatedSteps });
    } else {
      const updatedFields = (schema.fields || []).filter(f => f.id !== fieldId);
      onSchemaChange({ ...schema, fields: updatedFields });
    }
  };

  const handleUpdateField = (fieldId: string, updatedProps: Partial<FormField>) => {
    if (isMultiStep && schema.steps) {
      const updatedSteps = schema.steps.map((step, idx) => {
        if (idx === currentStepIndex) {
          return {
            ...step,
            fields: step.fields.map(f => f.id === fieldId ? { ...f, ...updatedProps } : f)
          };
        }
        return step;
      });
      onSchemaChange({ ...schema, steps: updatedSteps });
    } else {
      const updatedFields = (schema.fields || []).map(f => f.id === fieldId ? { ...f, ...updatedProps } : f);
      onSchemaChange({ ...schema, fields: updatedFields });
    }
  };

  // Option modification helper handlers for Select/Radio/Multiselect
  const handleAddOption = (fieldId: string, currentOptions: string[] = []) => {
    const newOptionName = `Option ${currentOptions.length + 1}`;
    handleUpdateField(fieldId, { options: [...currentOptions, newOptionName] });
  };

  const handleUpdateOptionText = (fieldId: string, currentOptions: string[] = [], optionIndex: number, newText: string) => {
    const newOptions = [...currentOptions];
    newOptions[optionIndex] = newText;
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleRemoveOption = (fieldId: string, currentOptions: string[] = [], optionIndex: number) => {
    const newOptions = currentOptions.filter((_, idx) => idx !== optionIndex);
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleMoveFieldToStep = (fieldId: string, targetStepIdx: number) => {
    if (!schema.steps) return;

    let targetField: FormField | null = null;
    const updatedSteps = schema.steps.map((step, idx) => {
      if (idx === currentStepIndex) {
        targetField = step.fields.find(f => f.id === fieldId) || null;
        return { ...step, fields: step.fields.filter(f => f.id !== fieldId) };
      }
      return step;
    });

    if (targetField) {
      updatedSteps[targetStepIdx] = {
        ...updatedSteps[targetStepIdx],
        fields: [...updatedSteps[targetStepIdx].fields, targetField]
      };
      onSchemaChange({ ...schema, steps: updatedSteps });
    }
  };

  const handleApplyPresetTemplate = (fieldId: string, tpl: ValidationTemplate) => {
    handleUpdateField(fieldId, {
      placeholder: tpl.placeholder,
      validation: {
        pattern: tpl.pattern,
        errorMessage: tpl.errorMessage
      }
    });
  };

  const handleApplyReadyTemplate = async (
    tplSchema: FormSchema,
    templateName: string
  ) => {
    try {
      if (onReadyTemplateApply) {
        await onReadyTemplateApply(tplSchema, templateName);
      } else {
        onSchemaChange(tplSchema);
      }

      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Ready template apply failed:', error);
    }
  };

  const handleAiSubmit = async (promptText?: string) => {
    const targetPrompt = (promptText !== undefined ? promptText : aiPrompt).trim();
    if (!targetPrompt || isGenerating) return;

    setIsGenerating(true);
    try {
      if (onAiPromptSubmit) {
        await onAiPromptSubmit(targetPrompt);
      }
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatOptionLabel = (opt: string, threshold?: number) => {
    if (threshold === undefined) return opt;
    const numVal = Number(opt);
    if (!isNaN(numVal) && numVal >= threshold) {
      return `${opt}+`;
    }
    return opt;
  };

  if (submitted) {
    return (
      <div 
        id="dynamic-form-wrapper"
        className={`${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border ${containerRadius} p-8 text-center space-y-6 shadow-2xl transition-all duration-300 animate-in fade-in-0 zoom-in-95`}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner" style={{ backgroundColor: `${primaryBtnColor}15`, color: primaryBtnColor }}>
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Form Submitted Successfully!</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your response has been recorded.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setFormData({}); setCurrentStepIndex(0); }}
          style={{ backgroundColor: primaryBtnColor }}
          className="px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition hover:opacity-90 cursor-pointer"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <div 
      id="dynamic-form-wrapper" 
      className={`relative z-10 overflow-visible border ${containerRadius} p-4 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 backdrop-blur-xl ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800/80 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      
      {/* Drawer Controls */}
      {!isPreviewMode && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                <Zap className="w-3 h-3 text-rose-500" /> Iceberg Form Builder
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> UK Compliant
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={toggleThemeMode}
                title="Toggle Form Light / Dark Mode"
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="hidden sm:inline">{isDark ? 'Form Light Theme' : 'Form Dark Theme'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowControlTools(!showControlTools)}
                style={{ backgroundColor: primaryBtnColor }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Wrench className="w-4 h-4" />
                <span>Control Tools Panel</span>
                {showControlTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Tools Panel */}
          {showControlTools && (
            <div className={`p-4 rounded-2xl border shadow-xl space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200 ${
              isDark 
                ? 'bg-slate-950/90 border-slate-800 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveControlTab('quick')}
                  style={activeControlTab === 'quick' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeControlTab === 'quick' 
                      ? 'shadow-md' 
                      : isDark ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Add Fields
                </button>
                <button
                  type="button"
                  onClick={() => setActiveControlTab('steps')}
                  style={activeControlTab === 'steps' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeControlTab === 'steps' 
                      ? 'shadow-md' 
                      : isDark ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Steps Manager
                </button>
                <button
                  type="button"
                  onClick={() => setActiveControlTab('ai')}
                  style={activeControlTab === 'ai' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeControlTab === 'ai' 
                      ? 'shadow-md' 
                      : isDark ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Assistant
                </button>
                <button
                  type="button"
                  onClick={() => setActiveControlTab('header')}
                  style={activeControlTab === 'header' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeControlTab === 'header' 
                      ? 'shadow-md' 
                      : isDark ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Header
                </button>
                <button
                  type="button"
                  onClick={() => setActiveControlTab('uk')}
                  style={activeControlTab === 'uk' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeControlTab === 'uk' 
                      ? 'shadow-md' 
                      : isDark ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" /> UK Presets
                </button>
              </div>

              {/* Control Panel Tabs */}
              {activeControlTab === 'quick' && (
                <div className="space-y-2">
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Click a component to append it directly into <span className="font-semibold" style={{ color: primaryBtnColor }}>{isMultiStep ? `Step ${currentStepIndex + 1}` : 'Form'}</span>:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    <button type="button" onClick={() => handleAddTemplateField('text')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <Type className="w-4 h-4" style={{ color: primaryBtnColor }} /> Text Input
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('textarea')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <AlignLeft className="w-4 h-4 text-cyan-500" /> Text Area
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('select')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <ListFilter className="w-4 h-4 text-amber-500" /> Dropdown
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('radio')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <CircleDot className="w-4 h-4" style={{ color: primaryBtnColor }} /> Radio Group
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('date')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <CalendarIcon className="w-4 h-4 text-emerald-500" /> Date Picker
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('checkbox')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <CheckSquare className="w-4 h-4" style={{ color: primaryBtnColor }} /> Checkbox
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('number')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <Hash className="w-4 h-4 text-amber-500" /> Number
                    </button>
                    <button type="button" onClick={() => handleAddTemplateField('email')} className={`p-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'}`}>
                      <Mail className="w-4 h-4" style={{ color: primaryBtnColor }} /> Email Field
                    </button>
                  </div>
                </div>
              )}

              {activeControlTab === 'steps' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Multi-Step Form Configuration</span>
                    <button type="button" onClick={handleAddStep} style={{ backgroundColor: primaryBtnColor }} className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md hover:opacity-90">
                      <Plus className="w-3.5 h-3.5" /> Add Step
                    </button>
                  </div>
                  {schema.isMultiStep && schema.steps && schema.steps.length > 0 ? (
                    <div className="space-y-2">
                      {schema.steps.map((step, idx) => (
                        <div key={step.id || idx} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <span className="text-xs font-bold" style={{ color: primaryBtnColor }}>#{idx + 1}</span>
                          <input type="text" value={step.title} onChange={(e) => handleUpdateStepTitle(idx, e.target.value)} className={`flex-1 px-2 py-1 rounded text-xs border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
                          <button type="button" onClick={() => handleRemoveStep(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Currently in single-step mode. Click "Add Step" to enable multi-step flow.</p>
                  )}
                </div>
              )}

              {activeControlTab === 'ai' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Add UK Postcode and Mobile Number validation..." className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800 shadow-sm'}`} />
                    <button type="button" onClick={() => handleAiSubmit()} disabled={isGenerating || !aiPrompt.trim()} style={{ backgroundColor: primaryBtnColor }} className="px-4 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-md hover:opacity-90">
                      {isGenerating ? 'Generating...' : 'Prompt AI'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {presetPrompts.map((preset, idx) => (
                      <button key={idx} type="button" onClick={() => handleAiSubmit(preset)} className={`text-[10px] px-2.5 py-1 rounded-lg border cursor-pointer transition ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'}`}>
                        <Zap className="w-2.5 h-2.5 text-amber-500 inline mr-1" /> {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeControlTab === 'header' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Form Title</label>
                    <input type="text" value={schema.formTitle} onChange={(e) => onSchemaChange({ ...schema, formTitle: e.target.value })} className={`w-full px-3 py-1.5 rounded-xl border text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800 shadow-sm'}`} />
                  </div>
                  <div>
                    <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Form Subtitle</label>
                    <input type="text" value={schema.formSubtitle || ''} onChange={(e) => onSchemaChange({ ...schema, formSubtitle: e.target.value })} className={`w-full px-3 py-1.5 rounded-xl border text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800 shadow-sm'}`} />
                  </div>
                </div>
              )}

              {activeControlTab === 'uk' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {READY_TEMPLATES.map((tpl, i) => (
                    <button key={i} type="button" onClick={() => handleApplyReadyTemplate(tpl.schema, tpl.name)} className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'}`}>
                      <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{tpl.name}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tpl.schema.formSubtitle}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {!isPreviewMode && (
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              style={activeTab === 'form' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'form' 
                  ? 'shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              style={activeTab === 'json' ? { backgroundColor: primaryBtnColor, color: '#fff' } : {}}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'json' 
                  ? 'shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> JSON Schema
            </button>
          </div>
        </div>
      )}

      {/* Live JSON Editor */}
      {!isPreviewMode && activeTab === 'json' && (
        <div className="space-y-3 animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4" style={{ color: primaryBtnColor }} /> Live JSON Schema
            </h3>
            <button
              type="button"
              onClick={handleApplyJsonSchema}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Apply Changes
            </button>
          </div>
          <textarea
            rows={14}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className={`w-full font-mono text-xs p-3 rounded-xl border focus:outline-none resize-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-inner'
            }`}
          />
          {jsonError && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {jsonError}
            </p>
          )}
        </div>
      )}

      {/* Rendered Dynamic Form View */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3 flex-1 min-w-50">
              {theme.showLogo !== false && theme.logoUrl && (
                <img 
                  src={theme.logoUrl} 
                  alt="Brand Logo" 
                  className="h-8 w-auto object-contain rounded-lg" 
                />
              )}
              <div>
                {schema.brandName && (
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                    {schema.brandName}
                  </span>
                )}
                <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {schema.formTitle}
                </h1>
                {schema.formSubtitle && (
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {schema.formSubtitle}
                  </p>
                )}
              </div>
            </div>

            {isMultiStep && schema.steps && (
              <div className="flex items-center gap-1.5">
                {schema.steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex 
                        ? 'w-8' 
                        : 'w-2 opacity-40'
                    }`}
                    style={{ backgroundColor: idx === currentStepIndex ? primaryBtnColor : (isDark ? '#475569' : '#cbd5e1') }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGapMap[density]} items-start`}>
            {currentFields.map((field) => {
              if (!isFieldVisible(field)) return null;

              const isFullSpan = field.gridSpan === 'full' || field.type === 'textarea' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'rating';
              const spanClass = isFullSpan ? 'md:col-span-2' : 'md:col-span-1';
              const fieldError = errors[field.id];
              const isEditing = editingFieldId === field.id;

              return (
                <div key={field.id} className={`${spanClass} relative group transition-all duration-200 min-h-19 flex flex-col justify-start`}>
                  
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {field.label}
                      {field.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>

                    {!isPreviewMode && (
                      <div className="absolute top-0 right-0 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                          className={`p-1 rounded-lg text-[10px] flex items-center gap-1 border transition cursor-pointer ${
                            isEditing
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" /> Edit Field
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer bg-slate-800/20 border border-slate-700/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Field Quick Customizer Panel */}
                  {!isPreviewMode && isEditing && (
                    <div className={`p-3 rounded-2xl border mb-3 space-y-3 text-xs animate-in fade-in-0 duration-200 ${
                      isDark ? 'bg-slate-950 border-amber-500/30 text-slate-200' : 'bg-amber-50/50 border-amber-200 text-slate-800'
                    }`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Field Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* Required / Optional Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">Mandatory / Required Field:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateField(field.id, { required: !field.required })}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            field.required 
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                              : isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {field.required ? 'Required (Yes)' : 'Optional (No)'}
                        </button>
                      </div>

                      {/* Options Editor (Dropdown, Radio & Multiselect) */}
                      {(field.type === 'select' || field.type === 'radio' || field.type === 'multiselect') && (
                        <div className="space-y-2 border-t border-b border-slate-700/50 py-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] text-slate-400 font-semibold">Options List ({field.options?.length || 0})</label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(field.id, field.options)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition"
                            >
                              <Plus className="w-3 h-3" /> Add Option
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOptionText(field.id, field.options, optIdx, e.target.value)}
                                  className={`flex-1 px-2 py-1 rounded border text-xs ${
                                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                                  }`}
                                  placeholder={`Option ${optIdx + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(field.id, field.options, optIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer rounded hover:bg-rose-500/10"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Radio Group Multi-Select Toggle */}
                      {field.type === 'radio' && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span className="text-[10px] text-slate-400">Allow Multiple Selections:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newMulti = !field.multipleSelection;
                              handleUpdateField(field.id, { 
                                multipleSelection: newMulti,
                                defaultValue: newMulti ? [] : ''
                              });
                              setFormData(prev => ({ ...prev, [field.id]: newMulti ? [] : '' }));
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              field.multipleSelection 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {field.multipleSelection ? 'Multi-Select (Enabled)' : 'Single Select (Default)'}
                          </button>
                        </div>
                      )}

                      {/* Validation Templates */}
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">Quick UK Validation Rules:</span>
                        <div className="flex flex-wrap gap-1">
                          {PRESET_TEMPLATES.map((tpl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleApplyPresetTemplate(field.id, tpl)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border cursor-pointer transition ${
                                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              + {tpl.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Move Step Control */}
                      {isMultiStep && schema.steps && schema.steps.length > 1 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                          <span className="text-[10px] text-slate-400">Move Field to:</span>
                          {schema.steps.map((st, idx) => (
                            <button
                              key={st.id || idx}
                              type="button"
                              disabled={idx === currentStepIndex}
                              onClick={() => handleMoveFieldToStep(field.id, idx)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                            >
                              Step {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Field Input Components */}
                  {field.type === 'select' ? (
                    <CustomSelect
                      id={field.id}
                      value={formData[field.id] || ''}
                      placeholder={field.placeholder}
                      options={field.options || []}
                      autoPlusThreshold={field.autoPlusThreshold}
                      isDark={isDark}
                      dynamicClass={inputPaddingMap[density]}
                      hasError={!!fieldError}
                      primaryColor={primaryBtnColor}
                      onChange={(val) => handleInputChange(field.id, val)}
                      formatLabel={formatOptionLabel}
                    />
                  ) : field.type === 'date' ? (
                    <CustomDatePicker
                      id={field.id}
                      value={formData[field.id] || ''}
                      placeholder={field.placeholder}
                      isDark={isDark}
                      dynamicClass={inputPaddingMap[density]}
                      hasError={!!fieldError}
                      primaryColor={primaryBtnColor}
                      onChange={(val) => handleInputChange(field.id, val)}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={field.id}
                      rows={3}
                      value={formData[field.id] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full border focus:outline-none transition p-3 text-xs rounded-xl ${
                        isDark 
                          ? 'bg-slate-900/90 text-white border-slate-700 placeholder-slate-500' 
                          : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400'
                      } ${fieldError ? 'border-rose-500' : ''}`}
                    />
                  ) : field.type === 'radio' ? (
                    <div className="flex flex-wrap items-center gap-2 min-h-10">
                      {(field.options || []).map((option) => {
                        const isMulti = field.multipleSelection;
                        const currentVal = formData[field.id];
                        const isSelected = isMulti 
                          ? Array.isArray(currentVal) && currentVal.includes(option)
                          : currentVal === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              if (isMulti) {
                                const arr = Array.isArray(currentVal) ? [...currentVal] : [];
                                const idx = arr.indexOf(option);
                                if (idx > -1) arr.splice(idx, 1);
                                else arr.push(option);
                                handleInputChange(field.id, arr);
                              } else {
                                handleInputChange(field.id, option);
                              }
                            }}
                            style={isSelected ? { backgroundColor: `${primaryBtnColor}15`, borderColor: primaryBtnColor, color: primaryBtnColor } : {}}
                            className={`h-10 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'shadow-sm'
                                : isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-current' : 'border-slate-400'}`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </span>
                            {formatOptionLabel(option, field.autoPlusThreshold)}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div 
                      onClick={() => handleInputChange(field.id, !Boolean(formData[field.id]))}
                      className={`relative flex items-center gap-3.5 h-10 px-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                        Boolean(formData[field.id])
                          ? isDark 
                            ? 'bg-slate-800/80 border-slate-600 shadow-md' 
                            : 'bg-slate-50 border-slate-400 shadow-sm'
                          : isDark 
                            ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600' 
                            : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div 
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 ${
                          Boolean(formData[field.id])
                            ? 'text-white scale-105 shadow-sm'
                            : isDark ? 'border-slate-600 bg-slate-950/50' : 'border-slate-300 bg-slate-50'
                        }`}
                        style={Boolean(formData[field.id]) ? { backgroundColor: primaryBtnColor, borderColor: primaryBtnColor } : {}}
                      >
                        {Boolean(formData[field.id]) && <Check className="w-3 h-3 stroke-3" />}
                      </div>
                      <span className={`text-xs font-semibold select-none flex-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {field.label}
                        {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                      </span>
                    </div>
                  ) : field.type === 'rating' ? (
                    <div className="flex items-center gap-1.5 h-10">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = Number(formData[field.id] || 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleInputChange(field.id, star)}
                            className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="relative">
                      <input
                        type="file"
                        id={field.id}
                        onChange={(e) => handleFileChange(field.id, e)}
                        className="hidden"
                      />
                      <label
                        htmlFor={field.id}
                        className={`w-full h-10 border border-dashed rounded-xl px-3 flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition ${
                          isDark ? 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        <Upload className="w-4 h-4" style={{ color: primaryBtnColor }} />
                        {filePreviews[field.id]?.name || 'Choose file to upload...'}
                      </label>
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      id={field.id}
                      value={formData[field.id] !== undefined ? formData[field.id] : ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleInputChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full border focus:outline-none transition appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${inputPaddingMap[density]} ${
                        isDark 
                          ? 'bg-slate-900/90 text-white border-slate-700 placeholder-slate-500' 
                          : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400'
                      } ${fieldError ? 'border-rose-500' : ''}`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      value={formData[field.id] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full border focus:outline-none transition ${inputPaddingMap[density]} ${
                        isDark 
                          ? 'bg-slate-900/90 text-white border-slate-700 placeholder-slate-500' 
                          : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400'
                      } ${fieldError ? 'border-rose-500' : ''}`}
                    />
                  )}

                  {fieldError && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Action Controls */}
          <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {isMultiStep && currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : <div />}

            {isMultiStep && schema.steps && currentStepIndex < schema.steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                style={{ backgroundColor: primaryBtnColor }}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition hover:opacity-90 cursor-pointer flex items-center gap-1 ml-auto"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                style={{ backgroundColor: primaryBtnColor }}
                className="px-8 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition hover:opacity-90 cursor-pointer flex items-center gap-2 ml-auto"
              >
                <Check className="w-4 h-4" /> Submit Form Input
              </button>
            )}
          </div>
        </form>
      )}

    </div>
  );
};

export default DynamicForm;