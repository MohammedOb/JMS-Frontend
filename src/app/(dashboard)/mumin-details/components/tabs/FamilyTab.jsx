'use client';

import Badge from '@/components/shared/Badge';
import { StatusBadge } from '@/components/shared/Badge';
import { ClipboardListIcon } from '@/components/shared/Icons';

export default function FamilyTab({ family }) {
  return (
    <div className="p-4">
      <p className="text-[11px] text-gray-400 mb-3">Family members linked via HOF ITS No. — Source: OrgData</p>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['ITS ID','Full Name','HOF ITS','Relation','Mobile','Acc#','Status'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {family.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No family members found</td></tr>
            ) : family.map((f, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border">{f.itsNo}</td>
                <td className="px-3 py-2 border-t border-border font-medium">
                  {f.name}
                  {f.isHOF && <Badge variant="blue" className="ml-1.5">HOF</Badge>}
                </td>
                <td className="px-3 py-2 border-t border-border">{f.hofIts}</td>
                <td className="px-3 py-2 border-t border-border">{f.relation}</td>
                <td className="px-3 py-2 border-t border-border">{f.mobile || '—'}</td>
                <td className="px-3 py-2 border-t border-border">{f.accno || '—'}</td>
                <td className="px-3 py-2 border-t border-border">
                  <StatusBadge status={f.status || 'Not Enrolled'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <button className="btn btn-secondary btn-sm">
          <ClipboardListIcon className="w-3.5 h-3.5 mr-1.5" />View ITS Data
        </button>
      </div>
    </div>
  );
}
