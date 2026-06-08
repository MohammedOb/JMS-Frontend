'use client';

import { useState } from 'react';
import { fmt } from '../../../utils';

const BLANK = { forYear: '', sfRate: '', mardo: '', baira: '', gairBalig: '', hamal: '', amwaat: '' };
const totalM  = (r) => ['mardo','baira','gairBalig','hamal','amwaat'].reduce((s,k) => s + (Number(r[k])||0), 0);
const calcAmt = (r) => Number(r.sfAmount) || (Number(r.sfRate||0) * totalM(r));
const byYearDesc = (a, b) => (parseInt(b.forYear)||0) - (parseInt(a.forYear)||0);

const NUM_FIELDS = [
  { k: 'sfRate',    w: 64 },
  { k: 'mardo',     w: 48 },
  { k: 'baira',     w: 48 },
  { k: 'gairBalig', w: 48 },
  { k: 'hamal',     w: 48 },
  { k: 'amwaat',    w: 48 },
];

function InlineInput({ value, onChange, isYear, width }) {
  return (
    <input
      type={isYear ? 'text' : 'number'}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={isYear ? 'Year' : '0'}
      style={{ width }}
      className="h-7 border border-gray-300 rounded text-[11px] text-center px-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30"
    />
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

export default function SilaFitraSection({ silaFitra, onAdd, onUpdate, onDelete, onSfForm }) {
  const [editId,  setEditId]  = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [newRow,  setNewRow]  = useState({ ...BLANK });
  const [saving,  setSaving]  = useState(false);

  const sorted = [...silaFitra].sort(byYearDesc);

  const setE = (k, v) => setEditRow(p => ({ ...p, [k]: v }));
  const setN = (k, v) => setNewRow(p => ({ ...p, [k]: v }));

  const startEdit = (row) => { setEditId(row.id); setEditRow({ ...row }); setAdding(false); };
  const cancelEdit = () => { setEditId(null); setEditRow(null); };
  const cancelAdd  = () => { setAdding(false); setNewRow({ ...BLANK }); };

  const handleUpdate = async () => {
    if (saving) return;
    setSaving(true);
    try { await onUpdate(editRow); cancelEdit(); } finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (saving) return;
    setSaving(true);
    try { await onAdd(newRow); cancelAdd(); } finally { setSaving(false); }
  };

  const COLS = ['Actions', 'For Year', 'SF', 'M', 'B', 'GB', 'H', 'AM', 'Total Members', 'SF Amount'];

  const SaveCancel = ({ onSave, onCancel }) => (
    <div className="flex items-center gap-1">
      <button onClick={onSave} disabled={saving} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition-colors text-[13px] font-bold">✓</button>
      <button onClick={onCancel} disabled={saving} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 transition-colors text-[13px]">✕</button>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex-1 min-w-0">
          <span>Sila Fitra Details</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        {onSfForm && (
          <button className="btn btn-secondary btn-sm" onClick={onSfForm}>Sila Fitra Form</button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border mb-2">
        <table className="w-full border-collapse text-[12px] min-w-[560px]">
          <thead>
            <tr>{COLS.map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.length === 0 && !adding ? (
              <tr><td colSpan={COLS.length} className="text-center py-6 text-gray-400">No Sila Fitra records</td></tr>
            ) : sorted.map(row => {
              if (editId === row.id) {
                return (
                  <tr key={row.id} className="bg-blue-50/60">
                    <td className="px-2 py-1.5 border-t border-border">
                      <SaveCancel onSave={handleUpdate} onCancel={cancelEdit} />
                    </td>
                    <td className="px-1 py-1.5 border-t border-border">
                      <InlineInput isYear value={editRow.forYear} onChange={v => setE('forYear', v)} width={72} />
                    </td>
                    {NUM_FIELDS.map(({ k, w }) => (
                      <td key={k} className="px-1 py-1.5 border-t border-border">
                        <InlineInput value={editRow[k]} onChange={v => setE(k, v)} width={w} />
                      </td>
                    ))}
                    <td className="px-3 py-1.5 border-t border-border text-center font-semibold text-gray-700">{totalM(editRow)}</td>
                    <td className="px-3 py-1.5 border-t border-border text-right font-semibold text-gray-700">{fmt(calcAmt(editRow))}</td>
                  </tr>
                );
              }
              return (
                <tr key={row.id} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button title="Edit" className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors" onClick={() => startEdit(row)}>
                        <EditIcon />
                      </button>
                      <button title="Delete" className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors" onClick={() => onDelete(row.id)}>
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-t border-border font-semibold">{row.forYear}</td>
                  <td className="px-3 py-2 border-t border-border">{row.sfRate || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{row.mardo ?? 0}</td>
                  <td className="px-3 py-2 border-t border-border">{row.baira ?? 0}</td>
                  <td className="px-3 py-2 border-t border-border">{row.gairBalig ?? 0}</td>
                  <td className="px-3 py-2 border-t border-border">{row.hamal ?? 0}</td>
                  <td className="px-3 py-2 border-t border-border">{row.amwaat ?? 0}</td>
                  <td className="px-3 py-2 border-t border-border font-semibold">{totalM(row)}</td>
                  <td className="px-3 py-2 border-t border-border font-bold text-green-600">{fmt(calcAmt(row))}</td>
                </tr>
              );
            })}
            {adding && (
              <tr className="bg-green-50/60">
                <td className="px-2 py-1.5 border-t border-border">
                  <SaveCancel onSave={handleAdd} onCancel={cancelAdd} />
                </td>
                <td className="px-1 py-1.5 border-t border-border">
                  <InlineInput isYear value={newRow.forYear} onChange={v => setN('forYear', v)} width={72} />
                </td>
                {NUM_FIELDS.map(({ k, w }) => (
                  <td key={k} className="px-1 py-1.5 border-t border-border">
                    <InlineInput value={newRow[k]} onChange={v => setN(k, v)} width={w} />
                  </td>
                ))}
                <td className="px-3 py-1.5 border-t border-border text-center font-semibold  text-gray-700">{totalM(newRow)}</td>
                <td className="px-3 py-1.5 border-t border-border text-center font-semibold text-gray-700">{fmt(calcAmt(newRow))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!adding && (
        <button
          className="btn btn-primary btn-sm mb-4"
          onClick={() => { setAdding(true); setEditId(null); setEditRow(null); }}
        >
          + Add Sila Fitra
        </button>
      )}
    </>
  );
}
