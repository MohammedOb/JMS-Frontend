import { useState } from 'react';
import { FIELDS, PAGE_SIZES } from './constants';
import { fmtDate } from '@/utils/dateUtils';
import { EditIcon, TrashIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';

// ── Inline icons (no shared icon for lock/unlock) ─────────────────────────────
function LockCloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function LockOpenIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// ── ConfirmModal — same pattern as Raza status in DayEventList ────────────────
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
          <button className={`btn btn-sm flex items-center gap-1.5 ${confirmClassName}`} onClick={onConfirm}>
            {ConfirmIcon && <ConfirmIcon className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function feedbackUrl(token) {
  if (!token || typeof window === 'undefined') return '';
  return `${window.location.origin}/feedback/menu/${token}`;
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const isClosed = (r) => !!(r.feedback_close_date && todayISO() > String(r.feedback_close_date).slice(0, 10));

function RatingBadge({ avg, count }) {
  if (!count) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-yellow-400 text-[13px]">★</span>
      <span className="font-medium text-gray-700">{avg}</span>
      <span className="text-gray-400 text-[11px]">({count})</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MenuTable({ rows, loading, onEdit, onDelete, onViewFeedback, onForceClose, onRevertClose }) {
  const [pageSize,  setPageSize]  = useState(30);
  const [confirmState, setConfirmState] = useState(null); // { type: 'close'|'reopen', row }

  const displayed = pageSize === 'All' ? rows : rows.slice(0, pageSize);
  const colSpan   = FIELDS.length + 5; // Date + Type + Event + Rating + fields + actions

  const handleConfirm = () => {
    if (!confirmState) return;
    if (confirmState.type === 'close')  onForceClose(confirmState.row);
    if (confirmState.type === 'reopen') onRevertClose(confirmState.row);
    setConfirmState(null);
  };

  return (
    <>
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.type === 'close' ? 'Close Feedback' : 'Reopen Feedback'}
        message={
          confirmState?.type === 'close'
            ? <span>Close feedback for <strong>{confirmState?.row?.meal_type}</strong> – <strong>{fmtDate(confirmState?.row?.menu_date)}</strong>? The link will stop working immediately.</span>
            : <span>Reopen feedback for <strong>{confirmState?.row?.meal_type}</strong> – <strong>{fmtDate(confirmState?.row?.menu_date)}</strong>? It will be open for <strong>4 more days</strong>.</span>
        }
        confirmLabel={confirmState?.type === 'close' ? 'Yes, Close' : 'Yes, Reopen'}
        confirmClassName={confirmState?.type === 'close'
          ? 'bg-orange-500 hover:bg-orange-600 text-white border-0'
          : 'bg-green-600 hover:bg-green-700 text-white border-0'}
        ConfirmIcon={confirmState?.type === 'close' ? LockCloseIcon : LockOpenIcon}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />

      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <span>Menu Schedule</span>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-gray-400">{rows.length} records</span>
            <select
              className="form-select py-0.5 px-2 text-[12px] w-auto"
              value={pageSize}
              onChange={e => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Date', 'Meal Type', 'Event', 'Rating', ...FIELDS.map(f => f.label), ''].map(h => (
                  <th key={h} className="th-navy whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colSpan} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={colSpan} className="text-center py-10 text-gray-400">No menu entries</td></tr>
              ) : displayed.map((r, i) => {
                const closed = isClosed(r);
                return (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border whitespace-nowrap">{fmtDate(r.menu_date)}</td>
                    <td className="px-3 py-2 border-t border-border font-medium">{r.meal_type}</td>
                    <td className="px-3 py-2 border-t border-border text-gray-600">{r.event || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 border-t border-border">
                      <RatingBadge avg={r.avg_overall_rating} count={r.feedback_count} />
                    </td>
                    {FIELDS.map(f => (
                      <td key={f.key} className="px-3 py-2 border-t border-border text-gray-600">
                        {r[f.key] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-t border-border">
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Force close / Revert close */}
                        {!closed ? (
                          <button
                            className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white border-0"
                            title="Close feedback now"
                            onClick={() => setConfirmState({ type: 'close', row: r })}
                          >
                            <LockCloseIcon className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-0"
                            title="Reopen feedback (+4 days from today)"
                            onClick={() => setConfirmState({ type: 'reopen', row: r })}
                          >
                            <LockOpenIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Share feedback link */}
                        <button
                          className="btn btn-secondary btn-sm"
                          title={r.feedback_token ? 'Copy feedback link' : 'No feedback token (run migration)'}
                          disabled={!r.feedback_token}
                          onClick={() => {
                            navigator.clipboard.writeText(feedbackUrl(r.feedback_token));
                            toast.success('Feedback link copied');
                          }}
                        >
                          🔗
                        </button>
                        {/* View responses */}
                        <button
                          className="btn btn-secondary btn-sm"
                          title="View feedback responses"
                          onClick={() => onViewFeedback(r)}
                        >
                          📊
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(r)}>
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(r)}>
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
