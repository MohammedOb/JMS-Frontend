'use client';

import { useState, useEffect, useRef } from 'react';
import { whatsappService } from '@/services';
import PageHeader from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

// ── Status definitions ────────────────────────────────────────────────────────
const STATUS_UI = {
  connected:    { label: 'Connected',       dot: 'bg-green-500',  banner: 'bg-green-50  border-green-200  text-green-800'  },
  qr_ready:     { label: 'Scan QR Code',    dot: 'bg-amber-400',  banner: 'bg-amber-50  border-amber-200  text-amber-800'  },
  starting:     { label: 'Starting…',       dot: 'bg-blue-400',   banner: 'bg-blue-50   border-blue-200   text-blue-800'   },
  reconnecting: { label: 'Reconnecting…',   dot: 'bg-orange-400', banner: 'bg-orange-50 border-orange-200 text-orange-800' },
  disconnected: { label: 'Disconnected',    dot: 'bg-gray-400',   banner: 'bg-gray-50   border-gray-200   text-gray-700'   },
  error:        { label: 'Error',           dot: 'bg-red-500',    banner: 'bg-red-50    border-red-200    text-red-800'    },
};

// Steps shown in order during 'starting' phase
const INIT_STAGES = [
  { key: 'launching',      label: 'Launching Browser' },
  { key: 'loading_wa',     label: 'Loading WhatsApp Web' },
  { key: 'restoring',      label: 'Restoring Session' },
  { key: 'waiting_qr',     label: 'Generating QR Code' },
  { key: 'authenticating', label: 'Authenticating' },
];

function stageIndex(key) {
  return INIT_STAGES.findIndex(s => s.key === key);
}

function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) +
    ', ' + d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtLogTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ── Stage progress component ──────────────────────────────────────────────────
