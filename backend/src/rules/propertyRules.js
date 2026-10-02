function getAllFields(schema) {
  if (schema.isMultiStep) {
    return (schema.steps ?? []).flatMap(
      (step) => step.fields ?? []
    );
  }

  return schema.fields ?? [];
}

function ensureValidation(field) {
  if (!field.validation) {
    field.validation = {};
  }

  return field.validation;
}

function setMinimumIfNumber(
  field,
  minimum
) {
  if (
    !field ||
    field.type !== 'number'
  ) {
    return;
  }

  const validation =
    ensureValidation(field);

  if (validation.min === undefined) {
    validation.min = minimum;
  }
}

function findFieldByIds(
  fieldMap,
  possibleIds
) {
  for (const id of possibleIds) {
    const field =
      fieldMap.get(id);

    if (field) {
      return field;
    }
  }

  return undefined;
}

function addFeatureDependencies({
  fields,
  controller,
  prefixes,
}) {
  if (!controller) {
    return;
  }

  let expectedValue;

  // --------------------------------------------------
  // CHECKBOX CONTROLLER
  //
  // Example:
  // hasParking = true
  // --------------------------------------------------

  if (
    controller.type === 'checkbox'
  ) {
    expectedValue = true;
  }

  // --------------------------------------------------
  // RADIO / SELECT CONTROLLER
  //
  // Example:
  // hasParking = "Yes"
  // --------------------------------------------------

  else if (
    controller.type === 'radio' ||
    controller.type === 'select'
  ) {
    if (
      !controller.options?.includes(
        'Yes'
      )
    ) {
      return;
    }

    expectedValue = 'Yes';
  }

  // --------------------------------------------------
  // UNSUPPORTED CONTROLLER
  // --------------------------------------------------

  else {
    return;
  }

  // --------------------------------------------------
  // ADD DEPENDENCIES
  // --------------------------------------------------

  for (const field of fields) {
    // Controller kendisine bağımlı olamaz.
    if (
      field.id === controller.id
    ) {
      continue;
    }

    // AI zaten dependency ürettiyse
    // burada üzerine yazmıyoruz.
    //
    // Genel safety rules mevcut dependency'yi
    // ayrıca doğruluyor.
    if (field.dependsOn) {
      continue;
    }

    const fieldId =
      field.id.toLowerCase();

    const matchesFeature =
      prefixes.some(
        (prefix) =>
          fieldId.startsWith(
            prefix.toLowerCase()
          )
      );

    if (!matchesFeature) {
      continue;
    }

    field.dependsOn = {
      fieldId:
        controller.id,

      value:
        expectedValue,
    };
  }
}

export function applyPropertyRules(
  inputSchema
) {
  if (!inputSchema) {
    throw new Error(
      'applyPropertyRules received an empty schema.'
    );
  }

  // Orijinal schema'yı değiştirmiyoruz.
  const schema =
    structuredClone(inputSchema);

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

  // --------------------------------------------------
  // NUMERIC PROPERTY RULES
  // --------------------------------------------------

  // Bedrooms >= 0
  setMinimumIfNumber(
    fieldMap.get('bedrooms'),
    0
  );

  // Bathrooms >= 0
  setMinimumIfNumber(
    fieldMap.get('bathrooms'),
    0
  );

  // --------------------------------------------------
  // PRICE FIELD
  //
  // AI aynı kavram için farklı ID'ler
  // üretebildiği için olası isimleri destekliyoruz.
  // --------------------------------------------------

  const priceField =
    findFieldByIds(
      fieldMap,
      [
        'price',
        'askingPrice',
        'listingPrice',
        'salePrice',
        'rentPrice',
        'monthlyRent',
      ]
    );

  setMinimumIfNumber(
    priceField,
    0
  );

  // --------------------------------------------------
  // PARKING SPACES
  // --------------------------------------------------

  setMinimumIfNumber(
    fieldMap.get(
      'parkingSpaces'
    ),
    1
  );

  // --------------------------------------------------
  // FIND GARDEN CONTROLLER
  //
  // AI bazen:
  //
  // hasGarden
  //
  // bazen:
  //
  // garden
  //
  // üretebilir.
  // --------------------------------------------------

  const gardenController =
    findFieldByIds(
      fieldMap,
      [
        'hasGarden',
        'garden',
      ]
    );

  // --------------------------------------------------
  // FIND PARKING CONTROLLER
  //
  // AI bazen:
  //
  // hasParking
  //
  // bazen:
  //
  // parking
  //
  // üretebilir.
  // --------------------------------------------------

  const parkingController =
    findFieldByIds(
      fieldMap,
      [
        'hasParking',
        'parking',
      ]
    );

  // --------------------------------------------------
  // GARDEN DEPENDENCIES
  //
  // Desteklenen örnek field ID'leri:
  //
  // gardenType
  // gardenDetails
  // gardenSize
  // gardenDescription
  //
  // Controller checkbox ise:
  //
  // dependsOn.value = true
  //
  // Controller radio/select ise:
  //
  // dependsOn.value = "Yes"
  // --------------------------------------------------

  addFeatureDependencies({
    fields,

    controller:
      gardenController,

    prefixes: [
      'garden',
    ],
  });

  // --------------------------------------------------
  // PARKING DEPENDENCIES
  //
  // Desteklenen örnek field ID'leri:
  //
  // parkingType
  // parkingSpaces
  // parkingDetails
  //
  // Controller checkbox ise:
  //
  // dependsOn.value = true
  //
  // Controller radio/select ise:
  //
  // dependsOn.value = "Yes"
  // --------------------------------------------------

  addFeatureDependencies({
    fields,

    controller:
      parkingController,

    prefixes: [
      'parking',
    ],
  });

  // --------------------------------------------------
  // RETURN NORMALIZED PROPERTY SCHEMA
  // --------------------------------------------------

  return schema;
}