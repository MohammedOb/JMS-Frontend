import { useState, useEffect } from 'react';
import { fmbFeedbackService } from '@/services';
import { fmtDate } from '@/utils/dateUtils';
import { FIELDS } from './constants';
import SummaryTab from './SummaryTab';
import ResponsesTab from './ResponsesTab';

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
              {tab === 'summary' && (
                <SummaryTab summary={summary} filledFields={filledFields} menuRow={menuRow} />
              )}
              {tab === 'responses' && (
                <ResponsesTab responses={responses} filledFields={filledFields} menuRow={menuRow} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
