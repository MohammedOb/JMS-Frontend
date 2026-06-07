export const QUESTION_TYPES = [
  // ── Basic ───────────────────────────────────────────────────────────────────
  { value: 'text',         label: 'Short Text'           },
  { value: 'textarea',     label: 'Paragraph'            },
  { value: 'number',       label: 'Number'               },
  { value: 'date',         label: 'Date'                 },
  // ── Choice ──────────────────────────────────────────────────────────────────
  { value: 'yesno',        label: 'Yes / No'             },
  { value: 'radio',        label: 'Multiple Choice'      },
  { value: 'select',       label: 'Dropdown'             },
  { value: 'checkbox',     label: 'Checkboxes'           },
  // ── Scale / rating ──────────────────────────────────────────────────────────
  { value: 'linearscale',  label: 'Linear Scale'         },
  { value: 'rating',       label: 'Rating (Stars)'       },
  // ── Grid ────────────────────────────────────────────────────────────────────
  { value: 'mcgrid',       label: 'Multiple-Choice Grid' },
  { value: 'tickboxgrid',  label: 'Tick Box Grid'        },
  // ── Upload ──────────────────────────────────────────────────────────────────
  { value: 'fileupload',   label: 'File Upload'          },
];

/** Types that support conditional branching */
export const BRANCHING_TYPES = ['yesno', 'radio', 'select'];

/** Types that render a flat option list in the builder */
export const needsOptions = (t) => ['radio', 'select', 'checkbox'].includes(t);

/** Types that need separate rows + columns grids in the builder */
export const needsGridOptions = (t) => ['mcgrid', 'tickboxgrid'].includes(t);

/**
 * Return the correct default Options value when a question type is first selected.
 * Array types stay arrays; structured types return plain objects.
 */
export const defaultOptions = (type) => {
  switch (type) {
    case 'radio':
    case 'select':
    case 'checkbox':    return ['Option 1', 'Option 2'];
    case 'linearscale': return { min: 1, max: 5, minLabel: '', maxLabel: '' };
    case 'rating':      return { max: 5 };
    case 'mcgrid':
    case 'tickboxgrid': return { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2'] };
    case 'fileupload':  return { accept: '', maxSizeMB: 5 };
    default:            return [];
  }
};

export const toLocalDateStr = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let _nextLocalId = 1;
export const nextLocalId = () => _nextLocalId++;

export const blankSection = (title = 'Section') => ({ localId: nextLocalId(), title, questions: [] });

export const blankQuestion = () => ({
  _key: nextLocalId(),
  BankID: null,
  SectionLocalId: null,
  QuestionText: '',
  QuestionType: 'text',
  Options: [],
  IsRequired: false,
  PerMember: false,
  ConditionalLogic: null,
});

export const blankForm = () => ({
  Title: '',
  Description: '',
  HeaderImage: '',
  EventName: '',
  EventDate: '',
  AgeMin: '',
  AgeMax: '',
  Status: 'draft',
  AfterSubmitMessage: '',
  ClosedMessage: '',
  EligibilityRules: null,
  AllowOutsideRegistration: 1,
  AllowFamilyRegistration: 0,
  RequireVerification: 1,
});
