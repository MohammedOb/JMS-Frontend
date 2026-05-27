'use client';

import { useState, useEffect, useRef } from 'react';
import { whatsappService } from '@/services';
import PageHeader from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

// ── Status definitions ────────────────────────────────────────────────────────
const STATUS_UI = {
  connected:    { label: 'Connected',      dot: 'bg-green-500',  banner: 'bg-green-50  border-green-200  text-green-800'  },
  qr_ready:     { label: 'Scan QR Code',   dot: 'bg-amber-400',  banner: 'bg-amber-50  border-amber-200  text-amber-800'  },
  starting:     { label: 'Starting…',      dot: 'bg-blue-400',   banner: 'bg-blue-50   border-blue-200   text-blue-800'   },
  disconnected: { label: 'Disconnected',   dot: 'bg-gray-400',   banner: 'bg-gray-50   border-gray-200   text-gray-700'   },
  error:        { label: 'Error',          dot: 'bg-red-500',    banner: 'bg-red-50    border-red-200    text-red-800'    },
};

export default function WhatsAppStatusPage() {
  const [data,       setData]       = useState(null);
  const [fetching,   setFetching]   = useState(true);
  const [starting,   setStarting]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fetchErr,   setFetchErr]   = useState(null);
  const intervalRef = useRef(null);

  // ── Fetch current status ────────────────────────────────────────────────────
  const fetchStatus = async (silent = false) => {
    if (!silent) setFetching(true);
    setFetchErr(null);
    try {
      const res = await whatsappService.getStatus();
      setData(res.data);
    } catch (err) {
      setFetchErr(err?.response?.data?.message || err.message || 'Could not reach server');
    } finally {
      if (!silent) setFetching(false);
    }
  };

  // Auto-refresh: fast while starting/qr, slower once stable
  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(() => {
      fetchStatus(true);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── Start WhatsApp ──────────────────────────────────────────────────────────
  const handleStart = async () => {
    setStarting(true);
    try {
      await whatsappService.start();
      toast.success('WhatsApp client is starting — QR code will appear shortly');
      await fetchStatus();
    } catch (err) {
      toast.error('Failed to start: ' + (err?.response?.data?.message || err.message));
    } finally {
      setStarting(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!window.confirm('This will disconnect WhatsApp and delete the saved session. Continue?')) return;
    setLoggingOut(true);
    try {
      await whatsappService.logout();
      toast.success('Logged out. You can re-connect by clicking "Start WhatsApp".');
      await fetchStatus();
    } catch (err) {
      toast.error('Logout failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoggingOut(false);
    }
  };

  const s   = data?.status || 'disconnected';
  const ui  = STATUS_UI[s] || STATUS_UI.disconnected;
  const isStartable = ['disconnected', 'error'].includes(s) && !data?.busy;

  return (
    <div>
      <PageHeader
        title="WhatsApp Connection"
        subtitle="Link your WhatsApp account so the system can send receipt acknowledgments and PDF attachments."
      />

      <div className="max-w-lg space-y-4">

        {/* ── Status banner ──────────────────────────────────────────────── */}
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
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ui.dot} ${s === 'starting' ? 'animate-ping' : 'animate-pulse'}`} />
                  <span>{ui.label}</span>
                  {data.busy && s !== 'starting' && (
                    <span className="text-[11px] font-normal opacity-70">(busy)</span>
                  )}
                </div>

                {/* Error detail */}
                {s === 'error' && data.lastError && (
                  <div className="text-[11.5px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 font-mono break-all">
                    {data.lastError}
                  </div>
                )}

                {/* QR code */}
                {s === 'qr_ready' && data.qrBase64 && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="text-[12px] text-gray-600 text-center leading-relaxed">
                      Open <strong>WhatsApp</strong> on your phone<br />
                      → <strong>Settings → Linked Devices → Link a device</strong><br />
                      then scan the QR code below.
                    </div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <img
                        src={data.qrBase64}
                        alt="WhatsApp QR Code"
                        className="w-52 h-52"
                      />
                    </div>
                    <p className="text-[10.5px] text-gray-400">
                      QR refreshes automatically every 3 s
                    </p>
                  </div>
                )}

                {/* Connected info */}
                {s === 'connected' && (
                  <p className="text-[12.5px] text-gray-600">
                    WhatsApp is linked and ready. Receipt acknowledgments and PDF attachments will be sent automatically when "Send WhatsApp" is checked on the Add Receipt page.
                  </p>
                )}

                {/* Starting info */}
                {s === 'starting' && (
                  <p className="text-[12.5px] text-gray-500 animate-pulse">
                    Launching browser session — this may take 15–30 seconds. The QR code will appear here once ready.
                  </p>
                )}

                {/* Disconnected info */}
                {s === 'disconnected' && (
                  <p className="text-[12.5px] text-gray-500">
                    No active WhatsApp session. Click <strong>Start WhatsApp</strong> below to begin.
                  </p>
                )}

              </>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">

              {isStartable && (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={starting}
                >
                  {starting ? 'Starting…' : '▶ Start WhatsApp'}
                </button>
              )}

              {s === 'connected' && (
                <button
                  className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out…' : 'Logout / Disconnect'}
                </button>
              )}

              <button
                className="btn btn-secondary text-[12px]"
                onClick={() => fetchStatus()}
                disabled={fetching}
              >
                {fetching ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

          </div>
        </div>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">How to connect</div>
          <div className="card-body">
            <ol className="space-y-2 text-[12px] text-gray-600 list-none">
              {[
                ['1', 'Click "Start WhatsApp" — the system launches a browser session (takes ~20 sec).'],
                ['2', 'A QR code appears above. Open WhatsApp on your phone → Settings → Linked Devices → Link a device.'],
                ['3', 'Scan the QR code. The status will change to "Connected".'],
                ['4', 'The session is saved on the server. After a server restart, it reconnects automatically without scanning again.'],
                ['5', 'Use "Logout / Disconnect" to clear the session (e.g. to link a different number).'],
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
