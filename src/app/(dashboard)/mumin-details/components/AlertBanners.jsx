'use client';

// ── Configure which takhmeen alerts appear per sabeel type ────────────────────
//
// Fields:
//   label   – text shown in the alert
//   main    – HubMainHead pre-filled in the modal
//   sub     – HubSubHead  pre-filled in the modal
//   btn     – button label
//   checkBy – 'subHead' | 'mainHead'  (which field to match when detecting existing entry)
//   yearKey – permission key to use for the year check  (default: 'ForYearAll')
//             Use 'ForYearFMB' for FMB / HIM, or omit for regular year.
//   year    – hardcode a specific year string instead of reading from permissions
//             e.g.  year: '1446'   (takes priority over yearKey)
//
const REQUIRED_TAKHMEEN = {
  Regular: [
    { label: 'HIM Takhmeen not entered',       main: 'Vajebaat', sub: 'HIM',              btn: 'Enter HIM',            checkBy: 'subHead' },
    { label: 'Sabeel Regular not entered',      main: 'Sabeel',   sub: 'Sabeel Regular',    btn: 'Enter Sabeel Regular', checkBy: 'subHead'  },
    { label: 'FMB Takhmeen not entered',        main: 'FMB',      sub: 'FMB Regular',       btn: 'Enter FMB',            checkBy: 'mainHead', yearKey: 'ForYearFMB' },
    { label: 'Shehrullah Niyaz not entered',    main: 'Vajebaat', sub: 'Shehrullah Niyaz',  btn: 'Enter S. Niyaz',       checkBy: 'subHead'  },
    { label: 'Security Guard not entered',      main: 'Other',    sub: 'Security Guards',    btn: 'Enter Security Guard', checkBy: 'subHead', year: '1445'  },
    { label: 'Vajebaat not entered',    main: 'Vajebaat', sub: 'Vajebaat',  btn: 'Enter Vajebaat',       checkBy: 'subHead'  },
    // { label: 'Taherabad Safar 1447 not entered',      main: 'Other',    sub: '1447 - Taherabad Safar',    btn: 'Enter Taherabad Safar 1447', checkBy: 'subHead', year: '1447'  },
  ],
  Mutaveteen: [
    { label: 'Sabeel Mutaveteen not entered',   main: 'Sabeel',   sub: 'Sabeel Mutaveteen', btn: 'Enter Mutaveteen',     checkBy: 'subHead'  },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

export default function AlertBanners({ takhmeen = [], permissions = {}, member, onAddTakhmeen }) {
  const sabeelType = member?.sabeelType || '';
  const isRegular    = sabeelType.toLowerCase().includes('regular');
  const isMutaveteen = sabeelType.toLowerCase().includes('mutaveteen');

  if (!permissions.ForYearAll || (!isRegular && !isMutaveteen)) return null;

  // Resolve the year for a rule: literal year > yearKey from permissions > ForYearAll
  const resolveYear = (rule) =>
    rule.year
      ? String(rule.year)
      : String(permissions[rule.yearKey] || permissions.ForYearAll || '');

  const hasEntry = (rule) => {
    const yr = resolveYear(rule);
    return takhmeen.some(r =>
      String(r.forYear) === yr &&
      (rule.checkBy === 'mainHead' ? r.mainHead === rule.main : r.subHead === rule.sub)
    );
  };

  const sabeelSubHead = isRegular ? 'Sabeel Regular' : 'Sabeel Mutaveteen';

  // Extract leading numeric part so '1447-48' → 1447 for comparison
  const parseYear = (yr) => parseInt(String(yr), 10) || 0;

  // Year-specific rules only apply if member has a Sabeel entry for that year or earlier
  const sabeelExistsForYear = (yr) =>
    takhmeen.some(r => r.subHead === sabeelSubHead && parseYear(r.forYear) <= parseYear(yr));

  const shouldShow = (rule) => {
    if (rule.year || rule.yearKey) return sabeelExistsForYear(resolveYear(rule));
    return true;
  };

  const typeKey = isRegular ? 'Regular' : 'Mutaveteen';
  const alerts  = (REQUIRED_TAKHMEEN[typeKey] || []).filter(r => shouldShow(r) && !hasEntry(r));

  return (
    <div className="flex flex-col gap-2 h-full">
      {alerts.map((a) => {
        const yr = resolveYear(a);
        return (
          <div
            key={a.sub}
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[12px] bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 text-amber-900"
          >
            <span className="flex-1">⚠ {a.label} for <strong>{yr}</strong></span>
            <button
              className="btn btn-sm bg-amber-500 text-white border-amber-500 shrink-0"
              onClick={() => onAddTakhmeen?.(a.main, a.sub, yr)}
            >
              {a.btn}
            </button>
          </div>
        );
      })}

      {alerts.length === 0 && (
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[12px] bg-green-50 border border-green-200 border-l-4 border-l-green-500 text-green-800">
          <span>✓ All takhmeen entries are complete for {isRegular ? 'Sabeel Regular' : 'Sabeel Mutaveteen'}</span>
        </div>
      )}
    </div>
  );
}
