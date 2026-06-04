'use client';

import { useState } from 'react';
import toast      from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { utilityService } from '@/services';
import { CalculatorIcon, XIcon, RefreshIcon, MapPinIcon, BarChartIcon, TrashIcon, SaveIcon, DatabaseIcon } from '@/components/shared/Icons';
import ITSImportPanel from './_components/ITSImportPanel';

const NOTE_DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function UtilityPage() {
  const [running,  setRunning]  = useState({});
  const [noteForm, setNoteForm] = useState(Object.fromEntries(NOTE_DENOMS.map(d => [d, ''])));
  const [noteTotal,setNoteTotal]= useState(null);

  const run = async (key, fn, successMsg) => {
    setRunning(p => ({ ...p, [key]: true }));
    try {
      await fn();
      toast.success(successMsg);
    } catch {
      toast.error('Operation failed');
    } finally {
      setRunning(p => ({ ...p, [key]: false }));
    }
  };

  const calcNotes = async () => {
    const total = NOTE_DENOMS.reduce((s, d) => s + d * (Number(noteForm[d]) || 0), 0);
    setNoteTotal(total);
    try {
      await utilityService.countNotes(noteForm);
    } catch { /* non-critical */ }
  };

  const resetNotes = () => {
    setNoteForm(Object.fromEntries(NOTE_DENOMS.map(d => [d, ''])));
    setNoteTotal(null);
  };

  const ACTIONS = [
    {
      key: 'takhmeen', icon: RefreshIcon, title: 'Update Takhmeen Details',
      desc: 'SP: UpdateTakhmeenDetails — Recalculates and syncs all member takhmeen balances with current payment data.',
      color: 'border-blue-500/30 bg-blue-500/[0.04]',
      btnClass: 'btn-primary',
      fn: () => run('takhmeen', utilityService.updateTakhmeenDetails, 'Takhmeen details updated'),
    },
    {
      key: 'mohallah', icon: MapPinIcon, title: 'Update Mohallah Names',
      desc: 'SP: UpdateMohallahName — Refreshes mohallah name references across all member records.',
      color: 'border-navy-700/30 bg-navy-800/[0.03]',
      btnClass: 'btn-primary',
      fn: () => run('mohallah', utilityService.updateMohallahNames, 'Mohallah names updated'),
    },
    {
      key: 'dues', icon: BarChartIcon, title: 'Recalculate All Dues',
      desc: 'Recalculates outstanding dues for all members based on current takhmeen and receipt data.',
      color: 'border-amber-500/30 bg-amber-500/[0.04]',
      btnClass: 'btn-primary',
      fn: () => run('dues', utilityService.recalcDues, 'Dues recalculated'),
    },
    {
      key: 'cache', icon: TrashIcon, title: 'Clear System Cache',
      desc: 'Flushes server-side cache to ensure all users see the latest data.',
      color: 'border-gray-400/30 bg-gray-100/50',
      btnClass: 'btn-secondary',
      fn: () => run('cache', utilityService.clearCache, 'Cache cleared'),
    },
    {
      key: 'backup', icon: SaveIcon, title: 'Backup Data',
      desc: 'Creates a full database backup snapshot tagged with today\'s date.',
      color: 'border-green-500/30 bg-green-500/[0.04]',
      btnClass: 'btn-success',
      fn: () => run('backup', utilityService.backupData, 'Backup created'),
    },
  ];

  return (
    <div>
      <PageHeader title="Utility" subtitle="System maintenance tools and SP operations" />

      {/* SP Action Cards + ITS Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {ACTIONS.map(a => (
          <div key={a.key} className={`card border ${a.color}`}>
            <div className="card-body flex items-start gap-4">
              <div className="mt-1">{(() => { const Icon = a.icon; return <Icon className="w-8 h-8 text-navy-600 opacity-70" />; })()}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-navy-800 mb-1">{a.title}</div>
                <div className="text-[11.5px] text-gray-500 mb-3">{a.desc}</div>
                <button
                  className={`btn ${a.btnClass} btn-sm`}
                  disabled={!!running[a.key]}
                  onClick={a.fn}
                >
                  {running[a.key] ? 'Running…' : 'Run'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* ITS Import — sits next to Backup Data in the grid */}
        <div className="card border border-blue-500/30 bg-blue-500/[0.04]">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <DatabaseIcon className="w-5 h-5 text-blue-500 opacity-80" />
              <span className="font-semibold text-[13px] text-navy-800">Import ITS Data</span>
            </div>
            <ITSImportPanel />
          </div>
        </div>
      </div>

      {/* Note Counting Tool */}
      <div className="card">
        <div className="card-header">
          <span>Note Counting Tool</span>
          {noteTotal !== null && (
            <span className="text-[13px] font-bold text-green-600">
              Total: ₹{noteTotal.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {NOTE_DENOMS.map(d => (
              <div key={d}>
                <label className="form-label">₹{d} × ___</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={noteForm[d]}
                  onChange={e => setNoteForm(p => ({ ...p, [d]: e.target.value }))}
                />
                {noteForm[d] ? (
                  <div className="text-[10.5px] text-gray-400 mt-0.5">
                    = ₹{(d * (Number(noteForm[d]) || 0)).toLocaleString('en-IN')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {noteTotal !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-[11px] text-green-600 font-semibold mb-1">GRAND TOTAL</div>
              <div className="text-2xl font-bold text-green-700">₹{noteTotal.toLocaleString('en-IN')}</div>
              <div className="mt-2 text-[11px] text-gray-500 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {NOTE_DENOMS.filter(d => Number(noteForm[d]) > 0).map(d => (
                  <span key={d}>₹{d} × {noteForm[d]} = ₹{(d * Number(noteForm[d])).toLocaleString('en-IN')}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={calcNotes}><CalculatorIcon className="w-3.5 h-3.5 mr-1.5" />Calculate Total</button>
            <button className="btn btn-secondary btn-sm" onClick={resetNotes}><XIcon className="w-3.5 h-3.5 mr-1.5" />Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
