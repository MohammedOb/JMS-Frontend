'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { getRowLabel } from '../constants';

export default function BlockRangeModal({ open, activeSec, onClose, onConfirm }) {
  const [rowFrom, setRowFrom] = useState('A');
  const [rowTo,   setRowTo]   = useState('A');
  const [colFrom, setColFrom] = useState('1');
  const [colTo,   setColTo]   = useState('1');
  const [remark,  setRemark]  = useState('');

  useEffect(() => {
    if (!open) {
      setRowFrom('A');
      setRowTo('A');
      setColFrom('1');
      setColTo('1');
      setRemark('');
    }
  }, [open]);

  if (!activeSec) return null;

  const rowOptions = Array.from({ length: activeSec.RowCount }, (_, i) => getRowLabel(i));
  const colOptions = Array.from({ length: activeSec.ColCount }, (_, i) => String(i + 1));

  const handleConfirm = () => {
    if (!remark.trim()) return;
    onConfirm({ RowFrom: rowFrom, RowTo: rowTo, ColFrom: colFrom, ColTo: colTo, Remark: remark });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Block Seat Range"
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!remark.trim()}>
            Block Range
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Block a rectangle of seats as Reserved (for stage, gate, etc.). The remark label will show
          on each blocked seat so it is identifiable directly on the map.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Row From</label>
            <select className="form-input" value={rowFrom} onChange={e => setRowFrom(e.target.value)}>
              {rowOptions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Row To</label>
            <select className="form-input" value={rowTo} onChange={e => setRowTo(e.target.value)}>
              {rowOptions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Col From</label>
            <select className="form-input" value={colFrom} onChange={e => setColFrom(e.target.value)}>
              {colOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Col To</label>
            <select className="form-input" value={colTo} onChange={e => setColTo(e.target.value)}>
              {colOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Label / Remark <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="e.g. Stage, Qibla, Pillar, Gate"
          />
        </div>

        <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          This blocks seats for the <strong>current event/year</strong> only. For permanent structural
          exclusions (pillars, Qibla wall), use "Void Seats" in the Layout Manager instead.
        </div>
      </div>
    </Modal>
  );
}
