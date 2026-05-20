'use client';

import { useState } from 'react';

// ── HubSubHead → HubMainHead lookup (mirrors hubheadsdetails table) ───────────
// Rule: each HubSubHead belongs to exactly ONE HubMainHead (no duplicates across hubs)
// This is the source of truth for cascade. In production this is fetched at login.
const SUBHEAD_TO_HUB = {
  // Sabeel
  'Sabeel Regular':      'Sabeel',
  'Khushi Jaman (Full)': 'Sabeel',
  'Ghami Jaman (Full)':  'Sabeel',
  'Hajj':                'Sabeel',
  'Misaaq':              'Sabeel',
  'Nikah (Dulha)':       'Sabeel',
  'Nikah (Dulhan)':      'Sabeel',
  'Corpus':              'Sabeel',
  'Fakhri Hall':         'Sabeel',
  // FMB
  'FMB Regular':         'FMB',
  'FMB Hub':             'FMB',
  'FMB Laagat':          'FMB',
  'FMB Gas':             'FMB',
  'FMB MHZ':             'FMB',
  // Vajebaat
  'HIM':                 'Vajebaat',
  'Vajebaat':            'Vajebaat',
  'Taherabad Safar':     'Vajebaat',   // ID 1067 — Vajebaat, NOT Other
  'Shehrullah Niyaz':    'Vajebaat',   // ID 32   — Vajebaat, NOT Sabeel
  'Sila Fitra':          'Vajebaat',
  'Shehrullah Zabihat':  'Vajebaat',
  'Vajebaat House':      'Vajebaat',
  // Other
  'Ashara Niyaz':        'Other',
  'Qabrastan':           'Other',
  'Najwa Shukur':        'Other',
  'TNC':                 'Other',
  'ITS Card':            'Other',
  'Madrasa Hub':         'Other',
  'Niyaz':               'Other',
  'Security Guards':     'Other',
  // Rent
  'Jamaat Khana Small':  'Rent',
  'Kitchen (Cooking)':   'Rent',
  'Gas Cylinder':        'Rent',
  // Laagat
  'Mahurat':             'Laagat',
};

// Reverse: for display in the "hubheadsdetails" card
const HUB_TO_SUBHEADS = Object.entries(SUBHEAD_TO_HUB).reduce((acc, [sub, hub]) => {
  (acc[hub] = acc[hub] || []).push(sub); return acc;
}, {});

// ── Scope catalog (shown in Access Control → Scopes tab) ──────────────────────
const SCOPE_CATALOG = [
  // HubMainHead — 6 main head types
  { id: 1,  type: 'HubMainHead', value: 'Sabeel',             label: 'Sabeel'              },
  { id: 2,  type: 'HubMainHead', value: 'FMB',                label: 'FMB'                 },
  { id: 3,  type: 'HubMainHead', value: 'Vajebaat',           label: 'Vajebaat'            },
  { id: 4,  type: 'HubMainHead', value: 'Other',              label: 'Other'               },
  { id: 5,  type: 'HubMainHead', value: 'Rent',               label: 'Rent'                },
  { id: 6,  type: 'HubMainHead', value: 'Laagat',             label: 'Laagat'              },
  // HubSubHead — representative selection from real table
  { id: 10, type: 'HubSubHead',  value: 'Sabeel Regular',     label: 'Sabeel Regular'      },
  { id: 11, type: 'HubSubHead',  value: 'Nikah (Dulha)',      label: 'Nikah (Dulha)'       },
  { id: 12, type: 'HubSubHead',  value: 'FMB Regular',        label: 'FMB Regular'         },
  { id: 13, type: 'HubSubHead',  value: 'FMB Hub',            label: 'FMB Hub'             },
  { id: 14, type: 'HubSubHead',  value: 'HIM',                label: 'HIM'                 },
  { id: 15, type: 'HubSubHead',  value: 'Taherabad Safar',    label: 'Taherabad Safar'     },
  { id: 16, type: 'HubSubHead',  value: 'Shehrullah Niyaz',   label: 'Shehrullah Niyaz'    },
  { id: 17, type: 'HubSubHead',  value: 'Ashara Niyaz',       label: 'Ashara Niyaz'        },
  { id: 18, type: 'HubSubHead',  value: 'TNC',                label: 'TNC'                 },
  { id: 19, type: 'HubSubHead',  value: 'Jamaat Khana Small', label: 'Jamaat Khana Small'  },
  { id: 20, type: 'HubSubHead',  value: 'Mahurat',            label: 'Mahurat'             },
  // ForYear
  { id: 30, type: 'ForYear',     value: '1445',               label: '1445'                },
  { id: 31, type: 'ForYear',     value: '1446',               label: '1446'                },
  { id: 32, type: 'ForYear',     value: '1447',               label: '1447'                },
  { id: 33, type: 'ForYear',     value: '1448',               label: '1448'                },
  // CreatedBy
  { id: 40, type: 'createdBy',   value: '__self__',            label: 'Own Receipts Only'   },
];

