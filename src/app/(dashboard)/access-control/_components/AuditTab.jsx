'use client';

import { useState } from 'react';
import { TrashIcon } from '@/components/shared/Icons';
import Modal from '@/components/shared/Modal';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';
import { fmtTime, actionColor } from './constants';

const PAGE_SIZES = [50, 100, 250, 500, 1000, 'All'];
const CONFIRM_WORD = 'delete';

export default function AuditTab({ auditLogs, auditTotal, auditPage, setAuditPage, pageSize, setPageSize, loading, onRefresh }) {
  const [clearModal, setClearModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(auditTotal / pageSize);

  const handlePageSize = (val) => {
    setPageSize(val === 'All' ? 'All' : Number(val));
    setAuditPage(1);
  };

  const openClearModal = () => {
    setConfirmText('');
    setClearModal(true);
  };

  const doClear = async () => {
    setClearing(true);
    try {
      await rbacService.clearAuditLogs();
      toast.success('Audit logs cleared');
      setClearModal(false);
      setAuditPage(1);
      onRefresh();
    } catch {
      toast.error('Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy-800">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold text-white">Audit Log</span>
            <span className="text-[11px] font-bold bg-white/15 text-white/90 px-2 py-0.5 rounded-full">
              {auditTotal} records
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-white/60">Rows per page</span>
            <select
              className="py-1 px-2 text-[12px] rounded-md bg-white/10 border border-white/20 text-white focus:outline-none"
              value={pageSize}
              onChange={e => handlePageSize(e.target.value)}
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>
              ))}
            </select>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-[12px] font-semibold border border-red-400/50 transition-colors"
              onClick={openClearModal}
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Time', 'Actor', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} className="th-navy text-[12px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-[14px]">Loading…</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-500 text-[14px]">No records found</td></tr>
              ) : auditLogs.map(l => (
                <tr key={l.id} className="group hover:bg-blue-50/70 transition-colors">
                  <td className="px-4 py-3.5 border-l-[3px] border-l-transparent group-hover:border-l-blue-500 whitespace-nowrap transition-colors">
                    <span className="text-[12.5px] text-gray-600 font-medium">{fmtTime(l.created_at)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-bold text-navy-900">{l.actor_username || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11.5px] font-bold font-mono px-2.5 py-1 rounded-md ${actionColor(l.action)}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-gray-800 capitalize">{l.entity_type}</span>
                    {l.entity_id && (
                      <span className="text-[12px] text-gray-400 ml-1">#{l.entity_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <span className="text-[12px] text-gray-600 truncate block">
                      {l.new_value
                        ? JSON.stringify(typeof l.new_value === 'string' ? JSON.parse(l.new_value) : l.new_value)
                        : <span className="text-gray-400 italic">—</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
          <span className="text-[13px] font-medium text-gray-600">
            {pageSize === 'All'
              ? `Showing all ${auditTotal} records`
              : `Page ${auditPage} of ${totalPages || 1} · ${auditTotal} total`}
          </span>
          {pageSize !== 'All' && (
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm px-4"
                disabled={auditPage === 1}
                onClick={() => setAuditPage(p => p - 1)}
              >← Prev</button>
              <button
                className="btn btn-secondary btn-sm px-4"
                disabled={auditPage >= totalPages}
                onClick={() => setAuditPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Clear logs confirmation modal */}
      <Modal
        open={clearModal}
        onClose={() => setClearModal(false)}
        size="sm"
        title="Clear All Audit Logs"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setClearModal(false)} disabled={clearing}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={doClear}
              disabled={confirmText !== CONFIRM_WORD || clearing}
            >
              <TrashIcon className="w-3.5 h-3.5 mr-1.5" />
              {clearing ? 'Clearing…' : 'Clear All Logs'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] text-red-700">
            This will permanently delete <span className="font-bold">all {auditTotal} audit log records</span>. This action cannot be undone.
          </div>
          <div>
            <label className="form-label">
              Type <span className="font-mono font-bold text-red-600">delete</span> to confirm
            </label>
            <input
              className="form-input"
              placeholder="Type delete to confirm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>
          {confirmText.length > 0 && confirmText !== CONFIRM_WORD && (
            <p className="text-[12px] text-red-500">Must type exactly "delete" to proceed</p>
          )}
        </div>
      </Modal>
    </>
  );
}
