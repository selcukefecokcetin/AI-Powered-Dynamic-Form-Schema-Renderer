import React, { useEffect, useState } from 'react';
import { DynamicForm } from './DynamicForm';
import type { FormSchema } from './DynamicForm';
import { API_URL } from '../config/api';

interface PublicFormPageProps {
  token: string;
}

export const PublicFormPage: React.FC<PublicFormPageProps> = ({ token }) => {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublicForm = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/forms/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Form yüklenirken bir hata oluştu.');
        }

        // Backend'den gelen schema_json string ise parse et, nesne ise direkt al
        let rawSchema = data.schema_json || data.schema || data;

        if (typeof rawSchema === 'string') {
          try {
            rawSchema = JSON.parse(rawSchema);
          } catch (e) {
            console.error('Schema JSON parse hatası:', e);
          }
        }

        const loadedSchema: FormSchema = {
          brandName: rawSchema.brandName || '',
          formTitle: rawSchema.formTitle || 'Başlıksız Form',
          formSubtitle: rawSchema.formSubtitle || '',
          isMultiStep: Boolean(rawSchema.isMultiStep),
          steps: rawSchema.steps || [],
          fields: rawSchema.fields || [],
          themeConfig: rawSchema.themeConfig || {
            darkMode: true,
            primaryColor: '#e11d48',
            borderRadius: 'xl',
            density: 'normal',
          },
        };

        setSchema(loadedSchema);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Form yüklenemedi.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicForm();
  }, [token]);

  // --------------------------------------------------
  // DATE VALUE NORMALIZATION
  //
  // DynamicForm tarafındaki tarih seçici değeri:
  //
  // DD/MM/YYYY
  //
  // şeklinde üretebiliyor.
  //
  // Backend submission validator ise:
  //
  // YYYY-MM-DD
  //
  // formatını bekliyor.
  //
  // Bu fonksiyon yalnızca gerçekten "date" tipindeki
  // alanların değerlerini submit öncesinde dönüştürür.
  // --------------------------------------------------
  const normalizeDateFields = (
    formData: Record<string, any>
  ): Record<string, any> => {
    if (!schema) {
      return formData;
    }

    // Single-step ve multi-step formlardaki tüm field'ları
    // tek listede topluyoruz.
    const allFields = schema.isMultiStep
      ? schema.steps?.flatMap((step) => step.fields) || []
      : schema.fields || [];

    // Orijinal formData'yı değiştirmemek için kopyasını alıyoruz.
    const normalizedData: Record<string, any> = {
      ...formData,
    };

    allFields.forEach((field) => {
      // Sadece date tipindeki alanlara müdahale ediyoruz.
      if (field.type !== 'date') {
        return;
      }

      const value = normalizedData[field.id];

      if (typeof value !== 'string') {
        return;
      }

      // DD/MM/YYYY formatını yakala.
      const match = value.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

      if (!match) {
        // Değer zaten başka/geçerli bir formatta ise
        // hiçbir değişiklik yapma.
        return;
      }

      const [, day, month, year] = match;

      // Backend'in beklediği ISO tarih formatına çevir.
      normalizedData[field.id] =
        `${year}-${month}-${day}`;
    });

    return normalizedData;
  };

  const handlePublicSubmit = async (formData: Record<string, any>) => {
    try {
      // Submit öncesinde yalnızca date alanlarını
      // backend'in beklediği formata dönüştürüyoruz.
      const normalizedPayload = normalizeDateFields(formData);

      const response = await fetch(
        `${API_URL}/api/public/forms/${token}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          // Eski payload yapısını koruyoruz.
          // Sadece içindeki date değerleri normalize edildi.
          body: JSON.stringify({
            payload: normalizedPayload,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Yanıt kaydedilemedi.');
      }
    } catch (submitError) {
      console.error('Submit hatası:', submitError);

      alert(
        submitError instanceof Error
          ? submitError.message
          : 'Form gönderilirken bir hata oluştu.'
      );

      throw submitError;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">
            Form yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center max-w-md w-full shadow-xl">
          <p className="text-rose-400 font-medium text-sm">
            {error || 'Form bulunamadı.'}
          </p>
        </div>
      </div>
    );
  }

  const isDark = schema.themeConfig?.darkMode !== false;

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 transition-colors duration-300 ${
        isDark
          ? 'bg-[#090d16] text-slate-100'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between px-2 text-xs opacity-60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

            <span className="font-medium tracking-wide">
              Secure Form
            </span>
          </div>

          <span>256-Bit Encrypted Connection</span>
        </div>

        <DynamicForm
          schema={schema}
          onSchemaChange={() => {}}
          onSubmitComplete={handlePublicSubmit}
          isPreviewMode={true}
        />
      </div>
    </div>
  );
};