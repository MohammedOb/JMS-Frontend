'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { MONTHS, getHijriLabel } from '../utils/hijri';
import { EditIcon, TrashIcon, CheckIcon, RefreshIcon, PrintIcon } from '@/components/shared/Icons';

function fmtDate(value) {
  if (!value) return '—';
  const s = String(value).trim();
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yr, mo, da] = s.split('-').map(Number);
    d = new Date(yr, mo - 1, da);
  } else {
    const parsed = new Date(s);
    d = isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  if (!d) return s.slice(0, 10) || '—';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function ConfirmModal({ open, title, message, confirmLabel, confirmClassName, ConfirmIcon, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-navy-800 px-5 py-4 text-white flex items-center justify-between">
          <span className="font-semibold text-[15px]">{title}</span>
          <button onClick={onCancel} className="text-white/60 hover:text-white text-[20px] font-bold leading-none">×</button>
        </div>
        <div className="px-5 py-5 text-[13px] text-gray-700 bg-gray-50 border-b border-gray-100">
          {message}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-white">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className={clsx('btn btn-sm flex items-center gap-1.5', confirmClassName)} onClick={onConfirm}>
            {ConfirmIcon && <ConfirmIcon className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const BASE_HEADERS = [
  'Actions', 'Acc No', 'Full Name', 'Mobile', 'Mobile1',
  'ITS No', 'Address', 'Event Name', 'Event Date', 'Hijri Date',
  'Location', 'Event Time', 'Thaal', 'Remark',
  'Raza Status', 'Created By', 'Serial No', 'Request By', 'Request Date',
];

export default function DayEventList({
  cell, bookings, canAdd, canEdit, canDelete, canPrint,
  onAddEvent, onEdit, onDelete, onApproveRaza, onRevertRaza, onAddSafaiChitthi, onClose,
}) {
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);
  const [razaModal, setRazaModal]   = useState(null); // { type: 'approve'|'revert', booking }
  const [deleteModal, setDeleteModal] = useState(null); // booking

  if (!cell) return null;

  const gregDate = cell.date;
  const hijri = getHijriLabel(gregDate);
  const greg = gregDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const colHeaders = showUpdateInfo
    ? [...BASE_HEADERS.slice(0, 14), 'Update Reason', 'Updated At', ...BASE_HEADERS.slice(14)]
    : BASE_HEADERS;

  const handleConfirmRaza = () => {
    if (razaModal.type === 'approve') onApproveRaza(razaModal.booking);
    else onRevertRaza(razaModal.booking);
    setRazaModal(null);
  };

  const handleConfirmDelete = () => {
    onDelete(deleteModal);
    setDeleteModal(null);
  };

  const srLabel = (b) => b.serialNo || b.id || '—';

  return (
    <>
      <div className="card overflow-hidden mt-4">
        {/* ── Section header ── */}
        <div className="flex items-center justify-between gap-3 bg-navy-800 px-4 py-3 text-white flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/50">Event Records</div>
              <div className="text-[14px] font-semibold">{greg}</div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-white/20" />
            <div className="hidden sm:block text-[13px] text-white/70">{hijri}</div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-white/70 hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={showUpdateInfo}
                onChange={e => setShowUpdateInfo(e.target.checked)}
                className="accent-blue-400 w-3.5 h-3.5"
              />
              Update Info
            </label>
            {canAdd && (
              <button className="btn btn-primary btn-sm" onClick={onAddEvent}>
                + Add Event
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-white transition-all text-[16px] font-bold"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {bookings.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-gray-400">
            No events recorded for this day.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-navy-800 text-white">
                  {colHeaders.map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap text-[10.5px] uppercase tracking-wide border-r border-navy-700 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr
                    key={b.id ?? i}
                    className={clsx(
                      'border-b border-border transition-colors hover:bg-blue-50/30',
                      i % 2 === 0 ? 'bg-white' : 'bg-surface/50'
                    )}
                  >
                    {/* Actions */}
                    <td className="px-3 py-2 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-0.5">
                        {canEdit && (
                          <button onClick={() => onEdit(b)} title="Edit"
                            className="p-1 rounded text-blue-600 hover:bg-blue-100 transition-colors">
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canPrint && (
                          <button onClick={() => onEdit({ ...b, _print: true })} title="Print"
                            className="p-1 rounded text-blue-600 hover:bg-blue-100 transition-colors">
                            <PrintIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Single raza toggle */}
                        {(b.razaStatus === 'Raza Done' || b.razaStatus === 'Raza Approved') ? (
                          <button onClick={() => setRazaModal({ type: 'revert', booking: b })} title="Revert to Pending"
                            className="p-1 rounded text-orange-500 hover:bg-orange-100 transition-colors">
                            <RefreshIcon className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => setRazaModal({ type: 'approve', booking: b })} title="Approve Raza"
                            className="p-1 rounded text-green-600 hover:bg-green-100 transition-colors">
                            <CheckIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteModal(b)} title="Delete"
                            className="p-1 rounded text-red-500 hover:bg-red-100 transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {b.accNo
                        ? <Link href={`/mumin-details?accno=${b.accNo}&tab=safai`} className="text-blue-600 font-medium hover:underline">{b.accNo}</Link>
                        : '—'}
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">{b.fullName || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{b.mobile || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{b.mobile1 || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{b.itsNo || '—'}</td>
                    <td className="px-3 py-2 min-w-[120px]">{b.address || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-navy-800">
                      {b.eventName || b.name || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDate(b.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right"
                      style={{ fontFamily: "'AL-KANZ', serif", direction: 'rtl', fontSize: '13px' }}>
                      {b.hijriDate || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{b.venue || b.location || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {b.eventTime ? <span className="text-blue-600 font-medium">{b.eventTime}</span> : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">{b.thaal ?? '—'}</td>
                    <td className="px-3 py-2 min-w-[100px] text-gray-500">{b.remark || '—'}</td>

                    {showUpdateInfo && (
                      <>
                        <td className="px-3 py-2 min-w-[140px] text-gray-500">{b.updateReason || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmtDate(b.updatedAt)}</td>
                      </>
                    )}

                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx(
                        'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        (b.razaStatus === 'Raza Done' || b.razaStatus === 'Raza Approved') ? 'bg-green-600 text-white'
                          : b.razaStatus === 'Cancelled' ? 'bg-red-600 text-white'
                          : 'bg-red-600 text-white'
                      )}>
                        {b.razaStatus || 'Raza Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{b.createdBy || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {b.serialNo
                        ? <span className="text-blue-600 font-medium">{b.serialNo}</span>
                        : <button
                            onClick={() => onAddSafaiChitthi(b)}
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors whitespace-nowrap"
                          >
                            + Add Safai Chitthi
                          </button>
                      }
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{b.requestBy || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmtDate(b.requestDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="px-4 py-2 bg-surface border-t border-border text-[11px] text-gray-400">
            {bookings.length} record{bookings.length !== 1 ? 's' : ''} for {MONTHS[gregDate.getMonth()]} {cell.day}, {gregDate.getFullYear()}
          </div>
        )}
      </div>

      {/* ── Approve / Revert Raza confirm ── */}
      <ConfirmModal
        open={!!razaModal}
        title={razaModal?.type === 'approve' ? 'Approve Raza' : 'Revert Raza'}
        message={
          razaModal?.type === 'approve'
            ? <span>Are you sure to Approve Sr# <strong>{srLabel(razaModal?.booking ?? {})}</strong>?</span>
            : <span>Are you sure to revert Sr# <strong>{srLabel(razaModal?.booking ?? {})}</strong> back to <strong>Raza Pending</strong>?</span>
        }
        confirmLabel={razaModal?.type === 'approve' ? 'Yes, Approve' : 'Yes, Revert'}
        confirmClassName={razaModal?.type === 'approve'
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-orange-500 hover:bg-orange-600 text-white'}
        ConfirmIcon={razaModal?.type === 'approve' ? CheckIcon : RefreshIcon}
        onConfirm={handleConfirmRaza}
        onCancel={() => setRazaModal(null)}
      />

      {/* ── Delete confirm ── */}
      <ConfirmModal
        open={!!deleteModal}
        title="Delete Event"
        message={<span>Delete Sr# <strong>{srLabel(deleteModal ?? {})}</strong>? This action cannot be undone.</span>}
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        ConfirmIcon={TrashIcon}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </>
  );
}
