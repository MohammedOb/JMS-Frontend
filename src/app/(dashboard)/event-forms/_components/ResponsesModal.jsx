'use client';
import { useState, useEffect, useCallback } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';

const fmtDate     = (v) => v ? String(v).slice(0, 10) : '—';
const fmtDateTime = (v) => v ? String(v).slice(0, 16).replace('T', ' ') : '';

const CHOICE_TYPES = ['yesno', 'radio', 'select', 'checkbox'];

// ── Per-question summary card (Google-Forms style) ────────────────────────────

function QuestionSummaryCard({ question, responses }) {
  const isChoice = CHOICE_TYPES.includes(question.QuestionType);

  const allAnswers = responses
    .map(r => r.answers[question.QuestionID])
    .filter(a => a != null && a !== '');

  const answered = allAnswers.length;
  const total    = responses.length;

  // Count per option (checkbox answers may be comma-separated)
  const counts = {};
  if (isChoice) {
    allAnswers.forEach(a => {
      const parts = question.QuestionType === 'checkbox'
        ? a.split(',').map(s => s.trim()).filter(Boolean)
        : [a];
      parts.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    });
  }

  const sorted   = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length ? sorted[0][1] : 1;

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-gray-800 text-sm leading-snug">{question.QuestionText}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {answered} of {total} responded
          {answered === 0 && <span className="ml-1 italic">(no data)</span>}
        </p>
      </div>

      {isChoice ? (
        <div className="space-y-2.5">
          {sorted.map(([opt, count]) => {
            const pct = answered ? Math.round(count / answered * 100) : 0;
            return (
              <div key={opt}>
                <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
                  <span className="truncate max-w-[75%] font-medium">{opt}</span>
                  <span className="shrink-0 ml-2 text-gray-500">
                    {count} &nbsp;<span className="text-gray-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-xs text-gray-300 italic">No responses yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {allAnswers.slice(0, 6).map((a, i) => (
            <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1.5 leading-snug">{a}</div>
          ))}
          {allAnswers.length > 6 && (
            <p className="text-xs text-gray-400 pt-0.5">+{allAnswers.length - 6} more responses</p>
          )}
          {allAnswers.length === 0 && (
            <p className="text-xs text-gray-300 italic">No responses yet</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function ResponsesModal({ form, onClose }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [view, setView]         = useState('table'); // 'table' | 'summary'

  // Group flat rows → {responseId: {meta, answers: {qId: text}}}
  const grouped      = {};
  const questionMeta = {};

  rows.forEach(r => {
    if (!grouped[r.ResponseID]) {
      grouped[r.ResponseID] = {
        ResponseID:     r.ResponseID,
        AccNo:          r.AccNo,
        ITSNo:          r.ITSNo,
        RespondentName: r.RespondentName,
        SubmittedAt:    r.SubmittedAt,
        answers: {},
      };
    }
    if (r.QuestionID) {
      grouped[r.ResponseID].answers[r.QuestionID] = r.AnswerText;
      if (!questionMeta[r.QuestionID]) {
        questionMeta[r.QuestionID] = {
          QuestionID:   r.QuestionID,
          QuestionText: r.QuestionText,
          QuestionType: r.QuestionType,
          SortOrder:    r.SortOrder ?? 0,
        };
      }
    }
  });

  const responses = Object.values(grouped);
  // Only show questions that still exist in the form (QuestionText non-null).
  const questions = Object.values(questionMeta)
    .filter(q => !!q.QuestionText)
    .sort((a, b) => a.SortOrder - b.SortOrder);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await regFormService.loadResponses({
        FormID:   form.ID,
        DateFrom: dateFrom || undefined,
        DateTo:   dateTo   || undefined,
      });
      setRows(res?.data?.data ?? []);
    } catch { toast.error('Failed to load responses'); }
    finally  { setLoading(false); }
  }, [form.ID, dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  const deleteOne = async (ResponseID) => {
    if (!confirm('Delete this response? This cannot be undone.')) return;
    setDeleting(ResponseID);
    try {
      await regFormService.deleteResponse({ ResponseID });
      toast.success('Response deleted');
      setRows(prev => prev.filter(r => r.ResponseID !== ResponseID));
    } catch { toast.error('Failed to delete response'); }
    finally { setDeleting(null); }
  };

  const clearAll = async () => {
    if (!confirm(`Delete ALL ${responses.length} response(s) for "${form.Title}"? This cannot be undone.`)) return;
    setClearing(true);
    try {
      await regFormService.clearResponses({ FormID: form.ID });
      toast.success('All responses cleared');
      setRows([]);
    } catch { toast.error('Failed to clear responses'); }
    finally { setClearing(false); }
  };

  const exportExcel = () => {
    import('xlsx').then(({ utils, writeFile }) => {
      const header = ['#', 'Name', 'AccNo', 'ITS No', 'Submitted At', ...questions.map(q => q.QuestionText)];
      const data   = responses.map((r, i) => [
        i + 1,
        r.RespondentName || '',
        r.AccNo || '',
        r.ITSNo || '',
        fmtDateTime(r.SubmittedAt),
        ...questions.map(q => r.answers[q.QuestionID] ?? ''),
      ]);
      const ws = utils.aoa_to_sheet([header, ...data]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Responses');
      writeFile(wb, `${form.Title}-responses.xlsx`);
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Responses — ${form.Title}`}
      size="full"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-sm text-gray-500">
            {responses.length} response{responses.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            {responses.length > 0 && (
              <button
                className="btn h-8 px-3 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                onClick={clearAll}
                disabled={clearing}
              >
                {clearing ? '…' : '🗑 Clear All'}
              </button>
            )}
            <button
              className="btn btn-secondary h-8 px-3 text-xs"
              onClick={exportExcel}
              disabled={!responses.length}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      }
    >
      {/* Compact filter + view toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-gray-500 shrink-0">From</span>
          <input
            type="date"
            className="form-input h-7 text-xs w-32 shrink-0"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <span className="text-xs text-gray-500 shrink-0">To</span>
          <input
            type="date"
            className="form-input h-7 text-xs w-32 shrink-0"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
          <button
            className="btn btn-secondary h-7 px-3 text-xs shrink-0"
            onClick={load}
            disabled={loading}
          >
            {loading ? '…' : 'Filter'}
          </button>
        </div>

        {/* Table / Summary toggle */}
        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setView('table')}
            className={`px-3 h-7 text-xs font-medium transition-colors ${
              view === 'table'
                ? 'bg-navy-800 text-white'
                : 'bg-white text-gray-500 hover:bg-surface'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setView('summary')}
            className={`px-3 h-7 text-xs font-medium transition-colors ${
              view === 'summary'
                ? 'bg-navy-800 text-white'
                : 'bg-white text-gray-500 hover:bg-surface'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Loading…</p>
      ) : responses.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">No responses yet.</p>
      ) : view === 'table' ? (

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="th-navy text-xs w-10">#</th>
                <th className="th-navy text-xs whitespace-nowrap">Name</th>
                <th className="th-navy text-xs whitespace-nowrap">AccNo</th>
                <th className="th-navy text-xs whitespace-nowrap">ITS No</th>
                {questions.map(q => (
                  <th key={q.QuestionID} className="th-navy text-xs min-w-[130px]">
                    {q.QuestionText}
                  </th>
                ))}
                <th className="th-navy text-xs whitespace-nowrap">Submitted</th>
                <th className="th-navy text-xs w-16">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {responses.map((r, i) => (
                <tr key={r.ResponseID} className="hover:bg-surface align-top">
                  <td className="px-3 py-3 text-center text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{r.RespondentName || '—'}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{r.AccNo || '—'}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{r.ITSNo || '—'}</td>
                  {questions.map(q => (
                    <td key={q.QuestionID} className="px-3 py-3 text-gray-700 min-w-[130px]">
                      {r.answers[q.QuestionID] ?? '—'}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.SubmittedAt)}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => deleteOne(r.ResponseID)}
                      disabled={deleting === r.ResponseID}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40 font-semibold"
                      title="Delete this response"
                    >
                      {deleting === r.ResponseID ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* Summary view */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {questions.length === 0 ? (
            <p className="col-span-2 text-center text-gray-400 py-8 text-sm">No question data found.</p>
          ) : (
            questions.map(q => (
              <QuestionSummaryCard key={q.QuestionID} question={q} responses={responses} />
            ))
          )}
        </div>

      )}
    </Modal>
  );
}
