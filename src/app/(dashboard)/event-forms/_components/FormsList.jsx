'use client';
import { useState, useEffect, useCallback } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import FormBuilderModal from './FormBuilderModal';
import ResponsesModal from './ResponsesModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const STATUS_STYLE = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  closed:    'bg-red-100 text-red-600',
};

export default function FormsList() {
  const [forms, setForms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [builder, setBuilder]   = useState(null);  // null | {} | {form data}
  const [responses, setResponses] = useState(null); // null | form

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await regFormService.loadForms({});
      setForms(res?.data?.data ?? []);
    } catch { toast.error('Failed to load forms'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (form) => {
    const next = form.Status === 'published' ? 'closed' : form.Status === 'draft' ? 'published' : 'published';
    try {
      await regFormService.updateForm({ ID: form.ID, Status: next });
      toast.success(`Form ${next}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const remove = async (form) => {
    if (!confirm(`Delete "${form.Title}"? This will also delete all responses.`)) return;
    try {
      await regFormService.deleteForm({ ID: form.ID });
      toast.success('Form deleted');
      load();
    } catch { toast.error('Failed to delete form'); }
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/reg/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="btn btn-primary" onClick={() => setBuilder({ _ts: Date.now() })}>
          + Create New Form
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">Loading…</p>
      ) : forms.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">No forms yet. Create one to get started.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr>
                {['Title','Event Name','Event Date','Responses','Status','Actions'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forms.map(f => (
                <tr key={f.ID} className="hover:bg-surface">
                  <td className="px-3 py-2.5 font-medium text-gray-800">{f.Title}</td>
                  <td className="px-3 py-2.5 text-gray-600">{f.EventName || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{fmtDate(f.EventDate)}</td>
                  <td className="px-3 py-2.5 text-center font-semibold text-blue-600">{f.ResponseCount ?? 0}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_STYLE[f.Status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {f.Status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      <button className="btn btn-secondary text-[11px] h-7 px-2.5" onClick={() => setBuilder({ ...f, _ts: Date.now() })}>Build</button>
                      <button className="btn btn-secondary text-[11px] h-7 px-2.5" onClick={() => setResponses(f)}>Responses</button>
                      {f.Status === 'published' && (
                        <button className="btn btn-secondary text-[11px] h-7 px-2.5" onClick={() => copyLink(f.ID)}>Copy Link</button>
                      )}
                      <button
                        className={`btn text-[11px] h-7 px-2.5 ${f.Status === 'published' ? 'btn-secondary text-orange-600' : 'btn-primary'}`}
                        onClick={() => toggleStatus(f)}
                      >
                        {f.Status === 'draft' ? 'Publish' : f.Status === 'published' ? 'Close' : 'Reopen'}
                      </button>
                      <button className="btn btn-secondary text-[11px] h-7 px-2.5 text-red-500" onClick={() => remove(f)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {builder !== null && (
        <FormBuilderModal
          key={builder._ts}
          initialData={builder?.ID ? builder : null}
          onClose={() => setBuilder(null)}
          onSaved={() => { setBuilder(null); load(); }}
        />
      )}

      {responses && (
        <ResponsesModal
          form={responses}
          onClose={() => setResponses(null)}
        />
      )}
    </div>
  );
}
