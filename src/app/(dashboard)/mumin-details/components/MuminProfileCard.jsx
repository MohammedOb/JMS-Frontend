'use client';

import Badge from '@/components/shared/Badge';
import { EditIcon, KeyIcon } from '@/components/shared/Icons';
import { fmt, fmtDate } from '../utils';

export default function MuminProfileCard({ member, initials, features = {}, onEdit, onAddReceipt, onPrint, onResetPass, onOverallDue }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-navy-800 px-4 py-5 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/25 border-2 border-white/20 flex items-center justify-center
                        mx-auto mb-2.5 font-display text-[22px] font-bold text-white">
          {initials}
        </div>
        <div className="font-display text-[15px] font-bold text-white mb-0.5">{member.name}</div>
        <div className="text-[15px] text-white/70 mb-2">
          Sabeel No# {member.accno} || ITS# {member.itsNo || '—'}
        </div>
        <Badge
          variant={member.status === 'Active' ? 'green' : member.status === 'BlackList' ? 'red' : 'gray'}
          className="bg-opacity-20 text-white border-0"
        >
          {member.status}
        </Badge>
      </div>

      <div className="p-3.5 space-y-0">
        {[
          ['Mobile',          member.mobile],
          ['Alt Mobile',      member.mobile1 || '—'],
          ['HOF ITS',         member.hofIts || '—'],
          ['HOF Name',        member.hofName || '—'],
          ['Address',         member.address || '—'],
          ['Sector Area',     member.sector || '—'],
          ['Subsector',       member.mohallah || '—'],
          ['Staying In',      member.stayingIn || '—'],
          ['Work Status',     member.workStatus || '—'],
          ['Sabeel Type',     member.sabeelType || '—'],
          ['Current Grade',   member.grade || '—'],
          ['Sabeel Amt',      fmt(member.sabeelAmount)],
          ['Sabeel Remark',   member.sabeelRemark || '—'],
          ['Account Created', fmtDate(member.createdDate)],
          ['Login Access',    member.loginAccess || '—'],
        ].map(([label, val]) => (
          <div key={label} className="flex items-start gap-2 py-1.5 border-b border-surface-2 last:border-0">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[.4px] min-w-[88px] flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-[12.5px] text-navy-900 font-medium break-all">{val}</span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border flex gap-2 flex-wrap">
        {features.editProfile !== false && (
          <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={onEdit}>
            <EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit Profile
          </button>
        )}
        {features.resetPassword !== false && (
          <button className="btn btn-secondary btn-sm flex-1 justify-center" onClick={onResetPass}>
            <KeyIcon className="w-3.5 h-3.5 mr-1.5" />Reset Password
          </button>
        )}
      </div>
    </div>
  );
}
