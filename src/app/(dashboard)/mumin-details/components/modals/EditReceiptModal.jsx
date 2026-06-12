'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon, PrintIcon, EditIcon } from '@/components/shared/Icons';
import { fmt } from '../../utils';
import { takhmeenService } from '@/services';
import toast from 'react-hot-toast';

function normList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.recordset) return data.recordset;
  if (Array.isArray(data.recordsets?.[0])) return data.recordsets[0];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

// ─── Config ───────────────────────────────────────────────────────────────────
// Set to true to allow editing the received date on back-dated (past) receipts
const ALLOW_BACKDATE_EDIT = false;

function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; }
}

function fmtDateTime(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(val); }
}

export default function EditReceiptModal({
  open, onClose, member,
  rcForm, setRcForm,
  onSave, onPrint,
}) {
  // ── Profile edit state ────────────────────────────────────────────────────
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // ── Per-head cash limit ───────────────────────────────────────────────────
  const [cashLimit, setCashLimit] = useState(9500);

  // ── Item inline edit state — null = not editing; number = index being edited
  const [editingItem, setEditingItem] = useState(null);
  const [editBuf, setEditBuf]         = useState({});

  const updateReasonRef = useRef(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (!open) return;
    setProfileEdit(false);
    setProfileForm({
      fullName: rcForm?.fullName || rcForm?.ReceivedFrom || member?.name   || '',
      itsNo:    rcForm?.itsNo   || rcForm?.ITSNo        || member?.itsNo  || '',
      mobile:   rcForm?.mobile  || rcForm?.Mobile       || member?.mobile || '',
      sector:   rcForm?.sector  || member?.sector       || '',
    });
    setEditingItem(null);
    setEditBuf({});

    // Fetch per-head cash limit
    const subHead = rcForm?.subHead || rcForm?.items?.[0]?.subHead;
    if (subHead) {
      takhmeenService.loadHubHeadDetails({ HubSubHead: subHead, IsActive: 1 })
        .then(res => {
          const rec = normList(res.data)[0];
          setCashLimit(Number(rec?.CashLimit ?? rec?.Cash_Limit ?? 9500) || 9500);
        })
        .catch(() => setCashLimit(9500));
    } else {
      setCashLimit(9500);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Profile edit handlers ─────────────────────────────────────────────────
  const openProfileEdit = () => {
    setProfileForm({
      fullName: rcForm?.fullName || rcForm?.ReceivedFrom || member?.name   || '',
      itsNo:    rcForm?.itsNo   || rcForm?.ITSNo        || member?.itsNo  || '',
      mobile:   rcForm?.mobile  || rcForm?.Mobile       || member?.mobile || '',
      sector:   rcForm?.sector  || member?.sector       || '',
    });
    setProfileEdit(true);
  };

  const doneProfileEdit = () => {
    setRcForm(p => ({
      ...p,
      fullName: profileForm.fullName,
      itsNo:    profileForm.itsNo,
      mobile:   profileForm.mobile,
      sector:   profileForm.sector,
    }));
    setProfileEdit(false);
  };

  // ── Date locking ──────────────────────────────────────────────────────────
  const receivedDateStr = toDateStr(rcForm?.receivedDate);
  const todayStr        = new Date().toISOString().split('T')[0];
  const isDateLocked    = !ALLOW_BACKDATE_EDIT && !!receivedDateStr && receivedDateStr <= todayStr;

  // ── Items array — use rcForm.items if present, else build from single fields
  const items = rcForm?.items || [
    {
      subHead:  rcForm?.subHead  || '',
      mainHead: rcForm?.mainHead || '',
      forYear:  rcForm?.forYear  || '',
      amount:   Number(rcForm?.amount || 0),
      remark:   rcForm?.remark   || '',
      grade:    rcForm?.grade    || '',
    },
  ];

  const isCashMemo = rcForm?.mode === 'Cash Memo' || !!(rcForm?.IsCashMemo || rcForm?.isCashMemo);
  const isCash     = rcForm?.mode === 'Cash';
  const amount     = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const overLimit  = isCash && amount > cashLimit;

  // ── Item edit handlers ────────────────────────────────────────────────────
  const startItemEdit = (index) => {
    const item = items[index] || {};
    setEditBuf({
      forYear: item.forYear || '',
      grade:   item.grade   || '',
      amount:  String(item.amount || ''),
      remark:  item.remark  || '',
    });
    setEditingItem(index);
  };

  const saveItemEdit = (index) => {
    const newAmt  = Number(editBuf.amount || 0);
    const newTotal = items.reduce((s, it, i) => s + (i === index ? newAmt : Number(it.amount) || 0), 0);
    if (isCash && newTotal > cashLimit) {
      alert(`Cash receipts cannot exceed ₹${cashLimit.toLocaleString()} total. The total would be ₹${newTotal.toLocaleString()}.`);
      return;
    }
    setRcForm(p => {
      const curItems = p.items || [
        { subHead: p.subHead, mainHead: p.mainHead, forYear: p.forYear, amount: Number(p.amount), remark: p.remark, grade: p.grade },
      ];
      const newItems = curItems.map((it, i) =>
        i === index ? { ...it, forYear: editBuf.forYear, grade: editBuf.grade, amount: newAmt, remark: editBuf.remark } : it
      );
      const total = newItems.reduce((s, it) => s + Number(it.amount), 0);
      return { ...p, items: newItems, amount: total };
    });
    setEditingItem(null);
  };

  // ── Display values (show edited profile fields if in edit mode) ───────────
  const displayName   = profileEdit ? profileForm.fullName : (rcForm?.fullName || rcForm?.ReceivedFrom || member?.name   || '');
  const displayIts    = profileEdit ? profileForm.itsNo   : (rcForm?.itsNo    || rcForm?.ITSNo        || member?.itsNo  || '');
  const displayMobile = profileEdit ? profileForm.mobile  : (rcForm?.mobile   || rcForm?.Mobile       || member?.mobile || '');
  const displaySector = profileEdit ? profileForm.sector  : (rcForm?.sector   || member?.sector       || '');

  // ── Previous update info from DB ──────────────────────────────────────────
  const prevReason = rcForm?.RecordUpdateReason || rcForm?.recordUpdateReason || '';
  const prevDate   = rcForm?.RecordUpdateDate   || rcForm?.recordUpdateDate   || '';

  const handleSave = () => {
    if (!String(rcForm?.updateReason ?? '').trim()) {
      toast.error('Reason for this update is required');
      setTimeout(() => updateReasonRef.current?.focus(), 0);
      return;
    }
    onSave();
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Edit Receipt — ${displayName || member?.name} (Acc# ${member?.accno})`}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {onPrint && (
            <button className="btn btn-secondary" onClick={onPrint}>
              <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Only
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Receipt
          </button>
        </>
      }
    >
      <div className="space-y-3">

        {/* ── 1. Mumin Profile ──────────────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Mumin Profile
            </span>
            <button
              className={`text-[11px] px-2.5 py-0.5 rounded font-medium border transition-colors ${
                profileEdit
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-border text-gray-500 hover:text-gray-700 hover:border-gray-400'
              }`}
              onClick={profileEdit ? doneProfileEdit : openProfileEdit}
            >
              {profileEdit ? '✓ Done' : 'Edit'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* AccNo: permanently locked regardless of profileEdit */}
            <div>
              <label className="form-label flex items-center gap-1.5">
                Acc No.
                <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Locked</span>
              </label>
              <input className="form-input bg-gray-50 cursor-not-allowed" value={member?.accno || ''} readOnly />
            </div>

            <div>
              <label className="form-label">Full Name</label>
              {profileEdit ? (
                <input
                  className="form-input"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                />
              ) : (
                <input className="form-input bg-gray-50" value={displayName} readOnly />
              )}
            </div>

            <div>
              <label className="form-label">Mobile</label>
              {profileEdit ? (
                <input
                  className="form-input"
                  value={profileForm.mobile}
                  onChange={e => setProfileForm(p => ({ ...p, mobile: e.target.value }))}
                />
              ) : (
                <input className="form-input bg-gray-50" value={displayMobile} readOnly />
              )}
            </div>

            <div>
              <label className="form-label">ITS No.</label>
              {profileEdit ? (
                <input
                  className="form-input"
                  value={profileForm.itsNo}
                  onChange={e => setProfileForm(p => ({ ...p, itsNo: e.target.value }))}
                />
              ) : (
                <input className="form-input bg-gray-50" value={displayIts} readOnly />
              )}
            </div>

            <div>
              <label className="form-label">Local HOF ITS No.</label>
              <input className="form-input bg-gray-50" value={member?.hofIts || ''} readOnly />
            </div>

            <div>
              <label className="form-label">Sector</label>
              {profileEdit ? (
                <input
                  className="form-input"
                  value={profileForm.sector}
                  onChange={e => setProfileForm(p => ({ ...p, sector: e.target.value }))}
                />
              ) : (
                <input className="form-input bg-gray-50" value={displaySector} readOnly />
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Transaction Info ───────────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-3">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Transaction Info
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="form-label flex items-center gap-1.5">
                Received Date
                {isDateLocked && (
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Locked</span>
                )}
              </label>
              <input
                type="date"
                className={`form-input ${isDateLocked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                value={receivedDateStr}
                readOnly={isDateLocked}
                onChange={isDateLocked ? undefined : e => setRcForm(p => ({ ...p, receivedDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-1.5">
                Mode
                {isCashMemo && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Locked</span>}
              </label>
              {isCashMemo ? (
                <input className="form-input bg-gray-50 cursor-not-allowed" value="Cash Memo" readOnly />
              ) : (
                <select
                  className="form-select"
                  value={rcForm?.mode || 'Cash'}
                  onChange={e => setRcForm(p => ({ ...p, mode: e.target.value }))}
                >
                  {['Cash', 'Online', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">Transaction Ref No.</label>
              <input
                className="form-input"
                placeholder="Cheque / UPI / Txn ref…"
                value={rcForm?.transactionRefNo ?? rcForm?.TransactionRefNo ?? ''}
                onChange={e => setRcForm(p => ({ ...p, transactionRefNo: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={rcForm?.status || ''}
                onChange={e => setRcForm(p => ({ ...p, status: e.target.value }))}
              >
                {['Clear', 'Pending', 'Bounce', 'Cancel Receipt', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Receipt No.</label>
              <input className="form-input bg-gray-50" value={rcForm?.receiptNo || ''} readOnly />
            </div>
            <div className="col-span-2 sm:col-span-5">
              <label className="form-label">Remark</label>
              <input
                className="form-input"
                placeholder="Optional"
                value={rcForm?.remark ?? rcForm?.Remark ?? ''}
                onChange={e => setRcForm(p => ({ ...p, remark: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Items Table (Hub Sub Head locked) ─────────────────────────── */}
        <div className="rounded-lg overflow-hidden border border-border">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Action', 'S.No#', 'Hub Sub Head', 'For Year', 'Grade', 'Amount (₹)', 'Remark'].map(h => (
                  <th key={h} className="th-navy whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isEditing = editingItem === idx;
                if (isEditing) {
                  return (
                    <tr key={idx} className="bg-blue-50">
                      <td className="px-2 py-1.5 border-t border-border whitespace-nowrap">
                        <button
                          className="text-[11px] px-1.5 py-0.5 bg-green-600 text-white rounded mr-1"
                          onClick={() => saveItemEdit(idx)}
                        >Save</button>
                        <button
                          className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded"
                          onClick={() => setEditingItem(null)}
                        >✕</button>
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-gray-400">{idx + 1}</td>
                      {/* Hub Sub Head: readonly text even in edit mode */}
                      <td className="px-3 py-1.5 border-t border-border text-gray-700 font-medium">
                        {item.subHead || '—'}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input
                          className="form-input text-[11px]"
                          value={editBuf.forYear || ''}
                          onChange={e => setEditBuf(p => ({ ...p, forYear: e.target.value }))}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input
                          className="form-input text-[11px] w-16"
                          value={editBuf.grade || ''}
                          onChange={e => setEditBuf(p => ({ ...p, grade: e.target.value }))}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input
                          type="number"
                          className={`form-input text-[11px] ${isCash && Number(editBuf.amount) > cashLimit ? 'border-red-400 bg-red-50' : ''}`}
                          value={editBuf.amount || ''}
                          onChange={e => setEditBuf(p => ({ ...p, amount: e.target.value }))}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input
                          className="form-input text-[11px]"
                          value={editBuf.remark || ''}
                          onChange={e => setEditBuf(p => ({ ...p, remark: e.target.value }))}
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={idx} className="hover:bg-blue-500/[0.025]">
                    <td className="px-2 py-2 border-t border-border">
                      <button
                        className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Edit item"
                        onClick={() => startItemEdit(idx)}
                        disabled={editingItem !== null && editingItem !== idx}
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2 border-t border-border text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 border-t border-border">{item.subHead || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{item.forYear || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{item.grade || '—'}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">
                      {fmt(item.amount)}
                    </td>
                    <td className="px-3 py-2 border-t border-border text-gray-500">{item.remark || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-navy-800">
                <td colSpan={5} className="px-3 py-2.5 text-white font-semibold">
                  Grand Total {items.length > 1 ? `(${items.length} items)` : ''}
                </td>
                <td className={`px-3 py-2.5 font-bold text-[13px] ${overLimit ? 'text-red-300' : 'text-white'}`}>
                  {fmt(amount)}
                  {overLimit && <span className="ml-1">⚠</span>}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Cash limit warning banner ─────────────────────────────────────── */}
        {overLimit && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11.5px] text-red-700">
            ⚠ Cash receipt total {fmt(amount)} exceeds the per-receipt cash limit of {fmt(cashLimit)}.
            Change the mode to Online / Cheque / UPI or reduce the amounts.
          </div>
        )}

        {/* ── 4. Record Update Reason ───────────────────────────────────────── */}
        <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2.5">
            Update Record
          </div>

          {/* Previous update info pulled from DB (readonly) */}
          {(prevReason || prevDate) && (
            <div className="flex items-start gap-6 mb-3 pb-3 border-b border-amber-200">
              <div className="flex-1 min-w-0">
                <label className="form-label text-gray-400">Last Update Reason</label>
                <p className="text-[12px] text-gray-600 leading-relaxed">{prevReason || '—'}</p>
              </div>
              <div className="shrink-0">
                <label className="form-label text-gray-400">Last Update Date</label>
                <p className="text-[12px] text-gray-600 whitespace-nowrap">{fmtDateTime(prevDate)}</p>
              </div>
            </div>
          )}

          {/* New reason — required before saving */}
          <div>
            <label className="form-label">
              Reason for this Update <span className="text-red-500">*</span>
            </label>
            <input
              ref={updateReasonRef}
              className="form-input"
              placeholder="Enter reason for this change…"
              value={rcForm?.updateReason || ''}
              onChange={e => setRcForm(p => ({ ...p, updateReason: e.target.value }))}
            />
          </div>
        </div>

      </div>
    </Modal>
  );
}
