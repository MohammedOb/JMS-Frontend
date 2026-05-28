'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { waQueueService, whatsappService } from '@/services';
import {
  RefreshIcon, ZapIcon, XIcon, DownloadIcon, ChevronDownIcon,
} from '@/components/shared/Icons';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (dt) => dt
  ? new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const fmtTime = (dt) => dt
  ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '—';

function etaStr(pending) {
  if (!pending || pending <= 0) return null;
  const secs = pending * 18.5 + Math.floor(pending / 7.5) * 35;
  if (secs < 60)   return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)} min`;
  return `~${(secs / 3600).toFixed(1)} hrs`;
}

function pct(n, total) {
  if (!total) return 0;
  return Math.round((Number(n) / Number(total)) * 100);
}

// ── Status badge ──────────────────────────────────────────────────────────────
const BATCH_STATUS = {
  active:    { cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500 animate-pulse', label: 'Active'    },
  paused:    { cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400',              label: 'Paused'    },
  completed: { cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500',              label: 'Completed' },
  cancelled: { cls: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-300',               label: 'Cancelled' },
  failed:    { cls: 'bg-red-100 text-red-600',      dot: 'bg-red-400',                label: 'Failed'    },
};

function BatchBadge({ status }) {
  const m = BATCH_STATUS[status] || BATCH_STATUS.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const ITEM_STATUS = {
  pending:   { cls: 'text-gray-400',  label: 'Pending'   },
  queued:    { cls: 'text-gray-500',  label: 'Queued'    },
  typing:    { cls: 'text-blue-500',  label: 'Typing…'   },
  sending:   { cls: 'text-blue-600',  label: 'Sending…'  },
  sent:      { cls: 'text-green-700', label: 'Sent ✓'    },
  failed:    { cls: 'text-red-600',   label: 'Failed ✕'  },
  skipped:   { cls: 'text-gray-400',  label: 'Skipped'   },
  cancelled: { cls: 'text-gray-300',  label: 'Cancelled' },
  retrying:  { cls: 'text-amber-500', label: 'Retrying'  },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:  'bg-blue-50  border-blue-100  text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    red:   'bg-red-50   border-red-100   text-red-600',
    gray:  'bg-gray-50  border-gray-200  text-gray-600',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className="text-[28px] font-bold leading-none">{value}</div>
      {sub && <div className="text-[11px] opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ sent, failed, skipped, total, status }) {
  const n = Number(total) || 0;
  const s = pct(sent, n);
  const f = pct(failed, n);
  const k = pct(skipped, n);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
      <div className="h-full bg-green-500 transition-all" style={{ width: `${s}%` }} />
      <div className="h-full bg-red-400  transition-all" style={{ width: `${f}%` }} />
      <div className="h-full bg-gray-300 transition-all" style={{ width: `${k}%` }} />
    </div>
  );
}

// ── Batch Items Drawer ────────────────────────────────────────────────────────
function BatchItemsTable({ batchId, onClose }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    waQueueService.items(batchId)
      .then(r => setItems(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  function exportCSV() {
    const csv = [
      'Seq,Acc No,Name,Mobile,Hub Sub Head,Due Amount,Status,Error,Started,Completed',
      ...items.map(it => [
        it.seq, it.accno, it.full_name, it.mobile,
        it.hub_sub_head, it.due_amount || '',
        it.status, (it.error_msg || '').replace(/"/g, '""'),
        fmtTime(it.started_at), fmtTime(it.completed_at),
      ].map(v => `"${v ?? ''}"`).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `batch-${batchId.slice(0,8)}.csv` }).click();
    URL.revokeObjectURL(url);
  }

  const visible = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts = {};
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm mt-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-700">
            {items.length} messages
          </span>
          {/* Status filter pills */}
          <div className="flex gap-1">
            {['all', 'pending', 'sent', 'failed', 'skipped', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  filter === s
                    ? 'bg-navy-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? `All (${items.length})` : `${s} (${counts[s] || 0})`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="text-[11px] flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <DownloadIcon className="w-3.5 h-3.5" />CSV
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-[13px]">Loading…</div>
        ) : (
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-navy-900 text-white z-10">
              <tr>
                {['#','Name','Acc No','Mobile','Hub Sub Head','Due Amt','Status','Error','Time'].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No items</td></tr>
              ) : visible.map(it => {
                const sm = ITEM_STATUS[it.status] || ITEM_STATUS.pending;
                return (
                  <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-400">{it.seq}</td>
                    <td className="px-2 py-1.5 font-medium max-w-[100px] truncate">{it.full_name || '—'}</td>
                    <td className="px-2 py-1.5 text-blue-600 font-semibold">{it.accno || '—'}</td>
                    <td className="px-2 py-1.5">{it.mobile || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-500 max-w-[100px] truncate">{it.hub_sub_head || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600">
                      {it.due_amount ? `₹${Number(it.due_amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`font-semibold ${sm.cls}`}>{sm.label}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-400 max-w-[130px] truncate" title={it.error_msg || ''}>
                      {it.error_msg || ''}
                    </td>
                    <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">
                      {it.status === 'sent' || it.status === 'failed' || it.status === 'skipped'
                        ? fmtTime(it.completed_at)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Batch Row ─────────────────────────────────────────────────────────────────
function BatchRow({ batch, expanded, onExpand, onAction, isRefreshing }) {
  const sent    = Number(batch.sent    || 0);
  const failed  = Number(batch.failed  || 0);
  const skipped = Number(batch.skipped || 0);
  const pending = Number(batch.pending || 0);
  const total   = Number(batch.total   || 0);
  const done    = sent + failed + skipped;
  const isActive = batch.status === 'active';
  const isPaused = batch.status === 'paused';
  const hasFailed = failed > 0 && !['active','paused'].includes(batch.status);

  return (
    <>
      <tr
        className="border-t border-border hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onExpand}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {(isActive || isPaused) && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'}`} />
            )}
            <div>
              <div className="text-[12px] font-semibold text-gray-800 max-w-[220px] truncate">
                {batch.label || 'Due Reminder Batch'}
              </div>
              <div className="text-[10px] text-gray-400">{batch.created_by || '—'}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
          {fmtDate(batch.created_at)}
        </td>
        <td className="px-3 py-2.5">
          <div className="space-y-1 min-w-[100px]">
            <ProgressBar sent={sent} failed={failed} skipped={skipped} total={total} status={batch.status} />
            <div className="text-[10px] text-gray-400">{done}/{total}</div>
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-[12px] font-semibold text-green-700">{sent}</td>
        <td className="px-3 py-2.5 text-center text-[12px] font-semibold text-red-600">{failed}</td>
        <td className="px-3 py-2.5 text-center text-[12px] text-gray-400">{skipped}</td>
        <td className="px-3 py-2.5 text-center text-[12px] text-blue-600">{pending}</td>
        <td className="px-3 py-2.5">
          <BatchBadge status={batch.status} />
          {isActive && pending > 0 && (
            <div className="text-[10px] text-gray-400 mt-0.5">{etaStr(pending)}</div>
          )}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {isActive  && <CtrlBtn label="Pause"  cls="text-amber-600 border-amber-200" onClick={() => onAction('pause',  batch.batch_id)} />}
            {isPaused  && <CtrlBtn label="Resume" cls="text-blue-600  border-blue-200"  onClick={() => onAction('resume', batch.batch_id)} />}
            {(isActive || isPaused) && <CtrlBtn label="Cancel" cls="text-red-500 border-red-200" onClick={() => onAction('cancel', batch.batch_id)} />}
            {hasFailed && <CtrlBtn label="Retry"  cls="text-green-700 border-green-200" onClick={() => onAction('retry',  batch.batch_id)} />}
            <button
              onClick={onExpand}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              title="Toggle items"
            >
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded items */}
      {expanded && (
        <tr>
          <td colSpan={9} className="px-3 pb-3">
            <BatchItemsTable batchId={batch.batch_id} onClose={onExpand} />
          </td>
        </tr>
      )}
    </>
  );
}

