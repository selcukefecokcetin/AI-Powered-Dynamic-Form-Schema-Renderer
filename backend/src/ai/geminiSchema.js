import { Type } from '@google/genai';

const fieldProperties = {
  id: {
    type: Type.STRING,
    description:
      'Unique field key. Must use camelCase and contain no spaces.',
  },

  label: {
    type: Type.STRING,
    description:
      'Human-readable field label.',
  },

  type: {
    type: Type.STRING,

    enum: [
      'text',
      'number',
      'select',
      'radio',
      'checkbox',
      'textarea',
      'email',
      'date',
      'file',
      'rating',
      'multiselect',
    ],

    description:
      'The input type used to render this field.',
  },

  placeholder: {
    type: Type.STRING,

    description:
      'Optional example or hint shown when the field is empty. A placeholder is not real user data.',
  },

  defaultValue: {
    anyOf: [
      {
        type: Type.STRING,
      },
      {
        type: Type.NUMBER,
      },
      {
        type: Type.BOOLEAN,
      },
    ],

    description:
      'A pre-filled value only when the user explicitly provided this information in the prompt. Never invent a default value.',
  },

  required: {
    type: Type.BOOLEAN,

    description:
      'Whether the user must complete this field.',
  },

  icon: {
    type: Type.STRING,

    description:
      'Optional icon identifier for the frontend.',
  },

  gridSpan: {
    type: Type.STRING,

    enum: [
      'half',
      'full',
    ],

    description:
      'Optional layout width hint.',
  },

  options: {
    type: Type.ARRAY,

    items: {
      type: Type.STRING,
    },

    description:
      'Selectable options. Use only for select, radio, or multiselect fields.',
  },

  validation: {
    type: Type.OBJECT,

    properties: {
      minLength: {
        type: Type.INTEGER,
      },

      maxLength: {
        type: Type.INTEGER,
      },

      min: {
        type: Type.NUMBER,
      },

      max: {
        type: Type.NUMBER,
      },

      pattern: {
        type: Type.STRING,
      },

      customErrorMessage: {
        type: Type.STRING,
      },
    },
  },

  dependsOn: {
    type: Type.OBJECT,

    properties: {
      fieldId: {
        type: Type.STRING,
      },

      value: {
  anyOf: [
    {
      type: Type.STRING,
    },
    {
      type: Type.NUMBER,
    },
    {
      type: Type.BOOLEAN,
    },
  ],

  description:
    'Value that activates the dependency. Use boolean true/false for checkbox controllers.',
},
    },

    required: [
      'fieldId',
      'value',
    ],
  },
};

export const geminiFormSchema = {
  type: Type.OBJECT,

  properties: {
    brandName: {
      type: Type.STRING,
    },

    formTitle: {
      type: Type.STRING,
    },

    formSubtitle: {
      type: Type.STRING,
    },

    infoBoxText: {
      type: Type.STRING,
    },

    isMultiStep: {
      type: Type.BOOLEAN,

      description:
        'True when the generated form should be rendered as a multi-step wizard. False for a single-page form.',
    },

    fields: {
      type: Type.ARRAY,

      description:
        'Fields for a single-page form when isMultiStep is false.',

      items: {
        type: Type.OBJECT,

        properties: fieldProperties,

        required: [
          'id',
          'label',
          'type',
          'required',
        ],
      },
    },

    steps: {
      type: Type.ARRAY,

      description:
        'Form steps when isMultiStep is true.',

      items: {
        type: Type.OBJECT,

        properties: {
          id: {
            type: Type.STRING,
          },

          title: {
            type: Type.STRING,
          },

          description: {
            type: Type.STRING,
          },

          fields: {
            type: Type.ARRAY,

            items: {
              type: Type.OBJECT,

              properties: fieldProperties,

              required: [
                'id',
                'label',
                'type',
                'required',
              ],
            },
          },
        },

        required: [
          'id',
          'title',
          'fields',
        ],
      },
    },
  },

  required: [
    'formTitle',
    'isMultiStep',
  ],
};