// ── Mock receipt rows (hub+subHead must match SUBHEAD_TO_HUB) ────────────────
const MOCK_RECEIPTS = [
  { id: 1, no: '001', hub: 'Sabeel',   subHead: 'Sabeel Regular',     year: '1447', by: 'user_a', amt: 5000 },
  { id: 2, no: '002', hub: 'Sabeel',   subHead: 'Nikah (Dulha)',      year: '1447', by: 'user_b', amt: 3000 },
  { id: 3, no: '003', hub: 'FMB',      subHead: 'FMB Regular',        year: '1447', by: 'user_a', amt: 7500 },
  { id: 4, no: '004', hub: 'FMB',      subHead: 'FMB Hub',            year: '1446', by: 'user_b', amt: 2000 },
  { id: 5, no: '005', hub: 'Vajebaat', subHead: 'Taherabad Safar',    year: '1447', by: 'user_a', amt: 1500 },
  { id: 6, no: '006', hub: 'Vajebaat', subHead: 'HIM',                year: '1446', by: 'user_b', amt: 4000 },
  { id: 7, no: '007', hub: 'Vajebaat', subHead: 'Shehrullah Niyaz',   year: '1445', by: 'user_a', amt: 6000 },
  { id: 8, no: '008', hub: 'Other',    subHead: 'Ashara Niyaz',       year: '1447', by: 'user_b', amt: 8000 },
  { id: 9, no: '009', hub: 'Other',    subHead: 'TNC',                year: '1448', by: 'user_a', amt: 1200 },
  { id: 10,no: '010', hub: 'Rent',     subHead: 'Jamaat Khana Small', year: '1447', by: 'user_b', amt: 900  },
  { id: 11,no: '011', hub: 'Laagat',   subHead: 'Mahurat',            year: '1447', by: 'user_a', amt: 500  },
];

const ALL_HUBS     = ['Sabeel', 'FMB', 'Vajebaat', 'Other', 'Rent', 'Laagat'];
const ALL_YEARS    = ['1445', '1446', '1447', '1448'];
const ALL_SUBHEADS = Object.keys(SUBHEAD_TO_HUB);

const TYPE_COLOR = {
  HubMainHead: 'bg-blue-100   text-blue-700',
  HubSubHead:  'bg-purple-100 text-purple-700',
  ForYear:     'bg-green-100  text-green-700',
  createdBy:   'bg-orange-100 text-orange-700',
};
const HUB_COLOR = {
  Sabeel:   'bg-blue-100   text-blue-700',
  FMB:      'bg-green-100  text-green-700',
  Vajebaat: 'bg-teal-100   text-teal-700',
  Other:    'bg-gray-100   text-gray-600',
  Rent:     'bg-rose-100   text-rose-700',
  Laagat:   'bg-amber-100  text-amber-700',
};

