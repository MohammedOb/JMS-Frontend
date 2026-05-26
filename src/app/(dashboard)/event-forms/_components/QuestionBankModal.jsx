'use client';
import { useState, useEffect } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';

const TYPES = ['text','textarea','number','date','yesno','radio','select','checkbox'];

const blankQ = () => ({ QuestionText: '', QuestionType: 'text', Options: [], IsRequired: false, SortOrder: 0 });

export default function QuestionBankModal({ onClose, onImport }) {
  const [bank, setBank]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null); // null | {} | bankQuestion
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

  const toggle = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const saveQ = async () => {
    if (!editing?.QuestionText?.trim()) { toast.error('Question text required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        Options: editing.Options?.filter(Boolean) ?? [],
      };
      if (editing.ID) {
        await regFormService.updateBank(payload);
      } else {
        await regFormService.addBank(payload);
      }
      toast.success('Saved');
      setEditing(null);
      load();
    } catch { toast.error('Failed to save'); }
    finally  { setSaving(false); }
  };

  const deleteQ = async (id) => {
    if (!confirm('Remove this question from the bank?')) return;
    try {
      await regFormService.deleteBank({ ID: id });
      toast.success('Removed');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const doImport = () => {
    const chosen = bank.filter(q => selected.has(q.ID));
    if (!chosen.length) { toast.error('Select at least one question'); return; }
    onImport(chosen);
  };

  const updateOpt = (oi, val) => {
    const opts = [...(editing?.Options ?? [])];
    opts[oi] = val;
    setEditing(e => ({ ...e, Options: opts }));
  };

  const needsOptions = ['radio','select','checkbox'].includes(editing?.QuestionType);

  return (
    <Modal
      open
      onClose={onClose}
      title="Question Bank"
      size="lg"
      footer={
        onImport ? (
          <div className="flex gap-2 w-full justify-between">
            <button className="btn btn-secondary text-[11px]" onClick={() => setEditing(blankQ())}>+ Add to Bank</button>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={doImport} disabled={!selected.size}>
                Import Selected ({selected.size})
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary text-[11px]" onClick={() => setEditing(blankQ())}>+ Add Question</button>
        )
      }
    >
      {loading ? (
        <p className="text-center text-gray-400 py-6 text-[12px]">Loading…</p>
      ) : bank.length === 0 && !editing ? (
        <p className="text-center text-gray-400 py-6 text-[12px]">Bank is empty. Add some reusable questions.</p>
      ) : (
        <div className="space-y-1">
          {bank.map(q => (
            <div key={q.ID} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface">
              {onImport && (
                <input type="checkbox" checked={selected.has(q.ID)} onChange={() => toggle(q.ID)} className="rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800 truncate">{q.QuestionText}</p>
                <p className="text-[10px] text-gray-400 capitalize">{q.QuestionType}{q.IsRequired ? ' · Required' : ''}</p>
              </div>
              <button className="btn btn-secondary h-6 px-2 text-[10px]" onClick={() => setEditing({ ...q })}>Edit</button>
              <button className="btn btn-secondary h-6 px-2 text-[10px] text-red-500" onClick={() => deleteQ(q.ID)}>Del</button>
            </div>
          ))}
        </div>
      )}

      {/* Inline editor */}
      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-3">
            {editing.ID ? 'Edit Question' : 'New Bank Question'}
          </p>
          <div className="space-y-2">
            <div>
              <label className="form-label">Question Text *</label>
              <input
                className="form-input"
                value={editing.QuestionText}
                onChange={e => setEditing(p => ({ ...p, QuestionText: e.target.value }))}
                placeholder="e.g. Full Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={editing.QuestionType}
                  onChange={e => setEditing(p => ({ ...p, QuestionType: e.target.value, Options: [] }))}
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={editing.SortOrder}
                  onChange={e => setEditing(p => ({ ...p, SortOrder: +e.target.value }))}
                />
              </div>
            </div>

            {needsOptions && (
              <div>
                <label className="form-label">Options</label>
                <div className="space-y-1">
                  {(editing.Options || []).map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input
                        className="form-input h-7 flex-1"
                        value={opt}
                        onChange={e => updateOpt(oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button
                        onClick={() => setEditing(p => ({ ...p, Options: p.Options.filter((_,idx) => idx !== oi) }))}
                        className="text-red-400 hover:text-red-600 text-[11px]"
                      >✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditing(p => ({ ...p, Options: [...(p.Options||[]), ''] }))}
                    className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
                  >+ Add option</button>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-[12px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!editing.IsRequired}
                onChange={e => setEditing(p => ({ ...p, IsRequired: e.target.checked }))}
                className="rounded"
              />
              Required by default
            </label>

            <div className="flex gap-2 justify-end pt-1">
              <button className="btn btn-secondary text-[11px]" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary text-[11px]" onClick={saveQ} disabled={saving}>
                {saving ? 'Saving…' : 'Save to Bank'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
