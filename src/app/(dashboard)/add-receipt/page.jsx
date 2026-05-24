'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { memberService, receiptService, takhmeenService } from '@/services';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { TrashIcon, SaveIcon, EditIcon } from '@/components/shared/Icons';
import ReceiptPrintModal from '@/components/shared/ReceiptPrintModal';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const DEFAULT_CASH_LIMIT = 9500;

const SUB_HEADS = {
  Sabeel:   ['Sabeel Regular', 'Sabeel Mutaveteen'],
  FMB:      ['FMB Regular', 'FMB Half Thaali'],
  Vajebaat: ['Vajebaat', 'Vajebaat House', 'Sila Fitra', 'Shehrullah Niyaz', 'HIM', 'Taherabad Safar'],
  Other:    ['General', 'Other'],
};

function getMainHead(subHead) {
  for (const [main, subs] of Object.entries(SUB_HEADS)) {
    if (subs.includes(subHead)) return main;
  }
  return 'Other';
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
    address:     raw.Address      || raw.address      || raw.MohallaDescription || raw.Mohalla || raw.mohalla || '',
  };
}

function sortFamilyMembers(members, hofIts) {
  return [...members].sort((a, b) => {
    const aIsHof = String(a.ITS_ID) === String(hofIts);
    const bIsHof = String(b.ITS_ID) === String(hofIts);
    if (aIsHof !== bIsHof) return aIsHof ? -1 : 1;
    return Number(b.Age || b.age || 0) - Number(a.Age || a.age || 0);
  });
}

function distributeItems(items, splitRows) {
  const pool = items.map(it => ({ ...it, amount: Number(it.amount) }));
  return splitRows.map(row => {
    let budget = Number(row.amount);
    const receiptItems = [];
    while (budget > 0.005 && pool.length > 0) {
      const head = pool[0];
      if (head.amount <= budget + 0.005) {
        receiptItems.push({ ...head });
        budget -= head.amount;
        pool.shift();
      } else {
        receiptItems.push({ ...head, amount: budget });
        head.amount -= budget;
        budget = 0;
      }
    }
    return { ...row, items: receiptItems };
  });
}

const EMPTY_PROFILE = { accno: '', fullName: '', mobile: '', itsNo: '', localHofIts: '', sector: '', grade: '' };
const EMPTY_RC_FORM = { date: today(), mode: 'Cash', transType: 'VOLUNTARY CONTRIBUTION', remark: '', sendSMS: false, isCashMemo: false };
const EMPTY_RC_ITEM = { hubSubHead: '', hubMainHead: '', fundType: '', hubType: '', forYear: '', grade: '', amount: '', remark: '' };

