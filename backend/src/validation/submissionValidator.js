function getAllFields(schema) {
  if (schema.isMultiStep) {
    return (schema.steps ?? [])
      .flatMap((step) => step.fields ?? []);
  }

  return schema.fields ?? [];
}

function hasValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return false;
  }

  if (
    typeof value === 'string' &&
    value.trim() === ''
  ) {
    return false;
  }

  if (
    Array.isArray(value) &&
    value.length === 0
  ) {
    return false;
  }

  return true;
}

function normalizeValue(field, rawValue) {
  if (rawValue === undefined) {
    return {
      valid: true,
      value: undefined,
    };
  }

  switch (field.type) {
    case 'number':
    case 'rating': {
      if (
        typeof rawValue === 'number' &&
        Number.isFinite(rawValue)
      ) {
        return {
          valid: true,
          value: rawValue,
        };
      }

      if (
        typeof rawValue === 'string' &&
        rawValue.trim() !== ''
      ) {
        const parsed =
          Number(rawValue);

        if (Number.isFinite(parsed)) {
          return {
            valid: true,
            value: parsed,
          };
        }
      }

      return {
        valid: false,
      };
    }

    case 'checkbox': {
      if (
        typeof rawValue === 'boolean'
      ) {
        return {
          valid: true,
          value: rawValue,
        };
      }

      if (rawValue === 'true') {
        return {
          valid: true,
          value: true,
        };
      }

      if (rawValue === 'false') {
        return {
          valid: true,
          value: false,
        };
      }

      return {
        valid: false,
      };
    }

case 'multiselect': {
  if (
    Array.isArray(rawValue) &&
    rawValue.every(
      (item) =>
        typeof item === 'string'
    )
  ) {
    return {
      valid: true,
      value: rawValue,
    };
  }

  return {
    valid: false,
  };
}

case 'radio': {
  // Frontend radio alanını multi-select olarak kullanabiliyor.
  if (field.multipleSelection === true) {
    if (
      Array.isArray(rawValue) &&
      rawValue.every(
        (item) =>
          typeof item === 'string'
      )
    ) {
      return {
        valid: true,
        value: rawValue,
      };
    }

    // Eski tekli defaultValue değerini de güvenli şekilde array'e çeviriyoruz.
    if (
      typeof rawValue === 'string' &&
      rawValue.trim() !== ''
    ) {
      return {
        valid: true,
        value: [rawValue],
      };
    }

    return {
      valid: false,
    };
  }

  if (typeof rawValue === 'string') {
    return {
      valid: true,
      value: rawValue,
    };
  }

  return {
    valid: false,
  };
}

case 'text':
case 'textarea':
case 'email':
case 'date':
case 'select': {
  if (
    typeof rawValue === 'string'
  ) {
    return {
      valid: true,
      value: rawValue,
    };
  }

  return {
    valid: false,
  };
}

case 'file': {
  // Frontend şu an gerçek dosya yüklemek yerine dosya adını gönderiyor.
  if (
    typeof rawValue === 'string' &&
    rawValue.trim() !== ''
  ) {
    return {
      valid: true,
      value: rawValue.trim(),
    };
  }

  return {
    valid: false,
  };
}

    case 'text':
    case 'textarea':
    case 'email':
    case 'date':
    case 'select':
    case 'radio': {
      if (
        typeof rawValue === 'string'
      ) {
        return {
          valid: true,
          value: rawValue,
        };
      }

      return {
        valid: false,
      };
    }

    case 'file': {
      return {
        valid: false,
      };
    }

    default:
      return {
        valid: false,
      };
  }
}

function normalizeForDependency(
  field,
  rawValue
) {
  const result =
    normalizeValue(
      field,
      rawValue
    );

  if (!result.valid) {
    return rawValue;
  }

  return result.value;
}

function isFieldVisible(
  field,
  fieldMap,
  payload
) {
  if (!field.dependsOn) {
    return true;
  }

  const controller =
    fieldMap.get(
      field.dependsOn.fieldId
    );

  if (!controller) {
    return false;
  }

  const controllerValue =
    normalizeForDependency(
      controller,
      payload[controller.id]
    );

// Multi-select controller içinde dependency değerini de kontrol ediyoruz.
if (Array.isArray(controllerValue)) {
  return controllerValue.includes(
    field.dependsOn.value
  );
}

return (
  controllerValue ===
  field.dependsOn.value
);
}

