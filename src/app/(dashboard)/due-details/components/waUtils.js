// Shared utilities for WhatsApp due-reminder modals

export const PLACEHOLDERS = [
  { key: '{FullName}',   label: 'Member Name'    },
  { key: '{AccNo}',      label: 'Account No.'    },
  { key: '{ITSNo}',      label: 'ITS No.'        },
  { key: '{DueAmount}',  label: 'Due Amount'     },
  { key: '{TotalDue}',   label: 'Total Due'      },
  { key: '{Year}',       label: 'Year'           },
  { key: '{ForYear}',    label: 'For Year'       },
  { key: '{Sector}',     label: 'Sector'         },
  { key: '{Mobile}',     label: 'Mobile'         },
  { key: '{SabeelType}', label: 'Sabeel Type'    },
  { key: '{HubSubHead}', label: 'Hub Sub Head'   },
  { key: '{OrgName}',    label: 'Org Name'       },
];

/** Build template variable map from a normalised due-details row. */
export function rowVars(row) {
  if (!row) return {};
  const forYear = row.fromYear
    ? (row.toYear && row.toYear !== row.fromYear
        ? `${row.fromYear} - ${row.toYear}`
        : row.fromYear)
    : '—';
  const due = Number(row.remaining || 0);
  const fmtAmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  return {
    FullName:   row.fullName   || '—',
    AccNo:      row.accno      || '—',
    ITSNo:      row.itsNo      || '—',
    DueAmount:  fmtAmt(due),
    TotalDue:   fmtAmt(due),
    Year:       forYear,
    ForYear:    forYear,
    Sector:     row.sector     || '—',
    Mobile:     row.mobile     || '—',
    SabeelType: row.sabeelType || '—',
    HubSubHead: row.hubSubHead || '—',
    OrgName:    'Shia Dawoodi Bohra Jamaat, Sagwara',
  };
}

/** Replace {Key} tokens in a template string with actual values. */
export function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? String(vars[key]) : match
  );
}

export const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const STATUS_META = {
  queued:   { label: 'Waiting',  color: 'text-gray-500',  bg: 'bg-gray-100'  },
  typing:   { label: 'Typing…',  color: 'text-blue-500',  bg: 'bg-blue-50'   },
  sending:  { label: 'Sending…', color: 'text-blue-600',  bg: 'bg-blue-100'  },
  sent:     { label: 'Sent ✓',   color: 'text-green-700', bg: 'bg-green-100' },
  failed:   { label: 'Failed ✕', color: 'text-red-600',   bg: 'bg-red-100'   },
  skipped:  { label: 'Skipped',  color: 'text-gray-400',  bg: 'bg-gray-50'   },
  no_wa:    { label: 'No WA ⚠',  color: 'text-amber-600', bg: 'bg-amber-50'  },
};
