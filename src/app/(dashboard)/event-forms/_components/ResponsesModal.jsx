'use client';
import { useState, useEffect, useCallback } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';

const fmtDate     = (v) => v ? String(v).slice(0, 10) : '—';
const fmtDateTime = (v) => v ? String(v).slice(0, 16).replace('T', ' ') : '';

export default function ResponsesModal({ form, onClose }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [deleting, setDeleting] = useState(null); // ResponseID being deleted
  const [clearing, setClearing] = useState(false);

  // Group flat rows into {responseId → {meta, answers: {qId → text}}}
  const grouped = {};
  const questionMeta = {};

  rows.forEach(r => {
    if (!grouped[r.ResponseID]) {
      grouped[r.ResponseID] = {
        ResponseID: r.ResponseID,
        AccNo: r.AccNo,
        ITSNo: r.ITSNo,
        RespondentName: r.RespondentName,
        SubmittedAt: r.SubmittedAt,
        answers: {},
      };
    }
    if (r.QuestionID) {
      grouped[r.ResponseID].answers[r.QuestionID] = r.AnswerText;
      if (!questionMeta[r.QuestionID]) {
        questionMeta[r.QuestionID] = { QuestionID: r.QuestionID, QuestionText: r.QuestionText, SortOrder: r.SortOrder ?? 0 };
      }
    }
  });

  const responses = Object.values(grouped);
  const questions = Object.values(questionMeta).sort((a, b) => a.SortOrder - b.SortOrder);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await regFormService.loadResponses({ FormID: form.ID, DateFrom: dateFrom || undefined, DateTo: dateTo || undefined });
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
      const data = responses.map((r, i) => [
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
        <div className="flex gap-2 w-full items-center justify-between">
          <div className="flex gap-2 items-center flex-wrap">
            <label className="form-label mb-0">From</label>
            <input type="date" className="form-input h-8 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <label className="form-label mb-0">To</label>
            <input type="date" className="form-input h-8 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            <button className="btn btn-secondary h-8 px-3 text-[11px]" onClick={load} disabled={loading}>
              {loading ? '…' : 'Filter'}
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[11px] text-gray-500">{responses.length} response{responses.length !== 1 ? 's' : ''}</span>
            {responses.length > 0 && (
              <button
                className="btn h-8 px-3 text-[11px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                onClick={clearAll}
                disabled={clearing}
              >
                {clearing ? '…' : '🗑 Clear All'}
              </button>
            )}
            <button className="btn btn-secondary h-8 px-3 text-[11px]" onClick={exportExcel} disabled={!responses.length}>
              📊 Export Excel
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">Loading…</p>
      ) : responses.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">No responses yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[600px]">
            <thead>
              <tr>
                <th className="th-navy w-8">#</th>
                <th className="th-navy">Name</th>
                <th className="th-navy">AccNo</th>
                <th className="th-navy">ITS No</th>
                {questions.map(q => (
                  <th key={q.QuestionID} className="th-navy max-w-[120px]">
                    <span className="block truncate" title={q.QuestionText}>{q.QuestionText}</span>
                  </th>
                ))}
                <th className="th-navy">Submitted</th>
                <th className="th-navy w-16">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {responses.map((r, i) => (
                <tr key={r.ResponseID} className="hover:bg-surface">
                  <td className="px-3 py-2 text-center text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.RespondentName || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{r.AccNo || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{r.ITSNo || '—'}</td>
                  {questions.map(q => (
                    <td key={q.QuestionID} className="px-3 py-2 text-gray-700 max-w-[140px]">
                      <span className="block truncate" title={r.answers[q.QuestionID] ?? ''}>
                        {r.answers[q.QuestionID] ?? '—'}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtDate(r.SubmittedAt)}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => deleteOne(r.ResponseID)}
                      disabled={deleting === r.ResponseID}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40 text-[11px] font-semibold"
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
      )}
    </Modal>
  );
}
