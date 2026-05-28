'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { waQueueService } from '@/services';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function etaStr(pending) {
  if (!pending || pending <= 0) return null;
  const secs = pending * 18.5 + Math.floor(pending / 7.5) * 35;
  if (secs < 60)   return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)} min`;
  return `~${(secs / 3600).toFixed(1)} hrs`;
}

const STATUS_BADGE = {
  active:    { cls: 'bg-blue-100 text-blue-700',   label: 'Sending'   },
  paused:    { cls: 'bg-amber-100 text-amber-700',  label: 'Paused'    },
  completed: { cls: 'bg-green-100 text-green-700',  label: 'Completed' },
  cancelled: { cls: 'bg-gray-100 text-gray-500',    label: 'Cancelled' },
  failed:    { cls: 'bg-red-100 text-red-600',      label: 'Failed'    },
};

function StatusBadge({ status }) {
  const m = STATUS_BADGE[status] || STATUS_BADGE.active;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

const ITEM_STATUS_META = {
  pending:  { cls: 'text-gray-500',  label: 'Pending'   },
  queued:   { cls: 'text-gray-500',  label: 'Queued'    },
  typing:   { cls: 'text-blue-500',  label: 'Typing…'   },
  sending:  { cls: 'text-blue-600',  label: 'Sending…'  },
  sent:     { cls: 'text-green-700', label: 'Sent ✓'    },
  failed:   { cls: 'text-red-600',   label: 'Failed ✕'  },
  skipped:  { cls: 'text-gray-400',  label: 'Skipped'   },
  cancelled:{ cls: 'text-gray-400',  label: 'Cancelled' },
  retrying: { cls: 'text-amber-600', label: 'Retrying'  },
};

// ── Per-batch card ─────────────────────────────────────────────────────────────
function BatchCard({ batch, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [items,    setItems]    = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const sent      = Number(batch.sent    || 0);
  const failed    = Number(batch.failed  || 0);
  const skipped   = Number(batch.skipped || 0);
  const pending   = Number(batch.pending || 0);
  const total     = Number(batch.total   || 0);
  const done      = sent + failed + skipped;
  const progress  = total > 0 ? Math.round((done / total) * 100) : 0;

  async function loadItems() {
    if (items) { setExpanded(e => !e); return; }
    setLoadingItems(true);
    try {
      const res = await waQueueService.items(batch.batch_id);
      setItems(res.data?.data || []);
      setExpanded(true);
    } catch { /* ignore */ } finally {
      setLoadingItems(false);
    }
  }

  // Re-fetch items when expanded and batch is active (refresh from parent poll)
  useEffect(() => {
    if (!expanded || !['active','paused'].includes(batch.status)) return;
    waQueueService.items(batch.batch_id)
      .then(res => setItems(res.data?.data || []))
      .catch(() => {});
  }, [batch, expanded]);

  const isActive = batch.status === 'active';
  const isPaused = batch.status === 'paused';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white">
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isActive ? 'bg-blue-500 animate-pulse' :
          isPaused ? 'bg-amber-400' :
          batch.status === 'completed' ? 'bg-green-500' :
          'bg-gray-300'
        }`} />

        {/* Label + time */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-gray-800 truncate">
            {batch.label || 'Due Reminder Batch'}
          </div>
          <div className="text-[10px] text-gray-400">
            {fmtTime(batch.created_at)} · {batch.created_by || '—'}
            {batch.processing_name && isActive && (
              <span className="ml-2 text-blue-500 font-medium">
                ⌨️ {batch.processing_name}
              </span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="text-[11px] text-gray-600 whitespace-nowrap">
          {done}/{total}
        </div>

        {/* Status badge */}
        <StatusBadge status={batch.status} />

        {/* ETA */}
        {isActive && pending > 0 && (
          <div className="text-[10px] text-gray-400 whitespace-nowrap">
            {etaStr(pending)}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1 ml-1">
          {isActive  && <ActionBtn label="Pause"  cls="text-amber-600 border-amber-200 hover:bg-amber-50"  onClick={() => onAction('pause',  batch.batch_id)} />}
          {isPaused  && <ActionBtn label="Resume" cls="text-blue-600  border-blue-200  hover:bg-blue-50"   onClick={() => onAction('resume', batch.batch_id)} />}
          {(isActive || isPaused) && (
            <ActionBtn label="Cancel" cls="text-red-500 border-red-200 hover:bg-red-50" onClick={() => onAction('cancel', batch.batch_id)} />
          )}
          {batch.status === 'failed' && (
            <ActionBtn label="Retry"  cls="text-green-600 border-green-200 hover:bg-green-50" onClick={() => onAction('retry', batch.batch_id)} />
          )}
          <button
            onClick={loadItems}
            className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {loadingItems ? '…' : expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 w-full">
        <div
          className={`h-1 transition-all duration-500 ${
            batch.status === 'completed' ? 'bg-green-400' :
            batch.status === 'failed'    ? 'bg-red-400'   :
            'bg-blue-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Counters */}
      <div className="grid grid-cols-4 divide-x divide-border bg-gray-50 text-center text-[10px]">
        {[
          { label: 'Sent',    val: sent,    cls: 'text-green-700' },
          { label: 'Failed',  val: failed,  cls: 'text-red-600'   },
          { label: 'Skipped', val: skipped, cls: 'text-gray-500'  },
          { label: 'Pending', val: pending, cls: 'text-blue-600'  },
        ].map(c => (
          <div key={c.label} className="py-1.5">
            <div className={`text-[13px] font-bold ${c.cls}`}>{c.val}</div>
            <div className="text-gray-400">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Expanded items table */}
      {expanded && items && (
        <div className="max-h-60 overflow-y-auto border-t border-border">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-navy-900 text-white z-10">
              <tr>
                {['#', 'Name', 'Acc No', 'Mobile', 'Status', 'Note'].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400">No items</td></tr>
              ) : items.map(it => {
                const meta = ITEM_STATUS_META[it.status] || ITEM_STATUS_META.pending;
                return (
                  <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-400">{it.seq}</td>
                    <td className="px-2 py-1.5 font-medium max-w-[110px] truncate">{it.full_name || '—'}</td>
                    <td className="px-2 py-1.5 text-blue-600 font-semibold">{it.accno || '—'}</td>
                    <td className="px-2 py-1.5">{it.mobile || '—'}</td>
                    <td className="px-2 py-1.5">
                      <span className={`font-semibold ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-400 max-w-[130px] truncate" title={it.error_msg || ''}>
                      {it.error_msg || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, cls, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] border rounded px-1.5 py-0.5 font-medium transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function WAQueuePanel() {
  const [batches,   setBatches]   = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const timerRef = useRef(null);

  const hasActive = batches.some(b => ['active','paused'].includes(b.status));

  const fetchBatches = useCallback(async () => {
    try {
      const res = await waQueueService.recent(10);
      setBatches(res.data?.data || []);
    } catch { /* network error — keep previous data */ } finally {
      setLoading(false);
    }
  }, []);

  // Auto-poll: every 5s when active, every 20s otherwise
  useEffect(() => {
    function scheduleNext() {
      const delay = hasActive ? 5_000 : 20_000;
      timerRef.current = setTimeout(async () => {
        await fetchBatches();
        scheduleNext();
      }, delay);
    }

    fetchBatches();
    scheduleNext();

    return () => clearTimeout(timerRef.current);
  }, [fetchBatches, hasActive]);

  async function handleAction(action, batchId) {
    try {
      const fn = waQueueService[action];
      const res = await fn(batchId);
      if (res.data?.success) {
        toast.success(res.data.message || `${action} successful`);
        await fetchBatches();
      } else {
        toast.error(res.data?.message || `${action} failed`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} failed`);
    }
  }

  // Don't show panel at all if never loaded or no batches
  if (loading) return null;
  if (!batches.length) return null;

  const activeCount = batches.filter(b => b.status === 'active').length;

  return (
    <div className="mb-4 border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Panel header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-900 text-white hover:bg-navy-800 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
          )}
          <span className="text-[12px] font-semibold">
            📤 WhatsApp Queue
          </span>
          {activeCount > 0 ? (
            <span className="text-[11px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-semibold">
              {activeCount} active
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">
              {batches.length} recent batch{batches.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Panel body */}
      {!collapsed && (
        <div className="p-3 bg-white space-y-2">
          {batches.map(b => (
            <BatchCard key={b.batch_id} batch={b} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
