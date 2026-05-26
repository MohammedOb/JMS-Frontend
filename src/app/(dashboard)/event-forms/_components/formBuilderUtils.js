export const QUESTION_TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'number',   label: 'Number' },
  { value: 'date',     label: 'Date' },
  { value: 'yesno',    label: 'Yes / No' },
  { value: 'radio',    label: 'Multiple Choice' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
];

export const BRANCHING_TYPES = ['yesno', 'radio', 'select'];

export const needsOptions = (t) => ['radio', 'select', 'checkbox'].includes(t);

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
});