export default function AddReceiptPage() {
  const { user } = useAuth();

  const [profile,        setProfile]        = useState(EMPTY_PROFILE);
  const [profileLoading, setProfileLoading] = useState(false);
  const [familyMembers,  setFamilyMembers]  = useState([]);
  const [familyLoading,  setFamilyLoading]  = useState(false);

  const [hubHeads,       setHubHeads]       = useState([]);

  const [rcForm,         setRcForm]         = useState(EMPTY_RC_FORM);
  const [rcItem,         setRcItem]         = useState(EMPTY_RC_ITEM);
  const [rcItems,        setRcItems]        = useState([]);

  const [remainingAmt,   setRemainingAmt]   = useState(null);
  const [remainingLoad,  setRemainingLoad]  = useState(false);

  const [editingId,      setEditingId]      = useState(null);
  const [editBuf,        setEditBuf]        = useState({});

  const [splitRows,      setSplitRows]      = useState([]);
  const [openSuggestIdx, setOpenSuggestIdx] = useState(null);

  const [saving,         setSaving]         = useState(false);
  const [printData,      setPrintData]      = useState(null);
  const [showPrint,      setShowPrint]      = useState(false);

  const accTimer     = useRef(null);
  const itsTimer     = useRef(null);
  const forYearTimer = useRef(null);

  const currentSubHead          = rcItem.hubSubHead || rcItem.hubType || '';
  const selectedHead            = hubHeads.find(h => h.HubSubHead === currentSubHead);
  const currentFundType         = rcItem.fundType || selectedHead?.FundType || '';
  const cashLimit               = Number(selectedHead?.CashLimit ?? selectedHead?.Cash_Limit ?? DEFAULT_CASH_LIMIT);
  const currentContributionType = selectedHead?.ContributionType || rcForm.transType || 'VOLUNTARY CONTRIBUTION';

  const grandTotal = rcItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const isCashMemo = !!rcForm.isCashMemo;
  const needsSplit = rcForm.mode === 'Cash' && grandTotal > cashLimit && !isCashMemo;
  const splitTotal = splitRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const splitDiff  = grandTotal - splitTotal;
  const splitOk    = needsSplit ? Math.abs(splitDiff) < 0.01 : true;

  // Load hub heads once
  useEffect(() => {
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => setHubHeads(
        normList(res.data).filter(h => h && h.HubSubHead).sort((a, b) => a.HubSubHead.localeCompare(b.HubSubHead))
      ))
      .catch(() => setHubHeads([]));
  }, []);

  // Auto-generate split rows when grand total or family list changes
  useEffect(() => {
    if (!needsSplit || grandTotal <= 0) { setSplitRows([]); return; }
    const count   = Math.ceil(grandTotal / cashLimit);
    const sorted  = sortFamilyMembers(familyMembers, profile.localHofIts);
    setSplitRows(prev => Array.from({ length: count }, (_, i) => {
      const prevRow = prev[i];
      const fam     = sorted[i];
      const amt     = i < count - 1 ? cashLimit : grandTotal - cashLimit * (count - 1);
      return {
        familyMemberName: prevRow?.familyMemberName || fam?.Full_Name        || '',
        itsId:            prevRow?.itsId            || String(fam?.ITS_ID  || ''),
        mobile:           prevRow?.mobile           || String(fam?.Mobile  || ''),
        amount: amt,
      };
    }));
  }, [grandTotal, needsSplit, familyMembers]); // eslint-disable-line

  // ── AccNo change (debounced auto-fill) ───────────────────────────────────────
  const onAccNoChange = (val) => {
    setProfile(p => ({ ...p, accno: val }));
    clearTimeout(accTimer.current);
    if (!val) return;
    accTimer.current = setTimeout(async () => {
      setProfileLoading(true);
      try {
        const res  = await memberService.loadMuminDetails({ Search: val });
        const norm = extractMuminRow(res.data, val);
        if (norm) {
          setProfile(norm);
          setRcItem(p => ({ ...p, grade: norm.grade || p.grade }));
          if (norm.localHofIts) {
            setFamilyLoading(true);
            memberService.loadFamilyMembersDetails({ HOF_ID: norm.localHofIts })
              .then(fr => setFamilyMembers(normList(fr.data)))
              .catch(() => setFamilyMembers([]))
              .finally(() => setFamilyLoading(false));
          }
        } else {
          toast.error(`No member found for Acc# ${val}`);
        }
      } catch { toast.error('Failed to look up member'); }
      finally  { setProfileLoading(false); }
    }, 700);
  };

  // ── ITS No change ────────────────────────────────────────────────────────────
  const onItsChange = (val) => {
    const found = familyMembers.find(m => String(m.ITS_ID) === String(val));
    setProfile(p => ({
      ...p,
      itsNo:       val,
      fullName:    found?.Full_Name                           || p.fullName,
      mobile:      found?.Mobile || found?.mobile             || p.mobile,
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
            fullName:    rec.Full_Name                             || p.fullName,
            mobile:      rec.Mobile    || rec.mobile               || p.mobile,
            localHofIts: String(rec.LocalHOFITSNo || rec.HOF_ID   || p.localHofIts),
            accno:       rec.AccNo     || rec.accno                || p.accno,
            sector:      rec.Sector    || rec.sector               || p.sector,
            grade:       rec.CurrentGrade || rec.grade             || p.grade,
          }));
          setRcItem(p => ({ ...p, grade: rec.CurrentGrade || rec.grade || p.grade }));
        }
      } catch { } finally { setProfileLoading(false); }
    }, 500);
  };

  // ── Hub Sub Head change ───────────────────────────────────────────────────────
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
  };

  // ── For Year change ───────────────────────────────────────────────────────────
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
        setRcItem(p => ({ ...p, amount: Number(amt) }));
      } else {
        try {
          const hdRes  = await takhmeenService.loadHubHeadDetails({ HubSubHead: hubSubHead, IsActive: 1 });
          const hdList = normList(hdRes.data);
          const hdRec  = hdList[0];
          const defAmt = hdRec?.DefaultLaagat ?? hdRec?.defaultLaagat ?? null;
          if (defAmt != null) setRcItem(p => ({ ...p, amount: Number(defAmt) || '' }));
        } catch { }
      }
    } catch { setRemainingAmt(null); }
    finally  { setRemainingLoad(false); }
  };

  // ── Add item ──────────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!rcItem.amount || Number(rcItem.amount) <= 0) return;
    const subHead      = rcItem.hubSubHead || rcItem.hubType || hubHeads[0]?.HubSubHead || '';
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
    setRcItems(p => p.map(x => x.id === editingId ? { ...editBuf, amount: Number(editBuf.amount || 0) } : x));
    setEditingId(null);
  };

  // ── Split row helpers ─────────────────────────────────────────────────────────
  const setSplitMember = (i, member) => {
    setSplitRows(p => p.map((r, j) => j === i ? {
      ...r,
      familyMemberName: member.Full_Name     || '',
      itsId:            String(member.ITS_ID || ''),
      mobile:           String(member.Mobile || ''),
    } : r));
    setOpenSuggestIdx(null);
  };

  // ── Clear form ────────────────────────────────────────────────────────────────
  const clearForm = () => {
    setProfile(EMPTY_PROFILE);
    setFamilyMembers([]);
    setRcForm(EMPTY_RC_FORM);
    setRcItem(EMPTY_RC_ITEM);
    setRcItems([]);
    setSplitRows([]);
    setRemainingAmt(null);
    setEditingId(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    if (!String(profile.accno   ?? '').trim()) { toast.error('Acc No. is required');      return; }
    if (!String(profile.fullName?? '').trim()) { toast.error('Full Name is required');    return; }
    if (!rcForm.date)                          { toast.error('Received Date is required'); return; }
    if (!rcForm.mode)                          { toast.error('Mode is required');          return; }
    if (rcItems.length === 0)                  { toast.error('Add at least one item');     return; }
    if (!splitOk) {
      const dir = splitDiff > 0 ? `${fmt(splitDiff)} unallocated` : `${fmt(-splitDiff)} over-allocated`;
      alert(`Split amounts must equal Grand Total (${fmt(grandTotal)}). Currently ${dir}.`);
      return;
    }

    setSaving(true);
    try {
      const createdBy  = user?.username || user?.UserName || user?.name || '';
      const baseParams = {
        AccNo:            profile.accno,
        Mobile:           profile.mobile,
        ITSNo:            profile.itsNo,
        ReceivedDate:     rcForm.date,
        Mode:             rcForm.mode,
        Remark:           rcForm.remark,
        Createdby:        createdBy,
        ContributionType: rcForm.transType || 'VOLUNTARY CONTRIBUTION',
      };

      const envelopes = (needsSplit && splitRows.length > 0)
        ? distributeItems(rcItems, splitRows)
        : [{ familyMemberName: profile.fullName, amount: grandTotal, items: rcItems }];

      const savedEnvelopes = [];

      for (const env of envelopes) {
        const firstItem = env.items[0] || {};
        const subHead   = firstItem.hubSubHead || firstItem.hubType || '';
        const mainHead  = firstItem.hubMainHead || getMainHead(subHead);

        const txRes = await receiptService.addTransaction({
          ...baseParams,
          ReceivedFrom:   env.familyMemberName || profile.fullName,
          ITSNo:          env.itsId            || baseParams.ITSNo,
          Mobile:         env.mobile           || baseParams.Mobile,
          ReceivedAmount: env.amount,
          HubMainHead:    mainHead,
          HubSubHead:     subHead,
          IsCashMemo:     rcForm.isCashMemo ? 1 : 0,
        });

        const { insertId, receiptNo } = txRes.data;

        for (const item of env.items) {
          const itemSubHead = item.hubSubHead || item.hubType || subHead;
          await receiptService.addTransactionItem({
            AccNo:        profile.accno,
            newReceiptNo: receiptNo,
            HubMainHead:  item.hubMainHead || getMainHead(itemSubHead),
            HubSubHead:   itemSubHead,
            ForYear:      item.forYear || '',
            Grade:        item.grade   || profile.grade || '',
            Amount:       item.amount,
            Remark:       item.remark  || '',
            Status:       'Active',
            insertId,
          });
        }

        savedEnvelopes.push({
          receiptNo,
          familyMemberName: env.familyMemberName || profile.fullName,
          itsId:      env.itsId  || profile.itsNo,
          mobile:     env.mobile || profile.mobile,
          amount:     env.amount,
          items:      env.items,
          isCashMemo: !!rcForm.isCashMemo,
        });
      }

      toast.success(`${savedEnvelopes.length} receipt(s) saved: ${savedEnvelopes.map(e => e.receiptNo).join(', ')}`);
      await takhmeenService.updateTakhmeenReceived({ AccNo: profile.accno }).catch(() => {});

      // Show print preview modal
      setPrintData({
        receipts:         savedEnvelopes,
        profile:          { ...profile },
        date:             rcForm.date,
        mode:             rcForm.mode,
        refNo:            rcForm.remark || '',
        createdBy:        createdBy,
        contributionType: rcForm.transType || '',
      });
      setShowPrint(true);
      clearForm();
    } catch (err) {
      toast.error('Failed to save: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Receipt" subtitle="Record a new payment entry" />

      <div className="space-y-3">

        {/* ── 1. Mumin Profile ─────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span>Mumin Profile</span>
            {(profileLoading || familyLoading) && (
              <span className="text-[10px] text-blue-400 animate-pulse">
                {familyLoading ? 'Loading family…' : 'Loading…'}
              </span>
            )}
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="form-label">Acc No.</label>
                <input
                  className="form-input"
                  placeholder="Type to auto-fill…"
                  value={profile.accno || ''}
                  onChange={e => onAccNoChange(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={profile.fullName || ''}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Mobile</label>
                <input
                  className="form-input"
                  value={profile.mobile || ''}
                  onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">ITS No.</label>
                {familyMembers.length > 0 ? (
                  <select className="form-select" value={profile.itsNo || ''} onChange={e => onItsChange(e.target.value)}>
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
                    onChange={e => setProfile(p => ({ ...p, itsNo: e.target.value }))}
                  />
                )}
              </div>
              <div>
                <label className="form-label">Local HOF ITS No.</label>
                <input
                  className="form-input"
                  value={profile.localHofIts || ''}
                  onChange={e => setProfile(p => ({ ...p, localHofIts: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Sector</label>
                <input
                  className="form-input"
                  value={profile.sector || ''}
                  onChange={e => setProfile(p => ({ ...p, sector: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Transaction Info ───────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">Transaction Info</div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="form-label">Received Date</label>
                <input type="date" className="form-input" value={rcForm.date || ''} onChange={e => setRcForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Mode</label>
                <div className="flex items-center gap-2">
                  <select
                    className="form-select flex-1"
                    value={rcForm.mode || 'Cash'}
                    onChange={e => setRcForm(p => ({ ...p, mode: e.target.value, isCashMemo: false }))}
                  >
                    {['Cash', 'Online', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
                  </select>
                  {rcForm.mode === 'Cash' && (
                    <label className="flex items-center gap-1 cursor-pointer shrink-0" title="Cash Memo — bypasses cash limit">
                      <input
                        type="checkbox"
                        checked={isCashMemo}
                        onChange={e => setRcForm(p => ({ ...p, isCashMemo: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className={`text-[11px] font-medium ${isCashMemo ? 'text-blue-600' : 'text-gray-500'}`}>
                        Cash Memo
                      </span>
                    </label>
                  )}
                </div>
              </div>
              <div className="lg:col-span-2">
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
        </div>

        {/* ── 3. Add Item ───────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header relative flex items-center">
            <span>Add Item</span>
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
          <div className="card-body">
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
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                />
              </div>
              <div className="flex items-end">
                <button className="btn btn-secondary w-full" onClick={addItem}>+ Add</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Items Grid ─────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="card-header">Receipt Items</div>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[600px]">
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
                      <button className="text-[11px] px-1.5 py-0.5 bg-green-600 text-white rounded mr-1" onClick={saveEdit}>Save</button>
                      <button className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded" onClick={() => setEditingId(null)}>✕</button>
                    </td>
                    <td className="px-2 py-1.5 border-t border-border text-gray-400">{i + 1}</td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <select
                        className="form-select text-[11px]"
                        value={editBuf.hubSubHead || editBuf.hubType || ''}
                        onChange={e => {
                          const val   = e.target.value;
                          const found = hubHeads.find(h => h.HubSubHead === val);
                          setEditBuf(p => ({ ...p, hubSubHead: val, hubType: val, hubMainHead: found?.HubMainHead || p.hubMainHead || '' }));
                        }}
                      >
                        <option value="">— Select —</option>
                        {hubHeads.map(h => <option key={h.HubSubHead} value={h.HubSubHead}>{h.HubSubHead}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className="form-input text-[11px]" value={editBuf.forYear || ''} onChange={e => setEditBuf(p => ({ ...p, forYear: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className="form-input text-[11px] w-16" value={editBuf.grade || ''} onChange={e => setEditBuf(p => ({ ...p, grade: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input type="number" className="form-input text-[11px]" value={editBuf.amount || ''} onChange={e => setEditBuf(p => ({ ...p, amount: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className="form-input text-[11px]" value={editBuf.remark || ''} onChange={e => setEditBuf(p => ({ ...p, remark: e.target.value }))} />
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

        {/* ── 5. Family split receipts (Cash > limit) ───────────────────────── */}
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
            <div className="rounded-lg overflow-hidden border border-amber-200">
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
                        <td className="px-3 py-2 border-t border-amber-200 text-center text-gray-500 font-medium">{i + 1}</td>
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
                    <td colSpan={2} className="px-3 py-2 text-center text-[11px] text-gray-500">Split Total</td>
                    <td className={`px-3 py-2 text-center font-bold text-[12px] ${splitOk ? 'text-green-700' : 'text-red-600'}`}>
                      {fmt(splitTotal)} / {fmt(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. SMS ────────────────────────────────────────────────────────── */}
        <label className="flex items-center gap-2 text-[11.5px] text-gray-700 cursor-pointer p-2.5 bg-surface rounded-md border border-border">
          <input
            type="checkbox"
            className="accent-blue-500 w-3.5 h-3.5"
            checked={rcForm.sendSMS || false}
            onChange={e => setRcForm(p => ({ ...p, sendSMS: e.target.checked }))}
          />
          Send SMS confirmation to {profile.mobile || 'member'}
        </label>

        {/* ── 7. Action buttons ─────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-1 flex-wrap">
          <button className="btn btn-secondary" onClick={clearForm}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Receipt</>}
          </button>
        </div>

      </div>

      {/* Receipt print preview modal */}
      <ReceiptPrintModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        printData={printData}
      />
    </div>
  );
}
