export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'multiselect' 
  | 'date' 
  | 'file' 
  | 'rating';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  options?: string[];
  gridSpan?: 'full' | 'half';
  icon?: string;
  autoPlusThreshold?: number;
  dependsOn?: {
    fieldId: string;
    value: string | number | boolean;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  darkMode?: boolean;
  density?: 'compact' | 'normal' | 'spacious';
  showLogo?: boolean;
  logoUrl?: string; // Eklenen dinamik logo alanı
}

export interface FormSchema {
  brandName?: string;
  formTitle: string;
  formSubtitle?: string;
  formDescription?: string;
  isMultiStep?: boolean;
  steps?: FormStep[];
  fields?: FormField[];
  themeConfig?: ThemeConfig;
}