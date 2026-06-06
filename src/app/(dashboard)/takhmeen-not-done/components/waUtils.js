// Shared utilities for WhatsApp takhmeen-reminder modals

export const PLACEHOLDERS = [
  { key: '{FullName}',   label: 'Member Name'  },
  { key: '{AccNo}',      label: 'Account No.'  },
  { key: '{ForYear}',    label: 'For Year'     },
  { key: '{Sector}',     label: 'Sector'       },
  { key: '{Mobile}',     label: 'Mobile'       },
  { key: '{SabeelType}', label: 'Sabeel Type'  },
  { key: '{HubSubHead}', label: 'Hub Sub Head' },
  { key: '{StayingIn}',  label: 'Staying In'   },
  { key: '{FMBStatus}',  label: 'FMB Status'   },
  { key: '{OrgName}',    label: 'Org Name'     },
];

/** Build template variable map from a normalised takhmeen-not-done row. */
export function rowVars(row, orgName = 'Shia Dawoodi Bohra Jamaat, Sagwara') {
  if (!row) return {};
  return {
    FullName:   row.fullName    || '—',
    AccNo:      row.accno       || '—',
    ForYear:    row.forYear     || '—',
    Sector:     row.sector      || '—',
    Mobile:     row.mobile      || '—',
    SabeelType: row.sabeelType  || '—',
    HubSubHead: row.hubSubHead  || '—',
    StayingIn:  row.stayingIn   || '—',
    FMBStatus:  row.thaaliStatus || '—',
    OrgName:    orgName,
  };
}

/** Replace {Key} tokens in a template string with actual values. */
export function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? String(vars[key]) : match
  );
}
