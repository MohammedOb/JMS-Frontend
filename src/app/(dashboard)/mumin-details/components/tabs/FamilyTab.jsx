'use client';

import { fmtDate } from '../../utils';

const COLUMNS = [
  { key: 'ITS_ID',            label: 'ITS ID',           sticky: true },
  { key: 'Full_Name',         label: 'Full Name',        sticky: true },
  { key: 'Full_Name_Arabic',  label: 'Full Name (Arabic)', isArabic: true },
  { key: 'Title',             label: 'Title' },
  { key: 'Father_Name',       label: 'Father Name' },
  { key: 'Father_Surname',    label: 'Father Surname' },
  { key: 'Husband_Name',      label: 'Husband Name' },
  { key: 'Surname',           label: 'Surname' },
  { key: 'Age',               label: 'Age' },
  { key: 'Gender',            label: 'Gender' },
  { key: 'Misaq',             label: 'Misaq' },
  { key: 'Marital_Status',    label: 'Marital Status' },
  { key: 'Blood_Group',       label: 'Blood Group' },
  { key: 'Date_Of_Nikah',     label: 'Date of Nikah',    isDate: true },
  { key: 'Date_Of_Nikah_Hijri', label: 'Nikah (Hijri)' },
  { key: 'Mobile',            label: 'Mobile' },
  { key: 'Email',             label: 'Email' },
  { key: 'Vatan',             label: 'Vatan' },
  { key: 'Nationality',       label: 'Nationality' },
  { key: 'Jamaat',            label: 'Jamaat' },
  { key: 'Jamiaat',           label: 'Jamiaat' },
  { key: 'Qualification',     label: 'Qualification' },
  { key: 'Occupation',        label: 'Occupation' },
  { key: 'Sub_Occupation',    label: 'Sub Occupation' },
  { key: 'Quran_Sanad',       label: 'Quran Sanad' },
  { key: 'Karbala_Ziyarat',   label: 'Karbala Ziyarat' },
  { key: 'Sector',            label: 'Sector' },
  { key: 'Sub_Sector',        label: 'Sub Sector' },
];

const stickyCount = COLUMNS.filter(c => c.sticky).length;

function stickyStyle(colIndex) {
  if (colIndex === 0) return { position: 'sticky', left: 0, zIndex: 2, background: 'inherit' };
  if (colIndex === 1) return { position: 'sticky', left: 80, zIndex: 2, background: 'inherit' };
  return {};
}

export default function FamilyTab({ family, loading }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-gray-400">Family members linked via HOF ITS No. — Source: OrgData</span>
        {!loading && family.length > 0 && (
          <span className="text-[12px] font-medium text-navy-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
            {family.length} member{family.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-[12px]">Loading family members…</div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto overflow-y-auto" style={{ maxHeight: 480, maxWidth: '100%' }}>
          <table className="border-collapse text-[11.5px]" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr className="bg-navy-900">
                {COLUMNS.map((col, ci) => (
                  <th
                    key={col.key}
                    className="th-navy whitespace-nowrap"
                    style={ci < stickyCount ? stickyStyle(ci) : {}}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {family.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-8 text-gray-400">
                    No family members found
                  </td>
                </tr>
              ) : family.map((row, ri) => (
                <tr key={ri} className="hover:bg-blue-500/[0.025]">
                  {COLUMNS.map((col, ci) => {
                    const val = row[col.key];
                    const display = col.isDate ? fmtDate(val) : (val ?? '—');
                    const isEmpty = display === '' || display === null || display === undefined;
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 border-t border-border whitespace-nowrap${col.isArabic ? ' font-alkanz text-[14px]' : ''}`}
                        style={ci < stickyCount ? { ...stickyStyle(ci), background: ri % 2 === 0 ? '#fff' : '#f9fafb' } : {}}
                      >
                        {isEmpty ? '—' : String(display)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