function CtrlBtn({ label, cls, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] border rounded px-1.5 py-0.5 font-medium transition-colors hover:opacity-80 ${cls}`}
    >
      {label}
    </button>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'paused',    label: 'Paused'    },
  { key: 'completed', label: 'Completed' },
  { key: 'failed',    label: 'Failed'    },
  { key: 'cancelled', label: 'Cancelled' },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function WAQueueAdminPage() {
  const [batches,    setBatches]    = useState([]);
  const [waStatus,   setWaStatus]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const timerRef = useRef(null);

  const hasActive = batches.some(b => b.status === 'active');

  const fetchAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [bRes, wRes] = await Promise.all([
        waQueueService.recent(50),
        whatsappService.getStatus(),
      ]);
      setBatches(bRes.data?.data || []);
      setWaStatus(wRes.data);
    } catch { /* keep prev data */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    function schedule() {
      timerRef.current = setTimeout(async () => {
        await fetchAll();
        schedule();
      }, hasActive ? 5_000 : 15_000);
    }
    schedule();
    return () => clearTimeout(timerRef.current);
  }, [fetchAll, hasActive]);

  async function handleAction(action, batchId) {
    try {
      const res = await waQueueService[action](batchId);
      if (res.data?.success) {
        toast.success(res.data.message || `${action} successful`);
        await fetchAll();
      } else {
        toast.error(res.data?.message || `${action} failed`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} failed`);
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayBatches = batches.filter(b => new Date(b.created_at).toDateString() === today);
  const stats = {
    activeBatches:  batches.filter(b => b.status === 'active').length,
    pausedBatches:  batches.filter(b => b.status === 'paused').length,
    pendingMsgs:    batches.reduce((s, b) =>
      ['active','paused'].includes(b.status) ? s + Number(b.pending || 0) : s, 0),
    sentToday:      todayBatches.reduce((s, b) => s + Number(b.sent    || 0), 0),
    failedToday:    todayBatches.reduce((s, b) => s + Number(b.failed  || 0), 0),
    totalToday:     todayBatches.reduce((s, b) => s + Number(b.total   || 0), 0),
    completedToday: todayBatches.filter(b => b.status === 'completed').length,
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredBatches = filter === 'all' ? batches : batches.filter(b => b.status === filter);
  const filterCounts = {};
  FILTERS.forEach(f => {
    filterCounts[f.key] = f.key === 'all' ? batches.length : batches.filter(b => b.status === f.key).length;
  });

  // ── WA status banner ───────────────────────────────────────────────────────
  const waConnected = waStatus?.status === 'connected';

  return (
    <div className="space-y-5">
      <PageHeader
        title="WhatsApp Queue"
        subtitle="Monitor background message sending queue and batch history"
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
        >
          <RefreshIcon className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </PageHeader>

      {/* WA Connection status bar */}
      {waStatus && (
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[12px] font-medium ${
          waConnected
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <ZapIcon className="w-4 h-4 flex-shrink-0" />
          <span>
            WhatsApp: <strong>{waConnected ? 'Connected' : (waStatus.status || 'Disconnected')}</strong>
            {!waConnected && (
              <span className="ml-2 font-normal opacity-75">
                — Queue is paused. Go to{' '}
                <a href="/whatsapp-status" className="underline">WA Status</a> to reconnect.
              </span>
            )}
          </span>
          {waConnected && waStatus.phone && (
            <span className="ml-auto text-green-600 text-[11px] opacity-80">{waStatus.phone}</span>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Active Batches"
          value={stats.activeBatches}
          sub={stats.pausedBatches > 0 ? `${stats.pausedBatches} paused` : 'sending now'}
          color={stats.activeBatches > 0 ? 'blue' : 'gray'}
        />
        <StatCard
          label="Pending Messages"
          value={stats.pendingMsgs}
          sub={stats.pendingMsgs > 0 ? `ETA ${etaStr(stats.pendingMsgs)}` : 'queue empty'}
          color={stats.pendingMsgs > 0 ? 'amber' : 'gray'}
        />
        <StatCard
          label="Sent Today"
          value={stats.sentToday}
          sub={`of ${stats.totalToday} total`}
          color="green"
        />
        <StatCard
          label="Failed Today"
          value={stats.failedToday}
          sub={stats.failedToday > 0 ? 'needs attention' : 'all good'}
          color={stats.failedToday > 0 ? 'red' : 'gray'}
        />
        <StatCard
          label="Batches Today"
          value={todayBatches.length}
          sub={`${stats.completedToday} completed`}
          color="gray"
        />
      </div>

      {/* Active / paused batches quick panel */}
      {(stats.activeBatches > 0 || stats.pausedBatches > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="text-[12px] font-semibold text-blue-700 mb-2">
            🔵 Active Queue
          </div>
          {batches.filter(b => ['active','paused'].includes(b.status)).map(b => {
            const sent    = Number(b.sent    || 0);
            const failed  = Number(b.failed  || 0);
            const skipped = Number(b.skipped || 0);
            const pending = Number(b.pending || 0);
            const total   = Number(b.total   || 0);
            const done    = sent + failed + skipped;
            return (
              <div key={b.batch_id} className="bg-white rounded-lg border border-blue-100 px-3 py-2.5 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-gray-800 truncate">{b.label}</div>
                  <div className="text-[10px] text-gray-400">
                    {fmtDate(b.created_at)} · {b.created_by}
                    {b.processing_name && (
                      <span className="ml-2 text-blue-500">⌨️ {b.processing_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-green-700 font-semibold">{sent} sent</span>
                  {failed > 0 && <span className="text-red-600 font-semibold">{failed} failed</span>}
                  <span className="text-blue-600">{pending} pending</span>
                  <span className="text-gray-400">{done}/{total}</span>
                  {etaStr(pending) && <span className="text-gray-400">{etaStr(pending)}</span>}
                </div>
                <div className="w-full">
                  <ProgressBar sent={sent} failed={failed} skipped={skipped} total={total} />
                </div>
                <div className="flex gap-1.5 ml-auto">
                  <BatchBadge status={b.status} />
                  {b.status === 'active'  && <CtrlBtn label="Pause"  cls="text-amber-600 border-amber-200" onClick={() => handleAction('pause',  b.batch_id)} />}
                  {b.status === 'paused'  && <CtrlBtn label="Resume" cls="text-blue-600  border-blue-200"  onClick={() => handleAction('resume', b.batch_id)} />}
                  <CtrlBtn label="Cancel" cls="text-red-500 border-red-200" onClick={() => handleAction('cancel', b.batch_id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All batches table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">

        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
          <div className="text-[13px] font-semibold text-gray-700">Batch History</div>
          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-navy-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {filterCounts[f.key] > 0 && (
                  <span className="ml-1 opacity-70">({filterCounts[f.key]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2" />
            Loading queue…
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-[13px]">No batches found</div>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="mt-2 text-[12px] text-blue-500 hover:underline">
                Show all
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-left">
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Batch / Label</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 whitespace-nowrap">Created</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 min-w-[120px]">Progress</th>
                  <th className="px-3 py-2.5 font-semibold text-green-700 text-center">Sent</th>
                  <th className="px-3 py-2.5 font-semibold text-red-600   text-center">Failed</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-400  text-center">Skipped</th>
                  <th className="px-3 py-2.5 font-semibold text-blue-600  text-center">Pending</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <BatchRow
                    key={b.batch_id}
                    batch={b}
                    expanded={expandedId === b.batch_id}
                    onExpand={() => setExpandedId(id => id === b.batch_id ? null : b.batch_id)}
                    onAction={handleAction}
                    isRefreshing={refreshing}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