function getErrorMessage(
  field,
  fallback
) {
return (
  field.validation
    ?.errorMessage ??
  field.validation
    ?.customErrorMessage ??
  fallback
);
}

export function validateSubmissionPayload(
  schema,
  payload
) {
  const fields =
    getAllFields(schema);

  const fieldMap =
    new Map(
      fields.map(
        (field) => [
          field.id,
          field,
        ]
      )
    );

  const errors = [];
  const sanitizedPayload = {};

  for (const field of fields) {
    const visible =
      isFieldVisible(
        field,
        fieldMap,
        payload
      );

    // Hidden field cevaplarını
    // database'e kaydetmiyoruz.
    if (!visible) {
      continue;
    }

    const rawValue =
      payload[field.id];

    // Required kontrolü
    if (!hasValue(rawValue)) {
      if (field.required) {
        errors.push({
          fieldId:
            field.id,

          message:
            `${field.label} is required.`,
        });
      }

      continue;
    }

    const normalized =
      normalizeValue(
        field,
        rawValue
      );

    if (!normalized.valid) {
      errors.push({
        fieldId:
          field.id,

        message:
          `${field.label} has an invalid value.`,
      });

      continue;
    }

    const value =
      normalized.value;

    // Required checkbox:
    // örneğin Terms checkbox ise
    // true olması gerekir.
    if (
      field.type === 'checkbox' &&
      field.required &&
      value !== true
    ) {
      errors.push({
        fieldId:
          field.id,

        message:
          `${field.label} must be checked.`,
      });

      continue;
    }

// Select ve normal radio option kontrolü
if (
  (
    field.type === 'select' ||
    (
      field.type === 'radio' &&
      field.multipleSelection !== true
    )
  ) &&
  !field.options?.includes(value)
) {
  errors.push({
    fieldId:
      field.id,

    message:
      `${field.label} contains an invalid option.`,
  });

  continue;
}

// Multiselect ve multi-select radio option kontrolü
if (
  field.type === 'multiselect' ||
  (
    field.type === 'radio' &&
    field.multipleSelection === true
  )
) {
  const validOptions =
    field.options ?? [];

  const invalidOption =
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !validOptions.includes(item)
    );

  if (invalidOption) {
    errors.push({
      fieldId:
        field.id,

      message:
        `${field.label} contains an invalid option.`,
    });

    continue;
  }
}

    // Email kontrolü
    if (
      field.type === 'email'
    ) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(value)
      ) {
        errors.push({
          fieldId:
            field.id,

          message:
            getErrorMessage(
              field,
              `${field.label} must be a valid email address.`
            ),
        });

        continue;
      }
    }

    // Basit date kontrolü
    if (
      field.type === 'date' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      errors.push({
        fieldId:
          field.id,

        message:
          getErrorMessage(
            field,
            `${field.label} must be a valid date.`
          ),
      });

      continue;
    }

    const validation =
      field.validation;

    if (validation) {
      if (
        typeof value ===
          'string' &&
        validation.minLength !==
          undefined &&
        value.length <
          validation.minLength
      ) {
        errors.push({
          fieldId:
            field.id,

          message:
            getErrorMessage(
              field,
              `${field.label} is too short.`
            ),
        });

        continue;
      }

      if (
        typeof value ===
          'string' &&
        validation.maxLength !==
          undefined &&
        value.length >
          validation.maxLength
      ) {
        errors.push({
          fieldId:
            field.id,

          message:
            getErrorMessage(
              field,
              `${field.label} is too long.`
            ),
        });

        continue;
      }

      if (
        typeof value ===
          'number' &&
        validation.min !==
          undefined &&
        value <
          validation.min
      ) {
        errors.push({
          fieldId:
            field.id,

          message:
            getErrorMessage(
              field,
              `${field.label} is below the minimum value.`
            ),
        });

        continue;
      }

      if (
        typeof value ===
          'number' &&
        validation.max !==
          undefined &&
        value >
          validation.max
      ) {
        errors.push({
          fieldId:
            field.id,

          message:
            getErrorMessage(
              field,
              `${field.label} exceeds the maximum value.`
            ),
        });

        continue;
      }
    }

    sanitizedPayload[field.id] =
      value;
  }

  return {
    success:
      errors.length === 0,

    errors,

    payload:
      sanitizedPayload,
  };
}