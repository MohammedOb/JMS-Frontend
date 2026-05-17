'use client';

import Modal from '@/components/shared/Modal';
import { SearchIcon } from '@/components/shared/Icons';

// Normalise a raw search result (orgdata + mumindetail join) to a consistent shape.
const normMember = (m) => ({
  _raw:     m,
  FullName: m.Full_Name  || m.FullName  || m.fullName  || '',
  ITSNo:    m.ITS_ID     ? String(m.ITS_ID) : (m.ITS_No || m.ITSNo || m.itsNo || ''),
  AccNo:    m.AccNo      || m.accno     || '',
  Age:      m.Age        ?? null,
  Gender:   m.Gender     || '',
});

function MemberSearchPanel({
  memberQuery, setMemberQuery,
  memberResults, searchingMembers,
  selectedMember, setSelectedMember, setMemberResults,
}) {
  return (
    <>
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="Type name, ITS or Acc No…"
          value={memberQuery}
          onChange={e => { setMemberQuery(e.target.value); setSelectedMember(null); }}
        />
      </div>
      {searchingMembers && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
      {memberResults.length > 0 && !selectedMember && (
        <div className="border border-border rounded-lg mt-1 divide-y max-h-48 overflow-y-auto bg-white shadow-sm">
          {memberResults.map((m, i) => {
            const n = normMember(m);
            return (
              <button
                key={`${n.ITSNo || n.AccNo || n.FullName}-${i}`}
                onClick={() => { setSelectedMember(m); setMemberQuery(n.FullName); setMemberResults([]); }}
                className="w-full text-left px-3 py-2 hover:bg-surface text-sm flex items-center gap-2"
              >
                <span className="font-medium text-navy-800">{n.FullName}</span>
                <span className="text-gray-400 text-xs">
                  ITS: {n.ITSNo}
                  {n.AccNo ? ` · Acc: ${n.AccNo}` : ''}
                  {n.Age != null ? ` · Age ${n.Age}` : ''}
                  {n.Gender ? ` · ${n.Gender}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function SelectedMemberCard({ member }) {
  const n = normMember(member);
  return (
    <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm">
      <span className="font-semibold text-green-800">{n.FullName}</span>
      <span className="text-green-600 ml-2 text-xs">
        ITS: {n.ITSNo}
        {n.AccNo ? ` · Acc: ${n.AccNo}` : ''}
        {n.Age != null ? ` · Age ${n.Age}` : ''}
      </span>
    </div>
  );
}

export default function SeatClickModal({
  open, row, col, alloc,
  onClose,
  memberQuery, setMemberQuery,
  memberResults, searchingMembers,
  selectedMember, setSelectedMember, setMemberResults,
  blockRemark, setBlockRemark,
  onAllocate, onBlock, onClear,
}) {
  const searchProps = { memberQuery, setMemberQuery, memberResults, searchingMembers, selectedMember, setSelectedMember, setMemberResults };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Seat ${row}${col} — ${alloc ? alloc.SeatStatus : 'Available'}`}
      size="md"
      footer={<button className="btn-ghost" onClick={onClose}>Close</button>}
    >
      {/* Available seat — assign or block */}
      {!alloc && (
        <div className="space-y-4">
          <div>
            <label className="form-label">Search Member (Name / ITS / Acc No)</label>
            <MemberSearchPanel {...searchProps} />
            {selectedMember && <SelectedMemberCard member={selectedMember} />}
          </div>
          <button disabled={!selectedMember} onClick={onAllocate} className="btn-primary w-full">
            Assign to Seat {row}{col}
          </button>
          <hr className="border-border" />
          <div>
            <label className="form-label">Block / Reserve Remark (optional)</label>
            <input className="form-input" value={blockRemark} onChange={e => setBlockRemark(e.target.value)} placeholder="e.g. Reserved for VIP" />
          </div>
          <button onClick={onBlock} className="btn-secondary w-full text-yellow-700 border-yellow-300 hover:bg-yellow-50">
            Block / Reserve This Seat
          </button>
        </div>
      )}

      {/* Allocated seat */}
      {alloc?.SeatStatus === 'Allocated' && (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800">{alloc.FullName || alloc.AccNo}</p>
            <p className="text-xs text-red-600 mt-0.5">
              ITS: {alloc.ITSNo} · Acc: {alloc.AccNo}
              {alloc.Age != null ? ` · Age: ${alloc.Age}` : ''}
              {alloc.Gender ? ` · ${alloc.Gender}` : ''}
            </p>
            {alloc.AssignedDate && (
              <p className="text-xs text-red-400 mt-0.5">Assigned: {new Date(alloc.AssignedDate).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClear} className="btn-danger flex-1">Clear Seat</button>
            <button onClick={onBlock} className="btn-secondary flex-1 text-yellow-700">Convert to Blocked</button>
          </div>
          <hr className="border-border" />
          <p className="text-xs text-gray-500 font-medium">Re-assign to a different member:</p>
          <MemberSearchPanel {...searchProps} />
          {selectedMember && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center justify-between">
              <SelectedMemberCard member={selectedMember} />
              <button onClick={onAllocate} className="btn-primary text-xs px-3 py-1 ml-2 shrink-0">Assign</button>
            </div>
          )}
        </div>
      )}

      {/* Blocked seat */}
      {alloc?.SeatStatus === 'Blocked' && (
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">This seat is Blocked / Reserved</p>
            {alloc.Remark && <p className="text-xs text-yellow-700 mt-1">Remark: {alloc.Remark}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClear} className="btn-secondary flex-1">Unblock</button>
          </div>
          <hr className="border-border" />
          <p className="text-xs text-gray-500 font-medium">Assign a member to this seat:</p>
          <MemberSearchPanel {...searchProps} />
          {selectedMember && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center justify-between">
              <SelectedMemberCard member={selectedMember} />
              <button onClick={onAllocate} className="btn-primary text-xs px-3 py-1 ml-2 shrink-0">Assign</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
