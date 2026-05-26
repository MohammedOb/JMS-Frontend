'use client';
import { useState, useEffect } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';

const TYPES = ['text','textarea','number','date','yesno','radio','select','checkbox'];
const blankQ = () => ({ QuestionText: '', QuestionType: 'text', Options: [], IsRequired: false, SortOrder: 0 });

export default function QuestionBankTab() {
  const [bank, setBank]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await regFormService.loadBank({});
      const rows = (r?.data?.data ?? []).map(q => ({
        ...q,
        Options: q.Options ? (typeof q.Options === 'string' ? JSON.parse(q.Options) : q.Options) : [],
        IsRequired: !!q.IsRequired,
      }));
      setBank(rows);
    } catch { toast.error('Failed to load bank'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveQ = async () => {
    if (!editing?.QuestionText?.trim()) { toast.error('Question text required'); return; }
    setSaving(true);
    try {
      const payload = { ...editing, Options: editing.Options?.filter(Boolean) ?? [] };
      if (editing.ID) { await regFormService.updateBank(payload); }
      else             { await regFormService.addBank(payload); }
      toast.success('Saved');
      setEditing(null);
      load();
    } catch { toast.error('Failed to save'); }
    finally  { setSaving(false); }
  };

  const deleteQ = async (id) => {
    if (!confirm('Remove from bank?')) return;
    try { await regFormService.deleteBank({ ID: id }); toast.success('Removed'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const needsOptions = ['radio','select','checkbox'].includes(editing?.QuestionType);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-[12px] text-gray-500">Reusable questions you can import into any form.</p>
        <button className="btn btn-primary text-[12px]" onClick={() => setEditing(blankQ())}>+ Add Question</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">Loading…</p>
      ) : bank.length === 0 && !editing ? (
        <p className="text-center text-gray-400 py-8 text-[12px]">Bank is empty. Add some reusable questions.</p>
      ) : (
        <div className="card overflow-hidden">
          {bank.map((q, i) => (
            <div key={q.ID} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800">{q.QuestionText}</p>
                <p className="text-[10px] text-gray-400 capitalize mt-0.5">
                  {q.QuestionType}{q.IsRequired ? ' · Required' : ''}{q.Options?.length ? ` · ${q.Options.length} options` : ''}
                </p>
              </div>
              <button className="btn btn-secondary h-7 px-2.5 text-[11px]" onClick={() => setEditing({ ...q })}>Edit</button>
              <button className="btn btn-secondary h-7 px-2.5 text-[11px] text-red-500" onClick={() => deleteQ(q.ID)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="card p-4">
          <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-3">
            {editing.ID ? 'Edit Question' : 'New Question'}
          </p>
          <div className="space-y-3">
            <div>
              <label className="form-label">Question Text *</label>
              <input className="form-input" value={editing.QuestionText}
                onChange={e => setEditing(p => ({ ...p, QuestionText: e.target.value }))}
                placeholder="e.g. Full Name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Type</label>
                <select className="form-select" value={editing.QuestionType}
                  onChange={e => setEditing(p => ({ ...p, QuestionType: e.target.value, Options: [] }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Sort Order</label>
                <input type="number" className="form-input" value={editing.SortOrder}
                  onChange={e => setEditing(p => ({ ...p, SortOrder: +e.target.value }))} />
              </div>
            </div>
            {needsOptions && (
              <div>
                <label className="form-label">Options</label>
                <div className="space-y-1">
                  {(editing.Options || []).map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input className="form-input h-7 flex-1" value={opt}
                        onChange={e => {
                          const opts = [...editing.Options]; opts[oi] = e.target.value;
                          setEditing(p => ({ ...p, Options: opts }));
                        }} placeholder={`Option ${oi + 1}`} />
                      <button onClick={() => setEditing(p => ({ ...p, Options: p.Options.filter((_,j) => j !== oi) }))}
                        className="text-red-400 hover:text-red-600 text-[11px]">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setEditing(p => ({ ...p, Options: [...(p.Options||[]), ''] }))}
                    className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">+ Add option</button>
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-[12px] cursor-pointer select-none">
              <input type="checkbox" checked={!!editing.IsRequired}
                onChange={e => setEditing(p => ({ ...p, IsRequired: e.target.checked }))} className="rounded" />
              Required by default
            </label>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary text-[11px]" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary text-[11px]" onClick={saveQ} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
