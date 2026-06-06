// Shared utilities for mumin-search WhatsApp modals

export const PLACEHOLDERS = [
  { key: '{FullName}',   label: 'Member Name' },
  { key: '{AccNo}',      label: 'Account No.' },
  { key: '{Sector}',     label: 'Sector'      },
  { key: '{Mobile}',     label: 'Mobile'      },
  { key: '{SabeelType}', label: 'Sabeel Type' },
  { key: '{StayingIn}',  label: 'Staying In'  },
  { key: '{FMBStatus}',  label: 'FMB Status'  },
  { key: '{OrgName}',    label: 'Org Name'    },
];

/** Build template variable map from a normalised mumin-search row. */
export function rowVars(row, orgName = 'Shia Dawoodi Bohra Jamaat, Sagwara') {
  if (!row) return {};
  return {
    FullName:   row.name        || '—',
    AccNo:      row.accno       || '—',
    Sector:     row.sector      || '—',
    Mobile:     row.mobile      || '—',
    SabeelType: row.sabeelType  || '—',
    StayingIn:  row.stayingIn   || '—',
    FMBStatus:  row.thaliStatus || '—',
    OrgName:    orgName,
  };
}

/** Replace {Key} tokens in a template string with actual values. */
export function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? String(vars[key]) : match
  );
}