function StageProgress({ initStage }) {
  const current = stageIndex(initStage);
  return (
    <div className="space-y-1 pt-1">
      {INIT_STAGES.map((s, i) => {
        const done    = current > i;
        const active  = current === i;
        const pending = current < i;
        return (
          <div key={s.key} className="flex items-center gap-2 text-[12px]">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
              ${done    ? 'bg-green-500 text-white'
              : active  ? 'bg-blue-500 text-white animate-pulse'
              : 'bg-gray-200 text-gray-400'}`}>
              {done ? '✓' : i + 1}
            </span>
            <span className={
              done    ? 'text-green-700 font-medium' :
              active  ? 'text-blue-700 font-semibold' :
              'text-gray-400'
            }>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Log viewer ────────────────────────────────────────────────────────────────
function LogViewer({ logs }) {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [open, logs]);

  if (!logs?.length) return null;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100"
        onClick={() => setOpen(o => !o)}
      >
        <span>Connection Logs ({logs.length})</span>
        <span className="text-[10px]">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="max-h-40 overflow-y-auto bg-gray-900 p-2 space-y-0.5 font-mono text-[10.5px]">
          {logs.map((l, i) => (
            <div key={i} className={`flex gap-2 ${l.level === 'error' ? 'text-red-400' : 'text-green-300'}`}>
              <span className="text-gray-500 shrink-0">{fmtLogTime(l.ts)}</span>
              <span>{l.msg}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WhatsAppStatusPage() {
  const [data,         setData]         = useState(null);
  const [fetching,     setFetching]     = useState(true);
  const [actionBusy,   setActionBusy]   = useState(false);  // any button in-flight
  const [fetchErr,     setFetchErr]     = useState(null);
  const [startingAt,   setStartingAt]   = useState(null);
  const [elapsed,      setElapsed]      = useState(0);
  const intervalRef  = useRef(null);
  const elapsedRef   = useRef(null);

  // ── Fetch status ────────────────────────────────────────────────────────────
  const fetchStatus = async (silent = false) => {
    if (!silent) setFetching(true);
    setFetchErr(null);
    try {
      const res = await whatsappService.getStatus();
      const next = res.data;
      setData(prev => {
        if (next?.status === 'starting' && prev?.status !== 'starting') {
          setStartingAt(Date.now());
          setElapsed(0);
        }
        if (next?.status !== 'starting') {
          setStartingAt(null);
          setElapsed(0);
        }
        return next;
      });
    } catch (err) {
      setFetchErr(err?.response?.data?.message || err.message || 'Could not reach server');
    } finally {
      if (!silent) setFetching(false);
    }
  };

  // Elapsed ticker while starting
  useEffect(() => {
    if (startingAt) {
      elapsedRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startingAt) / 1000));
      }, 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [startingAt]);

  // Adaptive auto-refresh
  useEffect(() => {
    fetchStatus();
    const fast = ['starting', 'qr_ready', 'reconnecting'].includes(data?.status);
    intervalRef.current = setInterval(() => fetchStatus(true), fast ? 2000 : 5000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setActionBusy(true);
    try {
      await whatsappService.start();
      toast.success('WhatsApp client starting…');
      await fetchStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('This will disconnect WhatsApp and delete the saved session. Continue?')) return;
    setActionBusy(true);
    try {
      await whatsappService.logout();
      toast.success('Logged out successfully.');
      await fetchStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleClearSession = async () => {
    if (!window.confirm('This will delete all saved session data and disconnect WhatsApp. You will need to scan the QR code again. Continue?')) return;
    setActionBusy(true);
    try {
      await whatsappService.clearSession();
      toast.success('Session cleared. Click "Start WhatsApp" to scan a new QR code.');
      await fetchStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const s              = data?.status || 'disconnected';
  const ui             = STATUS_UI[s] || STATUS_UI.disconnected;
  const isStuckStarting = s === 'starting' && !data?.busy && elapsed >= 45;
  const connectedSince = data?.lastConnectedAt ? fmtTime(data.lastConnectedAt) : null;
  const showStart      = ['disconnected', 'error'].includes(s) && !data?.busy;
  const showForce      = isStuckStarting || s === 'reconnecting';

  return (
    <div>
      <PageHeader
        title="WhatsApp Connection"
        subtitle="Link your WhatsApp account so the system can send receipt acknowledgments and PDF attachments."
      />

      <div className="max-w-lg space-y-4">

        {/* ── Status card ────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">Connection Status</div>
          <div className="card-body space-y-4">

            {fetchErr && (
              <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                Could not reach the server: {fetchErr}
              </div>
            )}

            {data && (
              <>
                {/* Status pill */}
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border font-semibold text-[13px] ${ui.banner}`}>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ui.dot} ${['starting','reconnecting'].includes(s) ? 'animate-ping' : 'animate-pulse'}`} />
                  <span>{ui.label}</span>
                  {s === 'starting' && elapsed > 0 && (
                    <span className="ml-auto text-[11px] font-normal tabular-nums opacity-70">{elapsed}s</span>
                  )}
                  {data.busy && !['starting'].includes(s) && (
                    <span className="text-[11px] font-normal opacity-70">(busy)</span>
                  )}
                </div>

                {/* Error detail */}
                {s === 'error' && data.lastError && (
                  <div className="text-[11.5px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 break-words">
                    {data.lastError}
                  </div>
                )}

                {/* Stage progress — shown while starting */}
                {s === 'starting' && (
                  <div className="space-y-2">
                    <StageProgress initStage={data.initStage} />
                    {isStuckStarting && (
                      <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        Still starting after {elapsed}s. If the session is corrupt, use <strong>Clear Session & Restart</strong>.
                      </p>
                    )}
                  </div>
                )}

                {/* QR code */}
                {s === 'qr_ready' && data.qrBase64 && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="text-[12px] text-gray-600 text-center leading-relaxed">
                      Open <strong>WhatsApp</strong> on your phone →<br />
                      <strong>Settings → Linked Devices → Link a device</strong><br />
                      then scan the QR code below.
                    </div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <img src={data.qrBase64} alt="WhatsApp QR Code" className="w-52 h-52" />
                    </div>
                    <p className="text-[10.5px] text-gray-400">Scan within 20 seconds — refreshes automatically.</p>
                  </div>
                )}

                {/* Connected */}
                {s === 'connected' && (
                  <div className="space-y-1">
                    <p className="text-[12.5px] text-gray-600">
                      WhatsApp is linked and ready to send receipt acknowledgments and PDFs.
                    </p>
                    {connectedSince && (
                      <p className="text-[11.5px] text-green-700">Session active since <strong>{connectedSince}</strong></p>
                    )}
                  </div>
                )}

                {/* Reconnecting */}
                {s === 'reconnecting' && (
                  <div className="space-y-1.5">
                    <p className="text-[12.5px] text-orange-700">
                      Connection dropped — automatically restoring session.
                      {data.reconnectAttempt > 0 && (
                        <span className="ml-1 font-medium">(Attempt {data.reconnectAttempt}/{data.maxReconnect})</span>
                      )}
                    </p>
                    {connectedSince && (
                      <p className="text-[11.5px] text-gray-500">Last connected: {connectedSince}</p>
                    )}
                  </div>
                )}

                {/* Disconnected */}
                {s === 'disconnected' && (
                  <div className="space-y-1">
                    <p className="text-[12.5px] text-gray-500">
                      No active session. Click <strong>Start WhatsApp</strong> to begin.
                    </p>
                    {connectedSince && (
                      <p className="text-[11.5px] text-gray-400">Last session: {connectedSince}</p>
                    )}
                  </div>
                )}

                {/* Log viewer */}
                <LogViewer logs={data.logs} />

              </>
            )}

            {/* ── Buttons ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 pt-1">

              {showStart && (
                <button className="btn btn-primary" onClick={handleStart} disabled={actionBusy}>
                  {actionBusy ? 'Starting…' : '▶ Start WhatsApp'}
                </button>
              )}

              {showForce && (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Restarting…' : '↺ Force Restart'}
                </button>
              )}

              {s === 'connected' && (
                <button
                  className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Logging out…' : 'Logout / Disconnect'}
                </button>
              )}

              {['disconnected', 'error', 'starting'].includes(s) && (
                <button
                  className="btn btn-secondary text-[12px] text-orange-700 border-orange-300 hover:bg-orange-50"
                  onClick={handleClearSession}
                  disabled={actionBusy}
                >
                  Clear Session & Restart
                </button>
              )}

              <button
                className="btn btn-secondary text-[12px]"
                onClick={() => fetchStatus()}
                disabled={fetching || actionBusy}
              >
                {fetching ? 'Refreshing…' : 'Refresh'}
              </button>

            </div>

          </div>
        </div>

        {/* ── How to connect ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">How to connect</div>
          <div className="card-body">
            <ol className="space-y-2 text-[12px] text-gray-600 list-none">
              {[
                ['1', 'Click "Start WhatsApp" — the system launches a browser session (takes ~20 sec).'],
                ['2', 'A QR code appears. Open WhatsApp → Settings → Linked Devices → Link a device → scan.'],
                ['3', 'Status changes to "Connected". The session is saved — no re-scan needed after server restart.'],
                ['4', 'If stuck in "Starting", click "Force Restart". If still stuck, click "Clear Session & Restart" to wipe stale data.'],
                ['5', 'Use "Logout / Disconnect" only to link a different phone number.'],
              ].map(([n, text]) => (
                <li key={n} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-navy-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
