'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon, EditIcon, TrashIcon } from '@/components/shared/Icons';
import { fmt, today } from '../../utils';
import { memberService, takhmeenService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const DEFAULT_CASH_LIMIT = 9500;

function sortFamilyMembers(members, hofIts) {
  return [...members].sort((a, b) => {
    const aIsHof = String(a.ITS_ID) === String(hofIts);
    const bIsHof = String(b.ITS_ID) === String(hofIts);
    if (aIsHof !== bIsHof) return aIsHof ? -1 : 1;
    return Number(b.Age || b.age || 0) - Number(a.Age || a.age || 0);
  });
}

function normList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.recordset) return data.recordset;
  if (Array.isArray(data.recordsets?.[0])) return data.recordsets[0];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function extractMuminRow(data, searchAccno) {
  let list = [];
  if (Array.isArray(data?.recordsets?.[0])) list = data.recordsets[0];
  else if (Array.isArray(data?.recordset))  list = data.recordset;
  else if (Array.isArray(data?.data))       list = data.data;
  else if (Array.isArray(data))             list = data;
  else if (data)                            list = [data?.member ?? data];

  // Prefer exact acc# match over first result
  const exact = searchAccno
    ? list.find(r => String(r?.AccNo || r?.accno || '') === String(searchAccno))
    : null;
  const raw = exact ?? list[0];

  if (!raw || !(raw.AccNo || raw.accno || raw.FullName)) return null;
  return {
    accno:       raw.AccNo        || raw.accno        || '',
    fullName:    raw.FullName     || raw.fullName     || '',
    mobile:      raw.Mobile       || raw.mobile       || '',
    itsNo:       raw.ITSNo        || raw.itsNo        || '',
    localHofIts: raw.LocalHOFITSNo                   || '',
    sector:      raw.Sector       || raw.sector       || '',
    grade:       raw.CurrentGrade || raw.grade        || '',
  };
}

