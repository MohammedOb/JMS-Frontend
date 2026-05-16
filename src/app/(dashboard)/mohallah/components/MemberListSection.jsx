'use client';

import { EditIcon } from '@/components/shared/Icons';

export default function MemberListSection({
  loadingMembers,
  totalHouses,
  totalMembers,
  filteredMembers,
  printOpts,
  onViewMember,
  onEditMember,
  membersLoaded,
}) {
  const columns = [
    'S No',
    'Acc No',
    'Full Name',
    'Mobile',
    'ITS No',
    'Local HOF ITS',
    'Staying In',
    'Sabeel Type',
    'Members',
    ...(printOpts.showThaliStatus ? ['Thali Status'] : []),
    ...(printOpts.showThaliSize ? ['Thali Size'] : []),
    'Action',
  ];

  return (
    <>
      <div className="flex items-center gap-8 mb-3 px-1">
        <span className="text-[15px] font-bold text-red-600 underline">
          Total House : {loadingMembers ? '...' : totalHouses}
        </span>
        <span className="text-[15px] font-bold text-red-600 underline">
          Total Members : {loadingMembers ? '...' : totalMembers}
        </span>
      </div>

      <div className="card">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {columns.map((header) => (
                  <th key={header} className="th-navy">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingMembers ? (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-gray-400">
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-gray-400">
                    {membersLoaded ? 'No members found for this mohallah' : 'Loading...'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr
                    key={member.accno || index}
                    className={
                      index % 2 === 0
                        ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.15]'
                        : 'hover:bg-blue-500/[0.04]'
                    }
                  >
                    <td className="px-3 py-2.5 border-t border-border text-gray-500">{index + 1}</td>
                    <td
                      className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold cursor-pointer hover:underline"
                      onClick={() => onViewMember(member.accno)}
                    >
                      {member.accno}
                    </td>
                    <td className="px-3 py-2.5 border-t border-border font-medium">{member.name}</td>
                    <td className="px-3 py-2.5 border-t border-border">{member.mobile || '-'}</td>
                    <td className="px-3 py-2.5 border-t border-border">{member.itsNo || '-'}</td>
                    <td className="px-3 py-2.5 border-t border-border">{member.localHofIts || '-'}</td>
                    <td className="px-3 py-2.5 border-t border-border">{member.stayingIn || '-'}</td>
                    <td className="px-3 py-2.5 border-t border-border">{member.sabeelType || '-'}</td>
                    <td className="px-3 py-2.5 border-t border-border text-center">
                      {member.membersCount ?? '-'}
                    </td>
                    {printOpts.showThaliStatus && (
                      <td className="px-3 py-2.5 border-t border-border">
                        {member.thaliStatus || '-'}
                      </td>
                    )}
                    {printOpts.showThaliSize && (
                      <td className="px-3 py-2.5 border-t border-border">{member.thaliSize || '-'}</td>
                    )}
                    <td className="px-3 py-2.5 border-t border-border">
                      <button
                        className="btn btn-secondary btn-sm p-1.5"
                        title="Edit Mohallah"
                        onClick={() => onEditMember(member)}
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
