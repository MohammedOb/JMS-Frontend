/**
 * Single source of truth for all event form eligibility restrictions.
 *
 * Types:
 *   'select'            – single-value dropdown (stored in EligibilityRules JSON)
 *   'age-range'         – min/max number inputs  (stored in AgeMin / AgeMax DB columns)
 *   'multiselect-sector'  – multi-select tags     (stored in EligibilityRules JSON as array)
 *   'multiselect-mohalla' – multi-select tags     (stored in EligibilityRules JSON as array)
 *
 * To add a new restriction:
 *   Add one object below → UI and validation update automatically. No other changes needed.
 */

const calcAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth)) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() - birth.getMonth() < 0 ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

export const ELIGIBILITY_CONFIG = [
  {
    key: 'gender',
    type: 'select',
    label: 'Gender',
    options: ['Male', 'Female'],
    validate: (rules, m) => {
      if (!rules.gender) return null;
      return m.Gender !== rules.gender ? `This form is open for ${rules.gender} members only.` : null;
    },
  },
  {
    key: 'misaq',
    type: 'select',
    label: 'Misaq',
    options: ['Done', 'Not Done'],
    validate: (rules, m) => {
      if (!rules.misaq) return null;
      if (m.Misaq === rules.misaq) return null;
      return rules.misaq === 'Done'
        ? 'This form is open for members who have taken Misaq only.'
        : 'This form is open for members who have not yet taken Misaq (children) only.';
    },
  },
  {
    key: 'maritalStatus',
    type: 'select',
    label: 'Marital Status',
    options: ['Single', 'Engaged', 'Married', 'Widowed', 'Divorced'],
    validate: (rules, m) => {
      if (!rules.maritalStatus) return null;
      return m.Marital_Status !== rules.maritalStatus
        ? `This form is open for ${rules.maritalStatus} members only.`
        : null;
    },
  },
  {
    key: 'ageRange',
    type: 'age-range',
    label: 'Age Range',
    validate: (rules, m, form) => {
      const age = m.Age ?? calcAge(m?.DateOfBirth || m?.DOB);
      if (age === null) return null;
      if (form.AgeMin > 0 && age < form.AgeMin)
        return `This form is open for members aged ${form.AgeMin} and above.`;
      if (form.AgeMax > 0 && age > form.AgeMax)
        return `This form is open for members aged ${form.AgeMax} and below.`;
      return null;
    },
  },
  {
    key: 'sectors',
    type: 'multiselect-sector',
    label: 'Allowed Sectors',
    validate: (rules, m) => {
      if (!rules.sectors?.length) return null;
      return !rules.sectors.includes(m.Sector)
        ? `This form is open for members from: ${rules.sectors.join(', ')}.`
        : null;
    },
  },
  {
    key: 'subsectors',
    type: 'multiselect-mohalla',
    label: 'Allowed Mohalla',
    hint: 'filtered by selected sectors',
    validate: (rules, m) => {
      if (!rules.subsectors?.length) return null;
      const memberMohalla = [m.Subsector, m.MohallaDescription].filter(Boolean).join(' - ');
      return !rules.subsectors.includes(memberMohalla)
        ? `This form is open for members from: ${rules.subsectors.join(', ')}.`
        : null;
    },
  },
  {
    key: 'sabeeltype',
    type: 'select',
    label: 'Sabeel Type',
    options: ['Sabeel Regular', 'Sabeel Mutaveteen'],
    validate: (rules, m) => {
      if (!rules.sabeeltype) return null;
      return m.SabeelType !== rules.sabeeltype ? `This form is open for ${rules.sabeeltype} members only.` : null;
    },
  },

  // ── Template for any future single-value restriction: ───────────────────
  // {
  //   key: 'yourKey',              ← stored in EligibilityRules JSON
  //   type: 'select',
  //   label: 'Display Label',      ← shown in admin form builder
  //   options: ['A', 'B'],         ← dropdown choices
  //   validate: (rules, m, form) => {
  //     if (!rules.yourKey) return null;
  //     return m.YourMemberField !== rules.yourKey
  //       ? `Error message for blocked member.`
  //       : null;
  //   },
  // },
];