export default function AddReceiptModal({
  open, onClose, member,
  rcForm, setRcForm,
  rcItem, setRcItem,
  rcItems, setRcItems,
  onSave,
}) {
  const { user } = useAuth();
  // ── Profile card state ────────────────────────────────────────────────────
  const [profile, setProfile]               = useState({});
  const [profileEdit, setProfileEdit]       = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Family members ────────────────────────────────────────────────────────
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyLoading, setFamilyLoading] = useState(false);

  // ── Hub heads from API ────────────────────────────────────────────────────
  const [hubHeads, setHubHeads] = useState([]);

  // ── Remaining amount from takhmeen ────────────────────────────────────────
  const [remainingAmt, setRemainingAmt]   = useState(null);
  const [remainingLoad, setRemainingLoad] = useState(false);

  // ── Inline item editing ───────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf]     = useState({});

  // ── Family receipt split rows ─────────────────────────────────────────────
  const [splitRows, setSplitRows] = useState([]);

  // ── Split-row name combobox ───────────────────────────────────────────────
  const [openSuggestIdx, setOpenSuggestIdx] = useState(null);

  // ── Save guard (prevents double-click) ───────────────────────────────────
  const [saving, setSaving] = useState(false);

  const accTimer     = useRef(null);
  const itsTimer     = useRef(null);
  const forYearTimer = useRef(null);

  const accnoRef   = useRef(null);
  const fullNameRef = useRef(null);
  const dateRef    = useRef(null);
  const modeRef    = useRef(null);

  const currentSubHead  = rcItem.hubSubHead || rcItem.hubType || '';
  const selectedHead    = hubHeads.find(h => h.HubSubHead === currentSubHead);
  const currentFundType = rcItem.fundType || selectedHead?.FundType || '';
  const cashLimit       = Number(selectedHead?.CashLimit ?? selectedHead?.Cash_Limit ?? DEFAULT_CASH_LIMIT);
  const currentContributionType = selectedHead?.ContributionType || rcForm.transType || 'VOLUNTARY CONTRIBUTION';

  const grandTotal  = rcItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const isCashMemo  = rcForm.mode === 'Cash Memo';
  const needsSplit  = rcForm.mode === 'Cash' && grandTotal > cashLimit;
  const splitTotal  = splitRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const splitDiff   = grandTotal - splitTotal;           // >0 = unallocated, <0 = over
  const splitOk     = needsSplit ? Math.abs(splitDiff) < 0.01 : true;

  // Re-init when modal opens
  useEffect(() => {
    if (!open) return;
    setProfile({
      accno:       member?.accno    || '',
      fullName:    member?.name     || '',
      mobile:      member?.mobile   || '',
      itsNo:       member?.itsNo    || '',
      localHofIts: member?.hofIts   || '',
      sector:      member?.sector   || '',
      grade:       member?.grade    || '',
    });
    setProfileEdit(false);
    setEditingId(null);
    setSplitRows([]);
    setRemainingAmt(null);
    setOpenSuggestIdx(null);
    setSaving(false);
    // Reset form fields so reopening the modal always starts clean
    setRcItems([]);
    setRcForm({ date: today(), mode: 'Cash', transType: 'VOLUNTARY CONTRIBUTION', transactionRefNo: '', remark: '', sendSMS: false, isCashMemo: false, sendWhatsApp: false, whatsAppMobile: '' });
    setRcItem({ hubSubHead: '', hubMainHead: '', fundType: '', hubType: '', forYear: '', grade: member?.grade || '', amount: '', remark: '' });
  }, [open, member]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load hub heads on open
  useEffect(() => {
    if (!open) return;
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => setHubHeads(normList(res.data).filter(h => h && h.HubSubHead).sort((a, b) => a.HubSubHead.localeCompare(b.HubSubHead))))
      .catch(() => setHubHeads([]));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load family members when modal opens
  useEffect(() => {
    if (!open || !member?.hofIts) return;
    setFamilyLoading(true);
    memberService.loadFamilyMembersDetails({ HOF_ID: member.hofIts })
      .then(res => setFamilyMembers(normList(res.data)))
      .catch(() => setFamilyMembers([]))
      .finally(() => setFamilyLoading(false));
  }, [open, member?.hofIts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate split rows whenever grand total or family list changes
  useEffect(() => {
    if (!needsSplit || grandTotal <= 0) { setSplitRows([]); return; }
    const count  = Math.ceil(grandTotal / cashLimit);
    const sorted = sortFamilyMembers(familyMembers, profile.localHofIts);
    setSplitRows(prev => Array.from({ length: count }, (_, i) => {
      const prevRow = prev[i];
      const fam     = sorted[i];
      const amt = i < count - 1
        ? cashLimit
        : grandTotal - cashLimit * (count - 1);
      return {
        familyMemberName: prevRow?.familyMemberName || fam?.Full_Name         || '',
        itsId:            prevRow?.itsId            || String(fam?.ITS_ID  || ''),
        mobile:           prevRow?.mobile           || String(fam?.Mobile  || ''),
        amount: amt,
      };
    }));
  }, [grandTotal, needsSplit, familyMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ITSNo change ─────────────────────────────────────────────────────────
  const onItsChange = (val) => {
    const found = familyMembers.find(m => String(m.ITS_ID) === String(val));
    setProfile(p => ({
      ...p,
      itsNo:       val,
      fullName:    found?.Full_Name                                || p.fullName,
      mobile:      found?.Mobile    || found?.mobile              || p.mobile,
      localHofIts: found ? String(found.LocalHOFITSNo || found.HOF_ID || p.localHofIts) : p.localHofIts,
    }));
    if (!val) return;
    clearTimeout(itsTimer.current);
    itsTimer.current = setTimeout(async () => {
      setProfileLoading(true);
      try {
        const res  = await memberService.loadFamilyMembersDetails({ ITS_ID: val });
        const list = normList(res.data);
        const rec  = list.find(m => String(m.ITS_ID) === String(val)) || list[0];
        if (rec) {
          setProfile(p => ({
            ...p,
            fullName:    rec.Full_Name                                     || p.fullName,
            mobile:      rec.Mobile    || rec.mobile                       || p.mobile,
            localHofIts: String(rec.LocalHOFITSNo || rec.HOF_ID           || p.localHofIts),
            accno:       rec.AccNo     || rec.accno                        || p.accno,
            sector:      rec.Sector    || rec.sector                       || p.sector,
            grade:       rec.CurrentGrade || rec.grade                     || p.grade,
          }));
          setRcItem(p => ({ ...p, grade: rec.CurrentGrade || rec.grade || p.grade }));
        }
      } catch { /* silent */ } finally { setProfileLoading(false); }
    }, 500);
  };

  // ── AccNo change ──────────────────────────────────────────────────────────
  const onAccNoChange = (val) => {
    setProfile(p => ({ ...p, accno: val }));
    clearTimeout(accTimer.current);
    if (!val || val.length < 1) return;
    accTimer.current = setTimeout(async () => {
      setProfileLoading(true);
      try {
        const res  = await memberService.loadMuminDetails({ Search: val });
        const norm = extractMuminRow(res.data, val);
        if (norm) {
          setProfile(norm);
          if (norm.localHofIts) {
            const fr = await memberService.loadFamilyMembersDetails({ HOF_ID: norm.localHofIts });
            setFamilyMembers(normList(fr.data));
          }
        } else {
          toast.error(`No member found for Acc# ${val}`);
        }
      } catch { toast.error('Failed to look up member'); }
      finally  { setProfileLoading(false); }
    }, 700);
  };

  // ── Hub Sub Head change ───────────────────────────────────────────────────
  const onHubSubHeadChange = (val) => {
    const found = hubHeads.find(h => h.HubSubHead === val);
    setRcItem(p => ({
      ...p,
      hubSubHead:  val,
      hubType:     val,
      hubMainHead: found?.HubMainHead || '',
      fundType:    found?.FundType    || '',
      forYear:     '',
      grade:       '',
      amount:      '',
    }));
    if (found?.ContributionType) {
      setRcForm(p => ({ ...p, transType: found.ContributionType }));
    }
    setRemainingAmt(null);
    if (rcItem.forYear && profile.accno) {
      fetchRemaining(profile.accno, rcItem.forYear, val);
    }
  };

  // ── ForYear change ────────────────────────────────────────────────────────
  const onForYearChange = (val) => {
    setRcItem(p => ({ ...p, forYear: val }));
    setRemainingAmt(null);
    clearTimeout(forYearTimer.current);
    const subHead = rcItem.hubSubHead || rcItem.hubType;
    if (!val || !subHead || !profile.accno) return;
    forYearTimer.current = setTimeout(() => fetchRemaining(profile.accno, val, subHead), 600);
  };

  const fetchRemaining = async (accno, forYear, hubSubHead) => {
    setRemainingLoad(true);
    try {
      const res  = await takhmeenService.loadDetails({ AccNo: accno, ForYear: forYear, HubSubHead: hubSubHead });
      const list = normList(res.data);
      const rec  = list[0];
      const amt  = rec?.RemainingAmount ?? rec?.Remaining ?? rec?.remaining ?? null;
      setRemainingAmt(amt);
      const grade = rec?.Grade || rec?.grade || rec?.CurrentGrade || '';
      if (grade) setRcItem(p => ({ ...p, grade }));

      if (amt != null && Number(amt) > 0) {
        // Due exists — auto-fill amount with due
        setRcItem(p => ({ ...p, amount: Number(amt) }));
      } else {
        // No due — fetch DefaultLaagat for this sub head
        try {
          const hdRes  = await takhmeenService.loadHubHeadDetails({ HubSubHead: hubSubHead, IsActive: 1 });
          const hdList = normList(hdRes.data);
          const hdRec  = hdList[0];
          const defAmt = hdRec?.DefaultLaagat ?? hdRec?.defaultLaagat ?? null;
          if (defAmt != null) {
            setRcItem(p => ({ ...p, amount: Number(defAmt) || '' }));
          }
        } catch { /* silent */ }
      }
    } catch { setRemainingAmt(null); }
    finally  { setRemainingLoad(false); }
  };

  // ── Items ─────────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!rcItem.amount || Number(rcItem.amount) <= 0) return;
    const subHead = rcItem.hubSubHead || rcItem.hubType || hubHeads[0]?.HubSubHead || '';

    // Enforce single HubSubHead type per receipt
    const existingHead = rcItems[0]?.hubSubHead || rcItems[0]?.hubType;
    if (existingHead && existingHead !== subHead) {
      if (!window.confirm(
        `Receipt already has items under "${existingHead}".\n` +
        `Adding "${subHead}" will remove all existing items. Continue?`
      )) return;
      setRcItems([]);
      setSplitRows([]);
    }

    setRcItems(p => [...p, {
      ...rcItem,
      id:          Date.now(),
      hubSubHead:  subHead,
      hubType:     subHead,
      hubMainHead: rcItem.hubMainHead || '',
      fundType:    rcItem.fundType    || '',
      amount:      Number(rcItem.amount),
      grade:       rcItem.grade || '',
    }]);
    setRcItem(p => ({ ...p, amount: '', remark: '' }));
    setRemainingAmt(null);
  };

  const saveEdit = () => {
    setRcItems(p => p.map(x =>
      x.id === editingId ? { ...editBuf, amount: Number(editBuf.amount || 0) } : x
    ));
    setEditingId(null);
  };

  // ── Split row helpers ─────────────────────────────────────────────────────
  const setSplitMember = (i, member) => {
    setSplitRows(p => p.map((r, j) => j === i ? {
      ...r,
      familyMemberName: member.Full_Name      || '',
      itsId:            String(member.ITS_ID  || ''),
      mobile:           String(member.Mobile  || ''),
    } : r));
    setOpenSuggestIdx(null);
  };

  const buildPayload = (printOnly) => ({
    profile,
    rcForm,
    rcItems,
    splitRows: needsSplit ? splitRows : [],
    printOnly,
  });

  const handleSave = async (printOnly) => {
    if (saving) return;

    if (!String(profile.accno ?? '').trim()) {
      toast.error('Acc No. is required');
      setTimeout(() => accnoRef.current?.focus(), 0);
      return;
    }
    if (!String(profile.fullName ?? '').trim()) {
      toast.error('Full Name is required');
      setTimeout(() => fullNameRef.current?.focus(), 0);
      return;
    }
    if (!rcForm.date) {
      toast.error('Received Date is required');
      setTimeout(() => dateRef.current?.focus(), 0);
      return;
    }
    if (!rcForm.mode) {
      toast.error('Mode is required');
      setTimeout(() => modeRef.current?.focus(), 0);
      return;
    }
    if (rcItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!splitOk) {
      const dir = splitDiff > 0 ? `${fmt(splitDiff)} unallocated` : `${fmt(-splitDiff)} over-allocated`;
      alert(`Split amounts must equal Grand Total (${fmt(grandTotal)}). Currently ${dir}.`);
      return;
    }
    setSaving(true);
    try {
      await onSave(buildPayload(printOnly));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Add Receipt — ${profile.fullName || member?.name} (Acc# ${profile.accno || member?.accno})`}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSave(false)}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Receipt'}
          </button>
        </>
      }
    >
      <div className="space-y-3">

        {/* ── 1. Mumin Profile Info Card ──────────────────────────────────── */}
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Mumin Profile
              </span>
              {(profileLoading || familyLoading) && (
                <span className="text-[10px] text-blue-400 animate-pulse">
                  {familyLoading ? 'Loading family…' : 'Loading…'}
                </span>
              )}
            </div>
            <button
              className={`text-[11px] px-2.5 py-0.5 rounded font-medium border transition-colors ${
                profileEdit
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-border text-gray-500 hover:text-gray-700 hover:border-gray-400'
              }`}
              onClick={() => setProfileEdit(v => !v)}
            >
              {profileEdit ? '✓ Done' : 'Edit'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Acc No.</label>
              <input
                ref={accnoRef}
                className="form-input"
                value={profile.accno || ''}
                disabled={!profileEdit}
                onChange={e => onAccNoChange(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <input
                ref={fullNameRef}
                className="form-input"
                value={profile.fullName || ''}
                disabled={!profileEdit}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Mobile</label>
              <input
                className="form-input"
                value={profile.mobile || ''}
                disabled={!profileEdit}
                onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ITS No.</label>
              {profileEdit && familyMembers.length > 0 ? (
                <select
                  className="form-select"
                  value={profile.itsNo || ''}
                  onChange={e => onItsChange(e.target.value)}
                >
                  <option value="">— Select ITS —</option>
                  {sortFamilyMembers(familyMembers, profile.localHofIts).map(m => (
                    <option key={m.ITS_ID} value={String(m.ITS_ID)}>
                      {m.ITS_ID} — {m.Full_Name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  value={profile.itsNo || ''}
                  disabled={!profileEdit}
                  onChange={e => setProfile(p => ({ ...p, itsNo: e.target.value }))}
                />
              )}
            </div>
            <div>
              <label className="form-label">Local HOF ITS No.</label>
              <input
                className="form-input"
                value={profile.localHofIts || ''}
                disabled={!profileEdit}
                onChange={e => setProfile(p => ({ ...p, localHofIts: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Sector</label>
              <input
                className="form-input"
                value={profile.sector || ''}
                disabled={!profileEdit}
                onChange={e => setProfile(p => ({ ...p, sector: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Transaction Info Card ──────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-3">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Transaction Info
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36 shrink-0">
              <label className="form-label">Received Date</label>
              <input
                ref={dateRef}
                type="date"
                className="form-input"
                value={rcForm.date || ''}
                onChange={e => setRcForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="shrink-0">
              <label className="form-label">Mode</label>
              <div className="flex items-center gap-2">
                <select
                  ref={modeRef}
                  className="form-select w-32"
                  value={rcForm.mode || 'Cash'}
                  onChange={e => setRcForm(p => ({ ...p, mode: e.target.value }))}
                >
                  {['Cash', 'Cash Memo', 'Online', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="w-40 shrink-0">
              <label className="form-label">Transaction Ref No.</label>
              <input
                className="form-input"
                placeholder="Cheque / UPI / Txn ref…"
                value={rcForm.transactionRefNo || ''}
                onChange={e => setRcForm(p => ({ ...p, transactionRefNo: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="form-label">Remark</label>
              <input
                className="form-input"
                placeholder="Optional"
                value={rcForm.remark || ''}
                onChange={e => setRcForm(p => ({ ...p, remark: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Add Items Card ─────────────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-3">
          <div className="relative flex items-center mb-2.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Add Item
            </span>
            {currentFundType && (
              <span className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-navy-800 uppercase tracking-wide">
                {currentFundType}
              </span>
            )}
            {currentContributionType && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                {currentContributionType}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="form-label">Hub Sub Head</label>
              <select
                className="form-select"
                value={currentSubHead}
                onChange={e => onHubSubHeadChange(e.target.value)}
              >
                <option value="">— Select Sub Head —</option>
                {hubHeads.map((h, idx) => (
                  <option key={h.HubSubHead || idx} value={h.HubSubHead}>{h.HubSubHead}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">For Year</label>
              <input
                className="form-input"
                placeholder={String(user?.ForYearAll || new Date().getFullYear())}
                value={rcItem.forYear || ''}
                onChange={e => onForYearChange(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Grade</label>
              <input
                className="form-input"
                placeholder="e.g. A"
                value={rcItem.grade || ''}
                onChange={e => setRcItem(p => ({ ...p, grade: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-2">
                Amount (₹)
                {remainingLoad && (
                  <span className="text-[10px] text-gray-400 animate-pulse">loading…</span>
                )}
                {remainingAmt !== null && !remainingLoad && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold">
                    Due: {fmt(remainingAmt)}
                  </span>
                )}
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={rcItem.amount || ''}
                onChange={e => setRcItem(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button className="btn btn-secondary w-full" onClick={addItem}>+ Add</button>
            </div>
          </div>
        </div>

        {/* ── 4. Items Grid ─────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
        <div className="rounded-lg overflow-hidden border border-border min-w-[520px]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Action', 'S.No#', 'Hub Sub Head', 'For Year', 'Grade', 'Amount (₹)', 'Remark'].map(h => (
                  <th key={h} className="th-navy whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rcItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-[11px]">
                    No items added — use the form above to add items.
                  </td>
                </tr>
              )}
              {rcItems.map((it, i) =>
                editingId === it.id ? (
                  <tr key={it.id} className="bg-blue-50">
                    <td className="px-2 py-1.5 border-t border-border">
                      <button
                        className="text-[11px] px-1.5 py-0.5 bg-green-600 text-white rounded mr-1"
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                      <button
                        className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </button>
                    </td>
                    <td className="px-2 py-1.5 border-t border-border text-gray-400">{i + 1}</td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <select
                        className="form-select text-[11px]"
                        value={editBuf.hubSubHead || editBuf.hubType || ''}
                        onChange={e => {
                          const val   = e.target.value;
                          const found = hubHeads.find(h => h.HubSubHead === val);
                          setEditBuf(p => ({
                            ...p,
                            hubSubHead:  val,
                            hubType:     val,
                            hubMainHead: found?.HubMainHead || p.hubMainHead || '',
                          }));
                        }}
                      >
                        <option value="">— Select —</option>
                        {hubHeads.map(h => (
                          <option key={h.HubSubHead} value={h.HubSubHead}>{h.HubSubHead}</option>
                        ))}
                      </select>
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
                        className="form-input text-[11px]"
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
                ) : (
                  <tr key={it.id} className="hover:bg-blue-500/[0.025]">
                    <td className="px-2 py-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit"
                          onClick={() => { setEditingId(it.id); setEditBuf({ ...it }); }}
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                          onClick={() => setRcItems(p => p.filter(x => x.id !== it.id))}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-t border-border text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 border-t border-border">{it.hubSubHead || it.hubType || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{it.forYear || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{it.grade || '—'}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(it.amount)}</td>
                    <td className="px-3 py-2 border-t border-border text-gray-500">{it.remark || '—'}</td>
                  </tr>
                )
              )}
            </tbody>
            {rcItems.length > 0 && (
              <tfoot>
                <tr className="bg-navy-800">
                  <td colSpan={5} className="px-3 py-2.5 text-white font-semibold">Grand Total</td>
                  <td className="px-3 py-2.5 text-white font-bold text-[13px]">{fmt(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        </div>

        {/* ── 5. Receipt for Family Members (only when total > cash limit) ──── */}
        {needsSplit && (
          <div className="border border-amber-300 bg-amber-50/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Receipt for Family Members
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                Cash Limit: {fmt(cashLimit)} / receipt
              </span>
            </div>
            <p className="text-[11px] text-amber-600 mb-2.5">
              Grand total {fmt(grandTotal)} exceeds the per-receipt cash limit.
              Assign each split receipt to a family member:
            </p>
            <div className="overflow-x-auto">
            <div className="rounded-lg overflow-hidden border border-amber-200 min-w-[480px]">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="th-navy w-12">Rcpt #</th>
                    <th className="th-navy">Family Member Name</th>
                    <th className="th-navy w-28 text-center">ITS ID</th>
                    <th className="th-navy w-32 text-center">Mobile</th>
                    <th className="th-navy w-28 text-center">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {splitRows.map((row, i) => {
                    const query       = row.familyMemberName || '';
                    const suggestions = familyMembers.filter(m =>
                      !query || m.Full_Name?.toLowerCase().includes(query.toLowerCase())
                    );
                    return (
                      <tr key={i} className="hover:bg-amber-50">
                        <td className="px-3 py-2 border-t border-amber-200 text-center text-gray-500 font-medium">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200">
                          <div className="relative">
                            <input
                              className="form-input"
                              placeholder="Search family member…"
                              value={query}
                              autoComplete="off"
                              onChange={e => {
                                const val = e.target.value;
                                setSplitRows(p => p.map((r, j) =>
                                  j === i ? { ...r, familyMemberName: val, itsId: '', mobile: '' } : r
                                ));
                                setOpenSuggestIdx(i);
                              }}
                              onFocus={() => setOpenSuggestIdx(i)}
                              onBlur={() => setTimeout(() => setOpenSuggestIdx(p => p === i ? null : p), 150)}
                            />
                            {openSuggestIdx === i && suggestions.length > 0 && (
                              <div className="absolute z-50 top-full left-0 right-0 bg-white border border-border rounded shadow-lg max-h-44 overflow-y-auto">
                                {suggestions.map(m => (
                                  <div
                                    key={m.ITS_ID}
                                    className="px-3 py-1.5 text-[12px] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                    onMouseDown={() => setSplitMember(i, m)}
                                  >
                                    <span className="font-medium">{m.Full_Name}</span>
                                    <span className="text-gray-400 ml-1.5 text-[11px]">
                                      ITS: {m.ITS_ID} · {m.Mobile || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-t border-amber-200">
                          <input
                            className="form-input text-[11px] text-center"
                            placeholder="ITS ID"
                            value={row.itsId || ''}
                            onChange={e => setSplitRows(p => p.map((r, j) =>
                              j === i ? { ...r, itsId: e.target.value } : r
                            ))}
                          />
                        </td>
                        <td className="px-2 py-1.5 border-t border-amber-200">
                          <input
                            className="form-input text-[11px] text-center"
                            placeholder="Mobile"
                            value={row.mobile || ''}
                            onChange={e => setSplitRows(p => p.map((r, j) =>
                              j === i ? { ...r, mobile: e.target.value } : r
                            ))}
                          />
                        </td>
                        <td className="px-2 py-1.5 border-t border-amber-200">
                          <input
                            type="number"
                            className="form-input text-[11px] text-center font-semibold"
                            value={row.amount || ''}
                            onChange={e => setSplitRows(p => p.map((r, j) =>
                              j === i ? { ...r, amount: Number(e.target.value) } : r
                            ))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={splitOk ? 'bg-green-50' : 'bg-red-50'}>
                    <td colSpan={2} className={`px-3 py-2 text-[11px] font-semibold ${splitOk ? 'text-green-700' : 'text-red-600'}`}>
                      {splitOk ? '✓ Amounts balanced' : `⚠ ${splitDiff > 0 ? fmt(splitDiff) + ' unallocated' : fmt(-splitDiff) + ' over-allocated'}`}
                    </td>
                    <td colSpan={2} className={`px-3 py-2 text-center text-[11px] text-gray-500`}>
                      Split Total
                    </td>
                    <td className={`px-3 py-2 text-center font-bold text-[12px] ${splitOk ? 'text-green-700' : 'text-red-600'}`}>
                      {fmt(splitTotal)} / {fmt(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* ── Notifications ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 p-2.5 bg-surface rounded-md border border-border">
          {/* <label className="flex items-center gap-2 text-[11.5px] text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="accent-blue-500 w-3.5 h-3.5"
              checked={rcForm.sendSMS || false}
              onChange={e => setRcForm(p => ({ ...p, sendSMS: e.target.checked }))}
            />
            Send SMS confirmation to {profile.mobile || member?.mobile}
          </label> */}

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[11.5px] text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="accent-green-600 w-3.5 h-3.5"
                checked={rcForm.sendWhatsApp || false}
                onChange={e => setRcForm(p => ({ ...p, sendWhatsApp: e.target.checked }))}
              />
              <span className={`font-medium ${rcForm.sendWhatsApp ? 'text-green-700' : 'text-gray-600'}`}>
                Send WhatsApp acknowledgment + PDF
              </span>
            </label>
            {rcForm.sendWhatsApp && (
              <input
                className="form-input text-[11px] w-40"
                placeholder={profile.mobile || member?.mobile || 'Mobile no.'}
                value={rcForm.whatsAppMobile || ''}
                onChange={e => setRcForm(p => ({ ...p, whatsAppMobile: e.target.value }))}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
