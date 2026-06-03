import { useState, useEffect } from 'react';
import { fmbFeedbackService } from '@/services';
import { fmtDate } from '@/utils/dateUtils';
import { FIELDS } from './constants';

function Stars({ value, size = 'text-base' }) {
  const filled = Math.round(value || 0);
  return (
    <span className={size}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= filled ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  );
}

const LABEL = { 1:'Poor', 2:'Fair', 3:'Good', 4:'Very Good', 5:'Excellent' };

export default function FeedbackSummaryModal({ open, menuRow, onClose }) {
  const [summary,   setSummary]   = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState('summary');

  useEffect(() => {
    if (!open || !menuRow) return;
    setLoading(true);
    setSummary(null);
    setResponses([]);
    setTab('summary');
    Promise.all([
      fmbFeedbackService.getSummary(menuRow.id),
      fmbFeedbackService.getAll(menuRow.id),
    ]).then(([sRes, rRes]) => {
      setSummary(sRes.data?.data);
      setResponses(rRes.data?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, menuRow]);

  if (!open) return null;

  const filledFields = menuRow ? FIELDS.filter(f => menuRow[f.key]?.trim()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-gray-800">Menu Feedback</h3>
            {menuRow && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {menuRow.meal_type} · {fmtDate(menuRow.menu_date)}
                {menuRow.event ? ` · ${menuRow.event}` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border px-5">
              {['summary', 'responses'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors capitalize ${
                    tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'responses' ? `Responses (${responses.length})` : 'Summary'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {/* ── SUMMARY TAB ── */}
              {tab === 'summary' && (
                <div>
                  {!summary || summary.total_count === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-10">No feedback yet.</p>
                  ) : (
                    <>
                      {/* Overall */}
                      <div className="bg-blue-50 rounded-xl p-4 mb-5 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-700">{summary.avg_overall}</p>
                          <Stars value={summary.avg_overall} size="text-xl" />
                          <p className="text-[11px] text-gray-500 mt-1">{LABEL[Math.round(summary.avg_overall)] || ''}</p>
                        </div>
                        <div className="border-l border-blue-200 pl-4">
                          <p className="text-sm font-semibold text-gray-700">{summary.total_count} response{summary.total_count !== 1 ? 's' : ''}</p>
                          <p className="text-[12px] text-gray-400">Overall average</p>
                        </div>
                      </div>

                      {/* Per-item averages */}
                      {filledFields.length > 0 && (
                        <div className="space-y-2">
                          {filledFields.map(f => {
                            const avg = summary[`avg_${f.key}`];
                            if (!avg) return null;
                            return (
                              <div key={f.key} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                                <div className="w-28 shrink-0">
                                  <p className="text-[12px] font-medium text-gray-700">{menuRow[f.key]}</p>
                                  <p className="text-[11px] text-gray-400">{f.label}</p>
                                </div>
                                <Stars value={avg} />
                                <span className="text-[12px] text-gray-500 ml-1">{avg}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── RESPONSES TAB ── */}
              {tab === 'responses' && (
                <div className="space-y-4">
                  {responses.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-10">No responses yet.</p>
                  ) : responses.map((r, i) => (
                    <div key={i} className="border border-border rounded-xl p-4">
                      {/* Submitter info */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {r.full_name || <span className="text-gray-400 font-normal">Anonymous</span>}
                            {r.acc_no && <span className="text-[11px] text-gray-400 ml-2">#{r.acc_no}</span>}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(r.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Stars value={r.overall_rating} />
                          <p className="text-[11px] text-gray-400">{LABEL[r.overall_rating]}</p>
                        </div>
                      </div>

                      {/* Event remark */}
                      {r.event_remark && (
                        <div className="bg-amber-50 rounded-lg px-3 py-2 mb-3">
                          <p className="text-[11px] font-medium text-amber-700 mb-0.5">Event</p>
                          <p className="text-[12px] text-gray-700">{r.event_remark}</p>
                        </div>
                      )}

                      {/* Item remarks */}
                      {filledFields.filter(f => r[`${f.key}_rating`] || r[`${f.key}_remark`]).map(f => (
                        <div key={f.key} className="flex items-start gap-2 py-1.5 border-t border-border first:border-0">
                          <div className="w-28 shrink-0">
                            <p className="text-[12px] font-medium text-gray-700">{menuRow[f.key]}</p>
                            <p className="text-[11px] text-gray-400">{f.label}</p>
                            {r[`${f.key}_rating`] && <Stars value={r[`${f.key}_rating`]} size="text-sm" />}
                          </div>
                          <p className="text-[12px] text-gray-600 flex-1">{r[`${f.key}_remark`] || '—'}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
