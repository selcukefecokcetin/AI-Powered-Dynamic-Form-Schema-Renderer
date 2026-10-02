import React, { useState, useRef, useEffect } from 'react';
import {
  Palette, Sun, Moon, Layout, Sparkles, Check,
  RotateCcw, Layers, Eye, ChevronDown, Upload
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

export interface FormSchema {
  brandName?: string;
  formTitle: string;
  formSubtitle?: string;
  formDescription?: string;
  isMultiStep?: boolean;
  steps?: any[];
  fields?: any[];
  themeConfig?: ThemeConfig;
}

export interface ThemeConfiguratorProps {
  schema?: FormSchema;
  themeConfig?: ThemeConfig;
  onUpdateTheme?: (updatedTheme: ThemeConfig) => void;
  onChange?: (updatedTheme: ThemeConfig) => void;
  onReset?: () => void;
  isAppDarkMode?: boolean;
}

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  isDarkMode?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, isDarkMode = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-xl text-xs flex items-center justify-between transition-all duration-200 focus:outline-none focus:border-rose-500 cursor-pointer ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1.5 border rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden py-1 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white/95 border-slate-200 shadow-slate-200/80'
        }`}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/10 text-rose-500 font-semibold'
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PRESET_THEMES: Array<{ name: string; primary: string; accent: string; dark: boolean }> = [
  { name: 'Iceberg Magenta', primary: '#e11d48', accent: '#0f172a', dark: false },
  { name: 'Ocean Blue', primary: '#2563eb', accent: '#3b82f6', dark: true },
  { name: 'Emerald Forest', primary: '#059669', accent: '#10b981', dark: true },
  { name: 'Sunset Purple', primary: '#7c3aed', accent: '#f43f5e', dark: true },
  { name: 'Cyberpunk', primary: '#ec4899', accent: '#06b6d4', dark: true },
];

const RADIUS_OPTIONS: CustomSelectOption[] = [
  { value: 'none', label: 'None (0px)' },
  { value: 'sm', label: 'Small (sm)' },
  { value: 'md', label: 'Medium (md)' },
  { value: 'lg', label: 'Large (lg)' },
  { value: 'xl', label: 'Extra Large (xl)' },
  { value: '2xl', label: '2X Large (2xl)' },
  { value: '3xl', label: '3X Large (3xl)' },
];

const DENSITY_OPTIONS: CustomSelectOption[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal (Default)' },
  { value: 'spacious', label: 'Spacious' },
];

export const ThemeConfigurator: React.FC<ThemeConfiguratorProps> = ({
  schema,
  themeConfig: customThemeConfig,
  onUpdateTheme,
  onChange,
  onReset,
  isAppDarkMode = true
}) => {
  const activeTheme: ThemeConfig = customThemeConfig || schema?.themeConfig || {
    primaryColor: '#e11d48',
    accentColor: '#0f172a',
    borderRadius: 'xl',
    darkMode: true,
    density: 'normal',
    showLogo: true
  };

  const isFormDarkMode = activeTheme.darkMode !== false;

  const handlePropertyChange = (key: keyof ThemeConfig, value: any) => {
    const updated = {
      ...activeTheme,
      [key]: value,
    };
    if (onUpdateTheme) onUpdateTheme(updated);
    if (onChange) onChange(updated);
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      handlePropertyChange('logoUrl', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    const updated = {
      ...activeTheme,
      primaryColor: preset.primary,
      accentColor: preset.accent,
      darkMode: preset.dark
    };
    if (onUpdateTheme) onUpdateTheme(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className={`border rounded-3xl p-6 shadow-2xl space-y-6 font-sans backdrop-blur-xl transition-colors duration-200 ${
      isAppDarkMode 
        ? 'bg-slate-900 border-slate-800 text-white shadow-slate-900/20' 
        : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
    }`}>
      <div className={`flex items-center justify-between border-b pb-4 ${
        isAppDarkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold tracking-wide ${isAppDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Theme & Visual Customizer
            </h3>
            <p className={`text-[11px] ${isAppDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Customize form design, borders, and colors in real-time
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset to default theme"
            className={`p-2 rounded-xl transition border cursor-pointer ${
              isAppDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className={`text-xs font-semibold flex items-center gap-1.5 ${
          isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Preset Themes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRESET_THEMES.map((preset) => {
            const isActive = activeTheme.primaryColor === preset.primary;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition relative overflow-hidden flex flex-col gap-2 cursor-pointer ${
                  isActive
                    ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-500 shadow-lg shadow-rose-500/20'
                    : isAppDarkMode
                      ? 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: preset.primary }} />
                  <span className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: preset.accent }} />
                </div>
                <span className={`text-[10px] font-semibold truncate ${
                  isActive ? 'text-rose-400 font-bold' : isAppDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {preset.name}
                </span>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`border rounded-2xl p-3.5 space-y-2 ${
          isAppDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-medium flex items-center gap-1.5 ${
            isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <Palette className="w-3.5 h-3.5 text-rose-400" /> Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeTheme.primaryColor || '#e11d48'}
              onChange={(e) => handlePropertyChange('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={activeTheme.primaryColor || '#e11d48'}
              onChange={(e) => handlePropertyChange('primaryColor', e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-rose-500 ${
                isAppDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-200' 
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>

        <div className={`border rounded-2xl p-3.5 space-y-2 ${
          isAppDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-medium flex items-center gap-1.5 ${
            isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <Layers className="w-3.5 h-3.5 text-rose-400" /> Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeTheme.accentColor || '#0f172a'}
              onChange={(e) => handlePropertyChange('accentColor', e.target.value)}
              className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={activeTheme.accentColor || '#0f172a'}
              onChange={(e) => handlePropertyChange('accentColor', e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-rose-500 ${
                isAppDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-200' 
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${
            isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <Layout className="w-3.5 h-3.5 text-slate-400" /> Border Radius
          </label>
          <CustomSelect
            value={activeTheme.borderRadius || 'xl'}
            options={RADIUS_OPTIONS}
            onChange={(val) => handlePropertyChange('borderRadius', val)}
            isDarkMode={isAppDarkMode}
          />
        </div>

        <div className="space-y-2">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${
            isAppDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <Eye className="w-3.5 h-3.5 text-slate-400" /> Layout Density
          </label>
          <CustomSelect
            value={activeTheme.density || 'normal'}
            options={DENSITY_OPTIONS}
            onChange={(val) => handlePropertyChange('density', val as any)}
            isDarkMode={isAppDarkMode}
          />
        </div>
      </div>

      <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-4 ${
        isAppDarkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePropertyChange('darkMode', !isFormDarkMode)}
            className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-medium cursor-pointer ${
              isFormDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
            }`}
          >
            {isFormDarkMode ? (
              <>
                <Moon className="w-4 h-4 text-rose-400" /> Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" /> Light Mode
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${
            isAppDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={activeTheme.showLogo !== false}
              onChange={(e) => handlePropertyChange('showLogo', e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-4 h-4 rounded border peer-checked:bg-rose-500 peer-checked:border-rose-500 flex items-center justify-center transition-all ${
              isAppDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-100'
            }`}>
              <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            Display Brand Logo
          </label>

          {activeTheme.showLogo !== false && (
            <label className={`px-3 py-1.5 border rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition ${
              isAppDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}>
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};