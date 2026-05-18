'use client';

import { useState } from 'react';
import { TrashIcon } from '@/components/shared/Icons';
import Modal from '@/components/shared/Modal';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';
import { fmtTime } from './constants';

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
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            Audit Log
            <span className="badge badge-blue">{auditTotal} records</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Page size selector */}
            <span className="text-[11px] text-gray-500">Rows per page</span>
            <select
              className="form-input py-1 text-[12px] w-auto pr-7"
              value={pageSize}
              onChange={e => handlePageSize(e.target.value)}
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Clear logs button */}
            <button className="btn btn-danger btn-sm" onClick={openClearModal}>
              <TrashIcon className="w-3.5 h-3.5 mr-1" />Clear Logs
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Time', 'Actor', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : auditLogs.map(l => (
                <tr key={l.id} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2 border-t border-border text-gray-500 whitespace-nowrap">
                    {fmtTime(l.created_at)}
                  </td>
                  <td className="px-3 py-2 border-t border-border font-semibold">
                    {l.actor_username || '—'}
                  </td>
                  <td className="px-3 py-2 border-t border-border">
                    <span className={`badge text-[10px] ${
                      l.action === 'login'          ? 'badge-green' :
                      l.action === 'create'         ? 'badge-blue'  :
                      l.action === 'update'         ? 'badge-amber' :
                      l.action === 'reset_password' ? 'badge-gray'  : 'badge-red'
                    }`}>{l.action}</span>
                  </td>
                  <td className="px-3 py-2 border-t border-border capitalize text-gray-600">
                    {l.entity_type} {l.entity_id ? `#${l.entity_id}` : ''}
                  </td>
                  <td className="px-3 py-2 border-t border-border text-[11px] text-gray-400 max-w-xs truncate">
                    {l.new_value
                      ? JSON.stringify(typeof l.new_value === 'string' ? JSON.parse(l.new_value) : l.new_value)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-[12px] text-gray-500">
            {pageSize === 'All'
              ? `Showing all ${auditTotal} records`
              : `Page ${auditPage} of ${totalPages || 1} · ${auditTotal} total`}
          </span>
          {pageSize !== 'All' && (
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditPage === 1}
                onClick={() => setAuditPage(p => p - 1)}
              >Prev</button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditPage >= totalPages}
                onClick={() => setAuditPage(p => p + 1)}
              >Next</button>
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
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-[12.5px] text-red-700">
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
            <p className="text-[11px] text-red-500">Must type exactly "delete" to proceed</p>
          )}
        </div>
      </Modal>
    </>
  );
}
