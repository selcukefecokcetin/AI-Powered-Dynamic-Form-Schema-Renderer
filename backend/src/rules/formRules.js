export class FormRuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormRuleError';
  }
}

const selectableFieldTypes = new Set([
  'select',
  'radio',
  'multiselect',
]);

const stringFieldTypes = new Set([
  'text',
  'textarea',
  'email',
  'date',
]);

function getAllFields(schema) {
  if (schema.isMultiStep) {
    return (schema.steps ?? []).flatMap(
      (step) => step.fields ?? []
    );
  }

  return schema.fields ?? [];
}

export function applyFormSafetyRules(inputSchema) {
  if (!inputSchema) {
    throw new FormRuleError(
      'Form schema is missing.'
    );
  }

  // AI çıktısının orijinal halini değiştirmiyoruz.
  const schema =
    structuredClone(inputSchema);

  // --------------------------------------------------
  // RULE 1:
  // isMultiStep ile gerçek schema yapısını eşleştir.
  // --------------------------------------------------

  const hasFields =
    Array.isArray(schema.fields) &&
    schema.fields.length > 0;

  const hasSteps =
    Array.isArray(schema.steps) &&
    schema.steps.length > 0;

  // AI single-page dedi ama sadece steps ürettiyse
  // multi-step olarak düzelt.
  if (
    schema.isMultiStep === false &&
    !hasFields &&
    hasSteps
  ) {
    schema.isMultiStep = true;
  }

  // AI multi-step dedi ama sadece fields ürettiyse
  // single-page olarak düzelt.
  if (
    schema.isMultiStep === true &&
    !hasSteps &&
    hasFields
  ) {
    schema.isMultiStep = false;
  }

  // Hiç kullanılabilir form alanı yoksa reddet.
  if (!hasFields && !hasSteps) {
    throw new FormRuleError(
      'Generated form contains no usable fields.'
    );
  }

  // Sadece kullanılacak yapıyı bırak.
  if (schema.isMultiStep) {
    delete schema.fields;
  } else {
    delete schema.steps;
  }

  const fields =
    getAllFields(schema);

  // --------------------------------------------------
  // RULE 2:
  // Toplam field sayısını sınırla.
  // --------------------------------------------------

  if (fields.length > 30) {
    throw new FormRuleError(
      'Form cannot contain more than 30 fields.'
    );
  }

  // --------------------------------------------------
  // RULE 3:
  // Field ID formatını ve duplicate ID'leri kontrol et.
  // --------------------------------------------------

  const seenFieldIds =
    new Set();

  const validIdPattern =
    /^[a-z][A-Za-z0-9]*$/;

  for (const field of fields) {
    if (
      !validIdPattern.test(field.id)
    ) {
      throw new FormRuleError(
        `Invalid field id: "${field.id}". Field IDs must use camelCase and contain no spaces.`
      );
    }

    if (
      seenFieldIds.has(field.id)
    ) {
      throw new FormRuleError(
        `Duplicate field id detected: "${field.id}".`
      );
    }

    seenFieldIds.add(field.id);
  }

  // --------------------------------------------------
  // RULE 4:
  // options kullanımını doğrula ve temizle.
  // --------------------------------------------------

  for (const field of fields) {
    const usesOptions =
      selectableFieldTypes.has(
        field.type
      );

    // text, number, checkbox vb. field'larda
    // options kullanılmamalı.
    if (!usesOptions) {
      delete field.options;
      continue;
    }

    // select/radio/multiselect options gerektirir.
    if (
      !field.options ||
      field.options.length === 0
    ) {
      throw new FormRuleError(
        `Field "${field.id}" requires at least one option.`
      );
    }

    // Trim + duplicate temizliği.
    field.options = [
      ...new Set(
        field.options
          .map((option) =>
            option.trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      field.options.length === 0
    ) {
      throw new FormRuleError(
        `Field "${field.id}" has no valid options.`
      );
    }
  }

  // --------------------------------------------------
  // RULE 5:
  // defaultValue type kontrolü.
  // --------------------------------------------------

  for (const field of fields) {
    if (
      field.defaultValue === undefined
    ) {
      continue;
    }

    // Number
    if (
      field.type === 'number' &&
      typeof field.defaultValue !==
        'number'
    ) {
      throw new FormRuleError(
        `Field "${field.id}" must use a numeric defaultValue.`
      );
    }

    // Rating
    if (
      field.type === 'rating' &&
      typeof field.defaultValue !==
        'number'
    ) {
      throw new FormRuleError(
        `Field "${field.id}" must use a numeric defaultValue.`
      );
    }

    // Checkbox
    if (
      field.type === 'checkbox' &&
      typeof field.defaultValue !==
        'boolean'
    ) {
      throw new FormRuleError(
        `Field "${field.id}" must use a boolean defaultValue.`
      );
    }

    // String tabanlı alanlar
    if (
      stringFieldTypes.has(
        field.type
      ) &&
      typeof field.defaultValue !==
        'string'
    ) {
      throw new FormRuleError(
        `Field "${field.id}" must use a string defaultValue.`
      );
    }

// Select / normal radio
if (
  (
    field.type === 'select' ||
    (
      field.type === 'radio' &&
      field.multipleSelection !== true
    )
  ) &&
  typeof field.defaultValue !==
    'string'
) {
  throw new FormRuleError(
    `Field "${field.id}" must use a string defaultValue.`
  );
}

// Multi-select radio
if (
  field.type === 'radio' &&
  field.multipleSelection === true &&
  (
    !Array.isArray(field.defaultValue) ||
    !field.defaultValue.every(
      (item) =>
        typeof item === 'string'
    )
  )
) {
  throw new FormRuleError(
    `Field "${field.id}" must use a string array defaultValue when multipleSelection is enabled.`
  );
}

    // Browser file input AI tarafından
    // pre-fill edilmemeli.
    if (field.type === 'file') {
      delete field.defaultValue;
    }

    // Şimdilik multiselect default array
    // desteklemiyoruz.
    if (
      field.type === 'multiselect'
    ) {
      delete field.defaultValue;
    }
  }

// --------------------------------------------------
// RULE 6:
// Select/radio defaultValue options içinde olmalı.
// --------------------------------------------------

for (const field of fields) {
  if (
    field.type !== 'select' &&
    field.type !== 'radio'
  ) {
    continue;
  }

  if (
    field.defaultValue === undefined
  ) {
    continue;
  }

  // Multi-select radio default değerlerini
  // mevcut options ile güvenli şekilde eşleştiriyoruz.
  if (
    field.type === 'radio' &&
    field.multipleSelection === true
  ) {
    const normalizedDefaults =
      field.defaultValue.map(
        (item) =>
          item.trim().toLowerCase()
      );

    field.defaultValue =
      field.options?.filter(
        (option) =>
          normalizedDefaults.includes(
            option.trim().toLowerCase()
          )
      ) ?? [];

    // Geçerli hiçbir default kalmadıysa
    // optional defaultValue alanını kaldırıyoruz.
    if (
      field.defaultValue.length === 0
    ) {
      delete field.defaultValue;
    }

    continue;
  }

  const normalizedDefaultValue =
    field.defaultValue
      .trim()
      .toLowerCase();

  const matchingOption =
    field.options?.find(
      (option) =>
        option
          .trim()
          .toLowerCase() ===
        normalizedDefaultValue
    );

  // Sadece yazım farkı varsa gerçek option değerini kullanıyoruz.
  if (matchingOption) {
    field.defaultValue =
      matchingOption;
    continue;
  }

  // Eşleşmeyen default formun tamamını geçersiz yapmamalı.
  delete field.defaultValue;
}
  // --------------------------------------------------
  // RULE 7:
  // Field tipi ile uyumsuz validation kurallarını
  // temizle.
  // --------------------------------------------------

  for (const field of fields) {
    if (!field.validation) {
      continue;
    }

    const validation =
      field.validation;

    // Number ve rating alanlarında
    // string validation anlamsızdır.
    if (
      field.type === 'number' ||
      field.type === 'rating'
    ) {
      delete validation.minLength;
      delete validation.maxLength;
      delete validation.pattern;
    }

    // String tabanlı alanlarda
    // numeric min/max kullanılmamalı.
    if (
      field.type === 'text' ||
      field.type === 'textarea' ||
      field.type === 'email' ||
      field.type === 'date'
    ) {
      delete validation.min;
      delete validation.max;
    }

    // Choice / checkbox / file alanlarında
    // şu an yalnızca customErrorMessage bırakıyoruz.
    if (
      field.type === 'select' ||
      field.type === 'radio' ||
      field.type === 'multiselect' ||
      field.type === 'checkbox' ||
      field.type === 'file'
    ) {
      delete validation.minLength;
      delete validation.maxLength;
      delete validation.min;
      delete validation.max;
      delete validation.pattern;
    }

    // Tamamen boş validation objesini kaldır.
    if (
      Object.keys(validation)
        .length === 0
    ) {
      delete field.validation;
    }
  }

  // --------------------------------------------------
  // RULE 8:
  // Validation min/max ilişkilerini doğrula.
  // --------------------------------------------------

  for (const field of fields) {
    const validation =
      field.validation;

    if (!validation) {
      continue;
    }

    if (
      validation.minLength !==
        undefined &&
      validation.maxLength !==
        undefined &&
      validation.minLength >
        validation.maxLength
    ) {
      throw new FormRuleError(
        `Field "${field.id}" has minLength greater than maxLength.`
      );
    }

    if (
      validation.min !== undefined &&
      validation.max !== undefined &&
      validation.min >
        validation.max
    ) {
      throw new FormRuleError(
        `Field "${field.id}" has min greater than max.`
      );
    }
  }

  // --------------------------------------------------
  // RULE 9:
  // dependsOn gerçek bir field'a bağlanmalı
  // ve dependency value controller tipiyle uyumlu olmalı.
  // --------------------------------------------------

  const fieldMap =
    new Map(
      fields.map((field) => [
        field.id,
        field,
      ])
    );

  for (const field of fields) {
    if (!field.dependsOn) {
      continue;
    }

    const controller =
      fieldMap.get(
        field.dependsOn.fieldId
      );

    // Controller mevcut olmalı.
    if (!controller) {
      throw new FormRuleError(
        `Field "${field.id}" depends on unknown field "${field.dependsOn.fieldId}".`
      );
    }

    // Field kendisine bağlı olamaz.
    if (
      controller.id === field.id
    ) {
      throw new FormRuleError(
        `Field "${field.id}" cannot depend on itself.`
      );
    }

    // ------------------------------------------------
    // CHECKBOX CONTROLLER
    // ------------------------------------------------

    if (
      controller.type === 'checkbox'
    ) {
      // AI bazen boolean yerine
      // "true" / "false" string üretiyor.
      if (
        field.dependsOn.value ===
        'true'
      ) {
        field.dependsOn.value =
          true;
      }

      if (
        field.dependsOn.value ===
        'false'
      ) {
        field.dependsOn.value =
          false;
      }

      if (
        typeof field.dependsOn.value !==
        'boolean'
      ) {
        throw new FormRuleError(
          `Dependency value for checkbox "${controller.id}" must be boolean.`
        );
      }

      continue;
    }

    // ------------------------------------------------
    // SELECT / RADIO CONTROLLER
    // ------------------------------------------------

    if (
      controller.type === 'select' ||
      controller.type === 'radio'
    ) {
      if (
        typeof field.dependsOn.value !==
        'string'
      ) {
        throw new FormRuleError(
          `Dependency value for "${controller.id}" must be a string.`
        );
      }

      if (
        !controller.options?.includes(
          field.dependsOn.value
        )
      ) {
        throw new FormRuleError(
          `Dependency value "${field.dependsOn.value}" does not exist in "${controller.id}" options.`
        );
      }

      continue;
    }

    // ------------------------------------------------
    // NUMBER / RATING CONTROLLER
    // ------------------------------------------------

    if (
      controller.type === 'number' ||
      controller.type === 'rating'
    ) {
      if (
        typeof field.dependsOn.value !==
        'number'
      ) {
        throw new FormRuleError(
          `Dependency value for "${controller.id}" must be numeric.`
        );
      }

      continue;
    }

    // ------------------------------------------------
    // STRING-BASED CONTROLLERS
    // ------------------------------------------------

    if (
      typeof field.dependsOn.value !==
      'string'
    ) {
      throw new FormRuleError(
        `Dependency value for "${controller.id}" must be a string.`
      );
    }
  }

  // --------------------------------------------------
  // RETURN SAFE SCHEMA
  // --------------------------------------------------

  return schema;
}