const PRESETS = [
  { label: 'No scopes (sees all)',                       ids: []             },
  { label: 'FMB hub only',                               ids: [2]            },
  { label: 'Taherabad Safar → auto Vajebaat',            ids: [15]           },
  { label: 'Taherabad Safar + HIM → Vajebaat only',      ids: [14, 15]       },
  { label: 'Taherabad Safar + FMB Regular → Vaj+FMB',   ids: [12, 15]       },
  { label: 'FMB Regular + year 1447 + own receipts',     ids: [12, 32, 40]   },
];

function Badge({ text, color }) {
  return <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${color}`}>{text}</span>;
}
function StepBadge({ n, color }) {
  return (
    <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${color}`}>
      {n}
    </span>
  );
}

export default function ScopeDemoPage() {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggle = (id) =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const byType = SCOPE_CATALOG.reduce((acc, s) => {
    (acc[s.type] = acc[s.type] || []).push(s); return acc;
  }, {});

  // Raw scopes from admin's assignment
  const scopesObj = SCOPE_CATALOG
    .filter(s => selectedIds.includes(s.id))
    .reduce((acc, s) => { (acc[s.type] = acc[s.type] || []).push(s.value); return acc; }, {});

  // ── Cascade: derive HubMainHead from HubSubHead (1-to-1 lookup) ──────────────
  // Since each HubSubHead belongs to exactly ONE HubMainHead, the derived hub set is simply
  // { SUBHEAD_TO_HUB[sub] for each sub in scopesObj.HubSubHead }
  const derivedHubsFromSubHead = (() => {
    const subs = scopesObj.HubSubHead;
    if (!subs?.length) return null;
    return [...new Set(subs.map(sh => SUBHEAD_TO_HUB[sh]).filter(Boolean))];
  })();

  // Effective HubMainHead = union(explicit HubMainHead scope, derived from HubSubHead)
  const effectiveHubs = (() => {
    const explicit = scopesObj.HubMainHead?.length ? scopesObj.HubMainHead : null;
    if (!explicit && !derivedHubsFromSubHead) return null; // no restriction
    return [...new Set([...(explicit || []), ...(derivedHubsFromSubHead || [])])];
  })();

  // hasScope — HubMainHead uses effectiveHubs (cascade-aware)
  const hasScope = (type, value) => {
    if (type === 'HubMainHead') {
      if (!effectiveHubs) return true;
      return effectiveHubs.map(v => v.toLowerCase()).includes(value.toLowerCase());
    }
    const vals = scopesObj[type];
    if (!Array.isArray(vals) || vals.length === 0) return true;
    return vals.map(v => v.toLowerCase()).includes(value.toLowerCase());
  };

  const visibleRows = MOCK_RECEIPTS.filter(r => {
    if (!hasScope('HubMainHead', r.hub))     return false;
    if (!hasScope('HubSubHead',  r.subHead)) return false;
    if (!hasScope('ForYear',     r.year))    return false;
    if (scopesObj.createdBy?.includes('__self__') && r.by !== 'user_a') return false;
    return true;
  });

  // Dropdown options (scope-filtered, HubMainHead uses effectiveHubs for cascade)
  const hubOptions = effectiveHubs
    ? ALL_HUBS.filter(h => effectiveHubs.map(v => v.toLowerCase()).includes(h.toLowerCase()))
    : ALL_HUBS;
  const subHeadOptions = scopesObj.HubSubHead?.length
    ? ALL_SUBHEADS.filter(s => scopesObj.HubSubHead.includes(s))
    : ALL_SUBHEADS;
  const yearOptions = scopesObj.ForYear?.length
    ? ALL_YEARS.filter(y => scopesObj.ForYear.includes(y))
    : ALL_YEARS;

  const hubIsDerived        = !scopesObj.HubMainHead?.length && !!derivedHubsFromSubHead;
  const hubIsRestricted     = !!effectiveHubs;
  const subHeadIsRestricted = !!scopesObj.HubSubHead?.length;
  const yearIsRestricted    = !!scopesObj.ForYear?.length;

  // JWT shows effective (cascade-computed) HubMainHead
  const jwtScopesDisplay = {
    ...(effectiveHubs                ? { HubMainHead: effectiveHubs.map(v => v.toLowerCase()) } : {}),
    ...(scopesObj.HubSubHead?.length ? { HubSubHead:  scopesObj.HubSubHead   } : {}),
    ...(scopesObj.ForYear?.length    ? { ForYear:     scopesObj.ForYear      } : {}),
    ...(scopesObj.createdBy?.length  ? { createdBy:   scopesObj.createdBy    } : {}),
  };
  const jwtStr = JSON.stringify(
    Object.keys(jwtScopesDisplay).length ? jwtScopesDisplay : {},
    null, 2
  ).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n');

  const hubChecks = ['Sabeel', 'FMB', 'Vajebaat', 'Other', 'Rent', 'Laagat'];

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
        <h1 className="text-[18px] font-bold">Data Scope — Visual Demo (Real Data + Cascade)</h1>
        <p className="text-blue-200 text-[12.5px] mt-1">
          Since each SubHead belongs to exactly <strong className="text-white">one HubMainHead</strong>,
          assigning a SubHead scope automatically derives the correct hub — no manual hub assignment needed.
        </p>
      </div>

      {/* Cascade rule callout */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-[12px] text-amber-900">
        <div className="font-bold mb-2">⚡ 1-to-1 Cascade Rule (from your hubheadsdetails table)</div>
        <div className="grid grid-cols-3 gap-3 text-[11.5px]">
          <div className="bg-white border border-amber-200 rounded p-2">
            <div className="font-semibold text-amber-800 mb-1">Assign subHead only →</div>
            <div>Taherabad Safar → hub = <strong>Vajebaat</strong></div>
            <div>HIM → hub = <strong>Vajebaat</strong></div>
            <div>FMB Regular → hub = <strong>FMB</strong></div>
            <div>Ashara Niyaz → hub = <strong>Other</strong></div>
          </div>
          <div className="bg-white border border-amber-200 rounded p-2">
            <div className="font-semibold text-amber-800 mb-1">Multiple subHeads →</div>
            <div>Taherabad Safar + FMB Regular</div>
            <div>→ hub = <strong>Vajebaat + FMB</strong></div>
            <div className="mt-1 text-gray-500">Union of all derived hubs</div>
          </div>
          <div className="bg-white border border-amber-200 rounded p-2">
            <div className="font-semibold text-amber-800 mb-1">Result →</div>
            <div>Hub dropdown only shows derived hubs</div>
            <div>User cannot see data of other hubs</div>
            <div>Even if they try to filter by another hub</div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-gray-500 font-medium">Presets:</span>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setSelectedIds(p.ids)}
            className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
              JSON.stringify([...p.ids].sort()) === JSON.stringify([...selectedIds].sort())
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}>{p.label}
          </button>
        ))}
      </div>

      {/* hubheadsdetails relationship */}
      <div className="card">
        <div className="card-header">
          <span className="font-semibold text-[13px]">hubheadsdetails — SubHead belongs to which HubMainHead</span>
          <span className="text-[11px] text-gray-400">Cascade source of truth · highlighted = assigned in Step 2</span>
        </div>
        <div className="p-4 grid grid-cols-6 gap-2">
          {ALL_HUBS.map(hub => (
            <div key={hub} className="border border-border rounded-lg p-2">
              <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2 ${HUB_COLOR[hub]}`}>{hub}</div>
              <div className="space-y-1">
                {(HUB_TO_SUBHEADS[hub] || []).map(s => (
                  <div key={s} className={`text-[9.5px] px-1.5 py-0.5 rounded border leading-tight ${
                    scopesObj.HubSubHead?.includes(s)
                      ? 'bg-purple-100 border-purple-300 text-purple-800 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>{s}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {derivedHubsFromSubHead && (
          <div className="mx-4 mb-4 text-[11.5px] bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800">
            <strong>Cascade active:</strong> assigned HubSubHead = [{scopesObj.HubSubHead?.join(', ')}]
            → auto-derived HubMainHead = <strong>[{derivedHubsFromSubHead.join(', ')}]</strong>
            {scopesObj.HubMainHead?.length > 0 && ` + explicit HubMainHead = [${scopesObj.HubMainHead.join(', ')}]`}
            {' '}→ effective HubMainHead = <strong>[{effectiveHubs?.join(', ')}]</strong>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* ── LEFT ──────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Step 1 — Catalog */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="1" color="bg-blue-500" />
                <span className="font-semibold text-[13px]">Scope Catalog</span>
              </div>
              <span className="text-[11px] text-gray-400">Access Control → Scopes tab</span>
            </div>
            <div className="p-4 space-y-2.5">
              {Object.entries(byType).map(([type, scopes]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge text={type} color={TYPE_COLOR[type]} />
                    <span className="text-[10.5px] text-gray-400">
                      {type === 'HubMainHead' && '→ HubMainHead filter'}
                      {type === 'HubSubHead'  && '→ HubSubHead filter + cascades HubMainHead'}
                      {type === 'ForYear'     && '→ ForYear filter'}
                      {type === 'createdBy'   && '→ Createdby filter'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {scopes.map(s => (
                      <span key={s.id} className={`text-[10px] border px-1.5 py-0.5 rounded font-mono ${
                        selectedIds.includes(s.id)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-surface border-border text-gray-600'
                      }`}>
                        {s.value === '__self__' ? '__self__' : s.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2 — Assign to Role */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="2" color="bg-blue-500" />
                <span className="font-semibold text-[13px]">Assign Scopes to Role</span>
              </div>
              <span className="text-[11px] text-gray-400">Edit Role → Scopes</span>
            </div>
            <div className="p-4">
              <div className="border border-border rounded-lg p-3 bg-surface space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold">Role:</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Data Entry Officer</span>
                </div>
                {Object.entries(byType).map(([type, scopes]) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge text={type} color={TYPE_COLOR[type]} />
                      {type === 'HubMainHead' && derivedHubsFromSubHead && (
                        <span className="text-[10px] text-amber-600">
                          ← auto-derived from HubSubHead, usually skip
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 ml-1">
                      {scopes.map(s => (
                        <label key={s.id} className="flex items-center gap-1.5 cursor-pointer group">
                          <input type="checkbox" className="w-3.5 h-3.5 accent-blue-600"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggle(s.id)} />
                          <span className="text-[11.5px] text-gray-700 group-hover:text-blue-600">{s.label}</span>
                          {type === 'HubSubHead' && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${HUB_COLOR[SUBHEAD_TO_HUB[s.value]] || 'bg-gray-100 text-gray-500'}`}>
                              {SUBHEAD_TO_HUB[s.value]}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10.5px] text-gray-400 mt-2">
                Each subHead shows its parent hub in a small badge. Assign only subHeads — hub is auto-derived.
              </p>
            </div>
          </div>

          {/* Step 3 — Role → User */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="3" color="bg-indigo-500" />
                <span className="font-semibold text-[13px]">Role → User</span>
              </div>
              <span className="text-[11px] text-gray-400">user_a inherits from role</span>
            </div>
            <div className="p-4">
              <div className="border border-border rounded-lg p-3 bg-surface">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">UA</div>
                    <span className="text-[12px] font-semibold">user_a</span>
                  </div>
                  <span className="text-[10.5px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Role: Data Entry Officer</span>
                </div>
                {selectedIds.length === 0 ? (
                  <p className="text-[11px] italic text-gray-400">No scopes → sees all data</p>
                ) : (
                  <div className="space-y-2">
                    {scopesObj.HubSubHead?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Badge text="HubSubHead" color={TYPE_COLOR.HubSubHead} />
                        <div className="flex gap-1 flex-wrap">
                          {scopesObj.HubSubHead.map(v => (
                            <span key={v} className="text-[11px] bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-purple-700">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {effectiveHubs && (
                      <div className="flex items-start gap-2">
                        <Badge text="HubMainHead" color={TYPE_COLOR.HubMainHead} />
                        <div className="flex gap-1 flex-wrap">
                          {effectiveHubs.map(v => {
                            const isDerived = !scopesObj.HubMainHead?.includes(v);
                            return (
                              <span key={v} className={`text-[11px] px-1.5 py-0.5 rounded border ${
                                isDerived
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                                {v}{isDerived && <span className="text-[9px] ml-1 opacity-70">derived</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {scopesObj.ForYear?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Badge text="ForYear" color={TYPE_COLOR.ForYear} />
                        <div className="flex gap-1">{scopesObj.ForYear.map(v => (
                          <span key={v} className="text-[11px] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded text-green-700">{v}</span>
                        ))}</div>
                      </div>
                    )}
                    {scopesObj.createdBy?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Badge text="createdBy" color={TYPE_COLOR.createdBy} />
                        <span className="text-[11px] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded text-orange-700">Own Receipts Only</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Step 4 — JWT */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="4" color="bg-green-500" />
                <span className="font-semibold text-[13px]">JWT on login</span>
              </div>
              <span className="text-[11px] text-gray-400">Backend derives hub from subHead at login</span>
            </div>
            <div className="p-4">
              <pre className="bg-gray-900 text-green-400 text-[11px] p-3 rounded-lg font-mono leading-relaxed overflow-auto">
{`{
  "username": "user_a",
  "roles":    ["data_entry_officer"],
  "permissions": ["daily_report.view", ...],
  "scopes": ${jwtStr}
}`}
              </pre>
              {derivedHubsFromSubHead && (
                <div className="mt-2 text-[11px] bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-amber-800">
                  <code className="font-mono">HubMainHead</code> was not assigned — auto-derived at login by joining{' '}
                  <code className="font-mono">hubheadsdetails</code> on the assigned HubSubHead values.
                </div>
              )}
            </div>
          </div>

          {/* Step 5 — hasScope() */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="5" color="bg-green-500" />
                <span className="font-semibold text-[13px]">hasScope() — Frontend checks</span>
              </div>
            </div>
            <div className="p-4">
              <div className="text-[11px] font-semibold text-gray-600 mb-2">Hub checks (cascade-aware):</div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {hubChecks.map(h => {
                  const res = hasScope('HubMainHead', h);
                  const isDerived = res && !scopesObj.HubMainHead?.includes(h) && derivedHubsFromSubHead?.includes(h);
                  return (
                    <div key={h} className={`px-2 py-1 rounded text-[10.5px] border ${
                      res ? (isDerived ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200') : 'bg-red-50 border-red-200'
                    }`}>
                      <span className="font-mono text-gray-600">'{h}'</span>
                      <span className={`float-right font-bold text-[11px] ${res ? (isDerived ? 'text-amber-600' : 'text-green-600') : 'text-red-500'}`}>
                        {res ? (isDerived ? '✓ derived' : '✓') : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-900 text-[10.5px] p-3 rounded-lg font-mono text-blue-300 leading-relaxed">
                <div className="text-gray-500">{'// In any JSX page:'}</div>
                <div className="text-white">{'const { can, hasScope } = useAuth();'}</div>
                <br/>
                <div>{'{can(\'daily_report.view\') && hasScope(\'HubMainHead\', \'Vajebaat\') && <VajebaatTab />}'}</div>
                <div>{'{hasScope(\'HubSubHead\', \'Taherabad Safar\') && <TaherabadSection />}'}</div>
                <div>{'{hasScope(\'ForYear\', \'1447\') && <Year1447Data />}'}</div>
              </div>
            </div>
          </div>

          {/* Step 6 — Filtered dropdowns */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="6" color="bg-green-500" />
                <span className="font-semibold text-[13px]">Scope-Filtered Dropdowns</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* HubMainHead */}
                <div>
                  <label className="form-label flex items-center gap-1 flex-wrap">
                    Main Head <Badge text="HubMainHead" color={TYPE_COLOR.HubMainHead} />
                    {hubIsRestricted && <span className={`text-[9px] px-1 rounded font-medium ${hubIsDerived ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>{hubIsDerived ? 'cascade' : 'scoped'}</span>}
                  </label>
                  <select className="form-select text-[12px]">
                    <option value="">All</option>
                    {hubOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div className="mt-1 text-[10px]">
                    {hubIsRestricted
                      ? <span className={hubIsDerived ? 'text-amber-600' : 'text-blue-600'}>{hubOptions.length}/{ALL_HUBS.length}{hubIsDerived && ' (auto)'}</span>
                      : <span className="text-gray-400">all {ALL_HUBS.length}</span>}
                  </div>
                </div>
                {/* SubHead */}
                <div>
                  <label className="form-label flex items-center gap-1">
                    Sub Head <Badge text="HubSubHead" color={TYPE_COLOR.HubSubHead} />
                    {subHeadIsRestricted && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-medium">scoped</span>}
                  </label>
                  <select className="form-select text-[12px]">
                    <option value="">All</option>
                    {subHeadOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div className="mt-1 text-[10px]">
                    {subHeadIsRestricted
                      ? <span className="text-amber-600">{subHeadOptions.length}/{ALL_SUBHEADS.length}</span>
                      : <span className="text-gray-400">all {ALL_SUBHEADS.length}</span>}
                  </div>
                </div>
                {/* Year */}
                <div>
                  <label className="form-label flex items-center gap-1">
                    For Year <Badge text="ForYear" color={TYPE_COLOR.ForYear} />
                    {yearIsRestricted && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-medium">scoped</span>}
                  </label>
                  <select className="form-select text-[12px]">
                    <option value="">All</option>
                    {yearOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div className="mt-1 text-[10px]">
                    {yearIsRestricted
                      ? <span className="text-amber-600">{yearOptions.length}/{ALL_YEARS.length}</span>
                      : <span className="text-gray-400">all {ALL_YEARS.length}</span>}
                  </div>
                </div>
              </div>
              {(hubOptions.length === 1 || subHeadOptions.length === 1 || yearOptions.length === 1) && (
                <div className="text-[11px] bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-700">
                  <strong>Tip:</strong> 1-option dropdowns can be auto-selected and hidden from the UI.
                </div>
              )}
            </div>
          </div>

          {/* Step 7 — SQL */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <StepBadge n="7" color="bg-rose-500" />
                <span className="font-semibold text-[13px]">Backend SQL — Daily Report</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                visibleRows.length === MOCK_RECEIPTS.length ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'
              }`}>{visibleRows.length}/{MOCK_RECEIPTS.length} rows</span>
            </div>
            <div className="p-4">
              {selectedIds.length > 0 && (
                <div className="bg-gray-900 text-yellow-300 text-[10.5px] p-2.5 rounded font-mono mb-3 leading-relaxed">
                  <span className="text-gray-500">-- WHERE clauses injected by backend:</span>
                  {effectiveHubs?.length === 1 && <div><br/>AND HubMainHead = <span className="text-green-400">'{effectiveHubs[0]}'</span>{hubIsDerived && <span className="text-gray-500"> -- derived</span>}</div>}
                  {effectiveHubs?.length > 1  && <div><br/>AND HubMainHead IN (<span className="text-green-400">{effectiveHubs.map(v=>`'${v}'`).join(', ')}</span>){hubIsDerived && <span className="text-gray-500"> -- derived</span>}</div>}
                  {scopesObj.HubSubHead?.length === 1 && <div><br/>AND HubSubHead = <span className="text-green-400">'{scopesObj.HubSubHead[0]}'</span></div>}
                  {scopesObj.HubSubHead?.length > 1  && <div><br/>AND HubSubHead IN (<span className="text-green-400">{scopesObj.HubSubHead.map(v=>`'${v}'`).join(', ')}</span>)</div>}
                  {scopesObj.ForYear?.length === 1 && <div><br/>AND ForYear = <span className="text-green-400">'{scopesObj.ForYear[0]}'</span></div>}
                  {scopesObj.ForYear?.length > 1  && <div><br/>AND ForYear IN (<span className="text-green-400">{scopesObj.ForYear.map(v=>`'${v}'`).join(', ')}</span>)</div>}
                  {scopesObj.createdBy?.includes('__self__') && <div><br/>AND Createdby = <span className="text-green-400">'user_a'</span><span className="text-gray-500"> -- req.user.username</span></div>}
                </div>
              )}
              <div className="overflow-auto rounded border border-border">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr>{['#', 'Hub', 'SubHead', 'Year', 'By', 'Amt', ''].map(h => (
                      <th key={h} className="bg-gray-800 text-white px-2 py-1.5 text-left font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {MOCK_RECEIPTS.map(r => {
                      const vis = visibleRows.includes(r);
                      return (
                        <tr key={r.id} className={vis ? 'bg-green-50' : 'bg-red-50'}>
                          <td className={`px-2 py-1 border-t border-gray-100 font-mono ${!vis&&'opacity-40'}`}>{r.no}</td>
                          <td className={`px-2 py-1 border-t border-gray-100 ${!vis&&'opacity-40'}`}>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${HUB_COLOR[r.hub]}`}>{r.hub}</span>
                          </td>
                          <td className={`px-2 py-1 border-t border-gray-100 whitespace-nowrap ${!vis&&'opacity-40'}`}>{r.subHead}</td>
                          <td className={`px-2 py-1 border-t border-gray-100 ${!vis&&'opacity-40'}`}>{r.year}</td>
                          <td className={`px-2 py-1 border-t border-gray-100 font-mono ${!vis&&'opacity-40'}`}>
                            <span className={r.by==='user_a'?'text-indigo-600 font-semibold':'text-gray-500'}>{r.by}</span>
                          </td>
                          <td className={`px-2 py-1 border-t border-gray-100 font-semibold ${!vis&&'opacity-40'}`}>₹{r.amt.toLocaleString()}</td>
                          <td className="px-2 py-1 border-t border-gray-100 text-center">{vis?'✅':'🚫'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cascade summary table */}
      <div className="card">
        <div className="card-header">
          <span className="font-semibold text-[13px]">Cascade Reference — Your Real Data</span>
        </div>
        <div className="p-4">
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr>{['Assign this subHead scope', 'Belongs to hub (from hubheadsdetails)', 'Hub dropdown shows'].map(h => (
                <th key={h} className="bg-gray-800 text-white px-3 py-2 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[
                ['Taherabad Safar',                'Vajebaat',         'Vajebaat only'],
                ['HIM',                            'Vajebaat',         'Vajebaat only'],
                ['Shehrullah Niyaz',               'Vajebaat',         'Vajebaat only'],
                ['Taherabad Safar + HIM',          'Vajebaat',         'Vajebaat only (same hub)'],
                ['FMB Regular',                    'FMB',              'FMB only'],
                ['Taherabad Safar + FMB Regular',  'Vajebaat + FMB',   'Vajebaat, FMB'],
                ['Ashara Niyaz',                   'Other',            'Other only'],
                ['Jamaat Khana Small',             'Rent',             'Rent only'],
                ['Mahurat',                        'Laagat',           'Laagat only'],
              ].map(([sub, hub, dropdown]) => (
                <tr key={sub} className="hover:bg-surface">
                  <td className="px-3 py-2 border-t border-border font-mono text-purple-700">{sub}</td>
                  <td className="px-3 py-2 border-t border-border font-mono text-amber-700">{hub}</td>
                  <td className="px-3 py-2 border-t border-border text-gray-700">{dropdown}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
