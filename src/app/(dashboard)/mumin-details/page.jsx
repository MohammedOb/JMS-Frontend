'use client';

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  memberService, takhmeenService, receiptService,
  safaiService, vajebaatService, followupService,
  whatsappService, lookupService,
} from '@/services';
import toast  from 'react-hot-toast';
import clsx   from 'clsx';

import {
  today, toInputDate,
  normalizeArray, normalizeReceiptRow, normalizeTakRow, normalizeSfRow, normalizeMemberPayload,
  SUB_HEADS,
} from './utils';

// ── Receipt save helpers ──────────────────────────────────────────────────────
function getMainHead(subHead) {
  for (const [main, subs] of Object.entries(SUB_HEADS)) {
    if (subs.includes(subHead)) return main;
  }
  return 'Other';
}

// Distribute items greedily across split receipts so each receipt's items sum = receipt amount
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
        receiptItems.push({ ...head, amount: Number(budget.toFixed(2)) });
        head.amount = Number((head.amount - budget).toFixed(2));
        budget = 0;
      }
    }
    return { ...row, items: receiptItems };
  });
}

// Layout components
import MuminSearchBar   from './components/MuminSearchBar';
import MuminProfileCard from './components/MuminProfileCard';
import FmbDetailsCard        from './components/FmbDetailsCard';
import PrintConfigButton     from '@/components/shared/PrintConfigButton';
import { buildViewUrl }      from '@/lib/urlToken';
import { PrintIcon }         from '@/components/shared/Icons';
import VajebaatInfoCard from './components/VajebaatInfoCard';
import DueSummaryCards  from './components/DueSummaryCards';
import AlertBanners     from './components/AlertBanners';
// import ActionBar        from './components/ActionBar';

// Tab components
import TakhmeenTab     from './components/tabs/TakhmeenTab';
import ReceiptsTab     from './components/tabs/ReceiptsTab';
import FamilyTab       from './components/tabs/FamilyTab';
import SafaiChitthiTab from './components/tabs/SafaiChitthiTab';
import VajebaatTab     from './components/tabs/VajebaatTab';
import FollowupTab     from './components/tabs/FollowupTab';

// Modal components
import TakhmeenModal       from './components/modals/AddTakhmeenModal';
import EditTakhmeenModal   from './components/modals/EditTakhmeenModal';
import AddReceiptModal     from './components/modals/AddReceiptModal';
import EditReceiptModal    from './components/modals/EditReceiptModal';
import PrintReceiptModal   from './components/modals/PrintReceiptModal';
import ReceiptPrintModal   from '@/components/shared/ReceiptPrintModal';
import ResetPasswordModal  from './components/modals/ResetPasswordModal';
import AddFollowupModal    from './components/modals/AddFollowupModal';

import OverallDueModal        from './components/modals/OverallDueModal';
import SendDueReminderModal  from './components/modals/SendDueReminderModal';
import TakhmeenPreviewModal from './components/modals/TakhmeenPreviewModal';
import EditMemberModal     from './components/modals/EditMemberModal';
import AddNewMemberModal   from './components/modals/AddNewMemberModal';
import EditFmbModal        from './components/modals/EditFmbModal';
import EditVajInfoModal        from './components/modals/EditVajInfoModal';
import FmbTakhmeenPrintModal  from './components/modals/FmbTakhmeenPrintModal';


// ═══════════════════════════════════════════════════════════════════════════
function MuminDetailsInner() {
  const params          = useSearchParams();
  const router          = useRouter();
  const { can, user } = useAuth();

  // ── Feature flags — derived from DB permissions ───────────────────────────
  // ⚠ MDHideAllButtons is a restriction flag — super_admin must NOT bypass it.
  const hideButtons = Array.isArray(user?.permissions) && user.permissions.includes('members.hide_actions');
  const FEATURES = {
    // Left panel cards
    fmbCard:          true,
    editFMB:          !hideButtons && can('members.edit_fmb'),
    printFMB:         !hideButtons && can('members.print_fmb'),
    vajebaatInfoCard: !hideButtons && can('members.view_vajebaat_details'),

    // Profile card actions
    editProfile:      !hideButtons && (can('members.edit') || can('members.add')),
    resetPassword:    !hideButtons && (can('members.reset_password') || can('users.view')),

    // Due summary + alert banners always shown
    dueSummary:       true,
    overallDue:       !hideButtons && can('members.print_overalldue'),
    alertBanners:     true,

    // Action bar buttons
    addReceipt:       !hideButtons && (can('members.add') || can('receipts.create')),
    addTakhmeen:      !hideButtons && (can('members.add') || can('receipts.create')),
    vajebaatEntry:    !hideButtons && can('members.quick_entry'),
    sabeelDue:        !hideButtons,
    addSafai:         !hideButtons,
    followup:         !hideButtons,
    takhmeenPreview:  false, // behind development flag for now

    // Tabs
    takhmeenTab:      true,
    receiptsTab:      true,
    familyTab:        true,
    safaiTab:         can('members.view.safaichitthi_tab'),
    vajebaatTab:      can('members.view_vajebaat_tab'),
    followupTab:      can('followup.view'),

    // New member button in search bar
    newMember:        !hideButtons && (can('members.add') || can('receipts.create')),
  };

  const TAB_LIST = [
    FEATURES.takhmeenTab && { key: 'takhmeen', label: 'Takhmeen' },
    FEATURES.receiptsTab && { key: 'receipts', label: 'Receipt History' },
    FEATURES.familyTab   && { key: 'family',   label: 'Family Details' },
    FEATURES.safaiTab    && { key: 'safai',     label: 'Safai Chitthi' },
    FEATURES.vajebaatTab && { key: 'vajebaat',  label: 'Vajebaat' },
    FEATURES.followupTab && { key: 'followup',  label: 'Follow Up' },
  ].filter(Boolean);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchVal,       setSearchVal]       = useState(params.get('accno') || '');
  const [searching,       setSearching]       = useState(false);
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading,  setSuggestLoading]  = useState(false);
  const [dropdownStyle,   setDropdownStyle]   = useState({});
  const searchInputRef   = useRef(null);
  const suggestTimer     = useRef(null);
  const initialLoadDone  = useRef(false);
  const familyPrefetched = useRef(null); // tracks hofIts for which family was pre-loaded

  // ── Member data ───────────────────────────────────────────────────────────
  const [member,     setMember]     = useState(null);
  const memberRef = useRef(null); // stable ref so loadFamilyMembers doesn't recreate on every render
  const [takhmeen,   setTakhmeen]   = useState([]);
  const [receipts,   setReceipts]   = useState([]);
  const [family,     setFamily]     = useState([]);
  const [safaiList,  setSafaiList]  = useState([]);
  const [safaiCount, setSafaiCount] = useState(0);
  const [vajebaat,   setVajebaat]   = useState([]);
  const [himList,    setHimList]    = useState([]);
  const [sniyazList, setSniyazList] = useState([]);
  const [silaFitra,  setSilaFitra]  = useState([]);
  const [due,           setDue]           = useState(null);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [followupList,  setFollowupList]  = useState([]);
  const [followupLoading, setFollowupLoading] = useState(false);

  // ── Tab & modals ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState(params.get('tab') || TAB_LIST[0]?.key || '');

  const [modals, setModals] = useState({
    addTakhmeen: false, editTakhmeen: false,
    addReceipt:  false, editReceipt:  false, printReceipt: false,
    editMember:  false, newMember:    false,
    editFMB:     false, editVaj:      false,
    addSafai:    false, editSafai:    false, printSafai: false,
    vajebaatSpeed: false,
    himTakhmeen: false, fmbTakhmeen: false, sniyazTakhmeen: false,
    resetPass:   false, addFollowup:  false,
    sabeelDue:   false, overallDue:   false,
    takPreview:  false, fmbPrint:     false,
    dueReminder: false,
  });
  const openModal  = (k) => setModals(p => ({ ...p, [k]: true }));
  const closeModal = (k) => setModals(p => ({ ...p, [k]: false }));

  const [dueReminderData, setDueReminderData] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  function openReceiptPrint(row) {
    if (!row) return;
    // Find all raw detail rows for this receipt (summary row collapses multi-items into one)
    const receiptKey = String(row.ID || row.id || row.receiptNo);
    const rawRows = receipts.filter(r => String(r.ID || r.id || r.receiptNo) === receiptKey);
    const items = rawRows.length > 0
      ? rawRows.map(r => ({ hubSubHead: r.subHead || r.hubSubHead || '', hubType: r.mainHead || '', forYear: r.forYear || '', amount: Number(r.amount) || 0 }))
      : [{ hubSubHead: row.subHead || '', forYear: row.forYear || '', amount: Number(row.amount) || 0 }];
    const totalAmount = items.reduce((s, it) => s + it.amount, 0);
    setPrintData({
      receipts:         [{ receiptNo: row.receiptNo, familyMemberName: row.fullName || row.ReceivedFrom || member?.name || '', amount: totalAmount, items, status: row.status || row.Status || '', isCashMemo: !!(row.IsCashMemo || row.isCashMemo) || (row.mode || row.Mode) === 'Cash Memo' }],
      profile:          { accno: member?.accno, fullName: member?.name, mobile: member?.mobile, itsNo: member?.itsNo, sector: member?.sector, address: member?.address || '' },
      date:             row.receivedDate || row.date || '',
      mode:             row.mode || row.Mode || '',
      refNo:            row.transactionRefNo || row.TransactionRefNo || '',
      remark:           row.remark || row.Remark || '',
      createdBy:        row.createdBy || row.Createdby || '',
      contributionType: row.ContributionType || row.contributionType || '',
    });
    setShowPrint(true);
  }

  // ── Takhmeen filters ──────────────────────────────────────────────────────
  const [takYear,     setTakYear]     = useState('');
  const [takMainHead, setTakMainHead] = useState('');
  const [takSubHead,  setTakSubHead]  = useState('');

  // ── Form state ────────────────────────────────────────────────────────────
  const [takForm, setTakForm] = useState({
    mainHead: '', subHead: '', forYear: '', grade: '',
    takhmeen: 0, received: 0, date: today(), remark: '',
    lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '',
  });
  const [editTakRow,   setEditTakRow]   = useState(null);
  const [editReceiptRow, setEditReceiptRow] = useState(null);
  const [rcItems,      setRcItems]      = useState([]);
  const [rcForm,       setRcForm]       = useState({ date: today(), mode: 'Cash', transType: 'VOLUNTARY CONTRIBUTION', transactionRefNo: '', remark: '', sendSMS: false });
  const [rcItem,       setRcItem]       = useState({ hubSubHead: '', hubMainHead: '', fundType: '', hubType: '', forYear: '', amount: '', remark: '' });
  const [safaiForm,    setSafaiForm]    = useState({ issueDate: today(), validTill: '', reason: '', remark: '' });
  const [vajForm,      setVajForm]      = useState({ sf: '', vaj: '', house: '', niyaz: '', other: '' });
  const [himForm,      setHimForm]      = useState({ forYear: '', override: '' });
  const [sniyazForm,   setSniyazForm]   = useState({ forYear: '', count: '', tareekh: '', status: 'Done', amount: '' });
  const [memberForm,   setMemberForm]   = useState({});
  const [newMemberForm, setNewMemberForm] = useState({
    AccNo: '', FullName: '', Sector: '', Mobile: '', Mobile1: '',
    ITSNo: '', LocalHOFITSNo: '', HOFName: '', Subsector: '', SubsectorName: '',
    StayingIn: '', WorkStatus: '', SabeelRemark: '', Address: '',
  });
  const setNF = (k, v) => setNewMemberForm(p => ({ ...p, [k]: v }));

  const [fmbForm, setFmbForm] = useState({
    ThaaliStatus: '', ThaaliSize: '', DistributorName: '', DistributorID: '',
    ThaliCloseYear: '', ThaliCloseDate: '', TempFromDate: '', TempToDate: '',
    Reason: '', FMBRemark: '',
  });
  const setFF = (k, v) => setFmbForm(p => ({ ...p, [k]: v }));

  const [vajInfoForm, setVajInfoForm] = useState({
    LocalTokenNo: '', LocalTokenDate: '', FavorName: '', FavorITS: '',
    Mouze: '', VajebaatRemark: '', VajProfileUnlock: false,
  });
  const setVF = (k, v) => setVajInfoForm(p => ({ ...p, [k]: v }));

  const [followupForm, setFollowupForm] = useState({ date: today(), note: '', action: 'Call Again' });
  const [mohallaList,       setMohallaList]       = useState([]);
  const [lookupCities,      setLookupCities]      = useState([]);
  const [lookupWorkStatuses, setLookupWorkStatuses] = useState([]);
  const [lookupDistributors, setLookupDistributors] = useState([]);

  // ── ComboBox option arrays ────────────────────────────────────────────────
  const sectorOptions = useMemo(
    () => [...new Set(mohallaList.map(m => m.Sector ?? m.sector ?? '').filter(Boolean))].sort(),
    [mohallaList]
  );
  const cityOptions = lookupCities;
  const subsectorOpts = (currentSector) =>
    mohallaList
      .filter(m => !currentSector || String(m.Sector ?? m.sector ?? '') === currentSector)
      .map(m => ({
        value:         String(m.Subsector ?? m.subsector ?? ''),
        label:         `${m.Subsector ?? m.subsector ?? ''} — ${m.MohallaDescription ?? m.SubsectorName ?? m.subsectorName ?? ''}`,
        sector:        String(m.Sector ?? m.sector ?? ''),
        subsectorName: String(m.MohallaDescription ?? m.SubsectorName ?? m.subsectorName ?? ''),
      }));

  // ── Search suggestion helpers ─────────────────────────────────────────────
  const updateDropdownPos = () => {
    if (!searchInputRef.current) return;
    const r = searchInputRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const query = String(searchVal ?? '').trim();
    if (!query || query.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      updateDropdownPos();
      setSuggestLoading(true);
      setShowSuggestions(true);
      try {
        const res  = await memberService.loadMuminDetails({ Search: query });
        const data = res.data;
        let list = [];
        if (Array.isArray(data))            list = data;
        else if (data?.recordset)           list = data.recordset;
        else if (data?.recordsets)          list = data.recordsets[0] || [];
        else if (Array.isArray(data?.data)) list = data.data;
        setSuggestions(list.map(m => ({
          accno: m.AccNo    || m.accno    || '',
          name:  m.FullName || m.fullName || '',
          itsNo: m.ITSNo    || m.itsNo    || '',
        })));
      } catch { setSuggestions([]); }
      finally { setSuggestLoading(false); }
    }, 350);
    return () => clearTimeout(suggestTimer.current);
  }, [searchVal]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadMember = useCallback(async (accno) => {
    if (!accno) return;
    setSearching(true);
    try {
      const memberRes  = await memberService.loadMuminDetails({ Search: accno });
      const payload    = memberRes.data ?? {};
      const normalized = normalizeMemberPayload(payload);
      const memberData = normalized.member;
      if (!memberData || !memberData.accno) throw new Error('Member not found');

      // Use the real AccNo from the member record — callers may pass an ITS number
      const realAccno = memberData.accno;

      // Fire all three dependent calls in parallel — each only needs realAccno/hofIts
      // which are already known, so no need to await them sequentially.
      const [hofRes, takRes, rRes] = await Promise.all([
        memberData.hofIts
          ? memberService.loadFamilyMembersDetails({ HOF_ID: memberData.hofIts }).catch(() => null)
          : Promise.resolve(null),
        takhmeenService.loadDetails({ AccNo: realAccno }).catch((err) => { console.error('LoadTakhmeenDetails failed', err); return null; }),
        receiptService.loadTransactionDetails({ AccNo: realAccno }).catch((err) => { console.error('LoadTransactionDetails failed', err); return null; }),
      ]);

      // Extract HOF name and family list from the parallel family fetch
      let prefetchedFamily = normalized.family;
      if (hofRes) {
        const hofList = Array.isArray(hofRes.data) ? hofRes.data
          : Array.isArray(hofRes.data?.recordset) ? hofRes.data.recordset
          : Array.isArray(hofRes.data?.recordsets?.[0]) ? hofRes.data.recordsets[0]
          : Array.isArray(hofRes.data?.data) ? hofRes.data.data : [];
        const hofMember = hofList.find(m => String(m.ITS_ID) === String(memberData.hofIts));
        if (hofMember?.Full_Name) memberData.hofName = hofMember.Full_Name;
        if (hofList.length > 0) {
          prefetchedFamily = hofList;
          familyPrefetched.current = String(memberData.hofIts);
        }
      }

      const takhmeen = takRes ? normalizeArray(takRes.data).map(normalizeTakRow) : [];
      const receipts = rRes ? normalizeArray(rRes.data).map(normalizeReceiptRow) : [];

      setMember(memberData);
      setTakhmeen(takhmeen);
      setReceipts(receipts);
      setFamily(prefetchedFamily);
      setSafaiList(normalized.safai);
      setMemberForm(memberData);
      router.replace(`/mumin-details?accno=${realAccno}`, { scroll: false });
      takhmeenService.updateTakhmeenReceived({ AccNo: realAccno }).catch(() => {});
    } catch (err) {
      console.error('loadMember failed', err);
      toast.error('Member not found');
      setMember(null);
    } finally {
      setSearching(false);
    }
  }, [router]);

  const loadVajebaat = useCallback(async () => {
    if (!member) return;
    try {
      const takRes = await takhmeenService.loadDetails({ AccNo: member.accno });
      const all = normalizeArray(takRes.data).map(normalizeTakRow);
      setVajebaat(all.filter(r => r.subHead === 'Vajebaat'));
      setHimList(all.filter(r => r.subHead === 'HIM'));
      setSniyazList(all.filter(r => r.subHead === 'Shehrullah Niyaz'));
    } catch (err) {
      console.error('loadVajebaat: LoadTakhmeenDetails failed', err);
    }
    try {
      const sfRes = await vajebaatService.loadSilaFitra({ AccNo: member.accno });
      setSilaFitra(normalizeArray(sfRes.data).map(normalizeSfRow));
    } catch (err) {
      console.error('loadVajebaat: LoadSilaFitraDetails failed', err);
    }
  }, [member]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const a = params.get('accno');
    if (a) loadMember(a);
    const toArray = (r) =>
      Array.isArray(r?.data?.data) ? r.data.data
      : Array.isArray(r?.data)     ? r.data
      : (r?.data?.recordset ?? r?.data?.recordsets?.[0] ?? []);

    memberService.loadMohallaDetails({ Sector: '', Subsector: '', MohallaDescription: '' })
      .then(res => setMohallaList(toArray(res)))
      .catch(err => console.error('LoadMohallaDetails failed:', err?.response?.data ?? err.message));

    memberService.loadMuminDetails({ Search: '' })
      .then(res => {
        const rows = toArray(res);
        setLookupCities([...new Set(rows.map(m => m.StayingIn ?? m.stayingIn ?? '').filter(Boolean))].sort());
        setLookupWorkStatuses([...new Set(rows.map(m => m.WorkStatus ?? m.workStatus ?? '').filter(Boolean))].sort());
      })
      .catch(err => console.error('LoadMuminDetails (cities) failed:', err?.response?.data ?? err.message));

    lookupService.getDistributors()
      .then(res => {
        const data = res?.data?.data ?? res?.data ?? [];
        setLookupDistributors(data);
      })
      .catch(err => console.error('getDistributors failed:', err?.response?.data ?? err.message));
  }, []); // eslint-disable-line

  // Keep the ref in sync on every render so loadFamilyMembers can read latest member
  // without being recreated every time member changes (which caused the extra API call).
  memberRef.current = member;

  const loadFamilyMembers = useCallback(async (force = false) => {
    const m = memberRef.current;
    if (!m?.hofIts) return;
    // Skip if loadMember already pre-fetched family for this same hofIts
    if (!force && familyPrefetched.current === String(m.hofIts)) return;
    setFamilyLoading(true);
    try {
      const res = await memberService.loadFamilyMembersDetails({ HOF_ID: m.hofIts });
      setFamily(normalizeArray(res.data));
    } catch (err) {
      console.error('loadFamilyMembers failed', err);
      setFamily([]);
    } finally {
      setFamilyLoading(false);
    }
  }, []); // stable — never recreated, reads member via ref

  useEffect(() => {
    if (tab === 'family' && memberRef.current) loadFamilyMembers();
  }, [tab, loadFamilyMembers]); // loadFamilyMembers is stable so this only fires when tab changes

  useEffect(() => {
    if (tab === 'vajebaat' && member) loadVajebaat();
  }, [tab, member, loadVajebaat]);

  useEffect(() => {
    if (tab === 'followup' && member) loadFollowups(member.accno);
  }, [tab, member]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Takhmeen handlers ─────────────────────────────────────────────────────
  const reloadTakhmeen = async () => {
    try {
      const res = await takhmeenService.loadDetails({ AccNo: member.accno });
      setTakhmeen(normalizeArray(res.data).map(normalizeTakRow));
    } catch (err) {
      console.error('reloadTakhmeen: LoadTakhmeenDetails failed', err);
    }
  };

  const saveTakhmeen = async () => {
    if (!takForm.mainHead || !takForm.subHead || !takForm.forYear || takForm.takhmeen === '' || takForm.takhmeen == null || !takForm.date) return;
    try {
      await takhmeenService.addDetails({
        AccNo:           member.accno,
        ForYear:         takForm.forYear,
        HubMainHead:     takForm.mainHead,
        HubSubHead:      takForm.subHead,
        Grade:           takForm.grade,
        Takhmeen:        Number(takForm.takhmeen) || 0,
        Received:        Number(takForm.received) || 0,
        TakhmeenDate:    takForm.date,
        Remark:          takForm.remark,
        ...(takForm.mainHead === 'Vajebaat' && {
          LastTakhmeen:    Number(takForm.lastTakhmeen) || 0,
          CurrentTakhmeen: Number(takForm.currentTakhmeen) || 0,
          Paidin:          takForm.paidin,
          Place:           takForm.place,
        }),
      });
      toast.success('Takhmeen saved');
      closeModal('addTakhmeen');
      await reloadTakhmeen();
      if (takForm.mainHead === 'Vajebaat') await loadVajebaat();
    } catch { toast.error('Failed to save'); }
  };

  const updateTakhmeen = async () => {
    if (!editTakRow) return;
    if (!editTakRow.updateReason?.trim()) {
      toast.error('Please enter a reason for this update');
      return;
    }
    try {
      const recordUpdateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedBy        = user?.username || user?.UserName || user?.name || 'Unknown';
      const fullReason       = `${editTakRow.updateReason.trim()} - Updated by: ${updatedBy}`;

      await takhmeenService.updateDetails({
        ID:                 editTakRow.id,
        AccNo:              member.accno,
        ForYear:            editTakRow.forYear,
        HubMainHead:        editTakRow.mainHead,
        HubSubHead:         editTakRow.subHead,
        Grade:              editTakRow.grade,
        Takhmeen:           Number(editTakRow.takhmeen) || 0,
        Received:           Number(editTakRow.received) || 0,
        TakhmeenDate:       editTakRow.date,
        Remark:             editTakRow.remark,
        RecordUpdateReason: fullReason,
        RecordUpdateDate:   recordUpdateDate,
        ...(editTakRow.mainHead === 'Vajebaat' && {
          LastTakhmeen:    Number(editTakRow.lastTakhmeen) || 0,
          CurrentTakhmeen: Number(editTakRow.currentTakhmeen) || 0,
          Paidin:          editTakRow.paidin,
          Place:           editTakRow.place,
        }),
      });
      toast.success('Updated');
      closeModal('editTakhmeen');
      await reloadTakhmeen();
      if (editTakRow.mainHead === 'Vajebaat') await loadVajebaat();
    } catch { toast.error('Failed to update'); }
  };

  const deleteTakhmeen = async (id) => {
    if (!confirm('Delete this takhmeen record?')) return;
    try {
      await takhmeenService.deleteDetails({ ID: id });
      toast.success('Deleted');
      await Promise.all([reloadTakhmeen(), loadVajebaat()]);
    } catch { toast.error('Failed to delete'); }
  };

  // ── Sila Fitra handlers ───────────────────────────────────────────────────
  const saveSilaFitraRecord = async (row) => {
    try {
      await vajebaatService.addSilaFitra({
        AccNo:   member.accno,
        ForYear: row.forYear,
        SF:      Number(row.sfRate)    || 0,
        M:       Number(row.mardo)     || 0,
        B:       Number(row.baira)     || 0,
        GB:      Number(row.gairBalig) || 0,
        H:       Number(row.hamal)     || 0,
        AM:      Number(row.amwaat)    || 0,
      });
      toast.success('Sila Fitra saved');
      await loadVajebaat();
    } catch { toast.error('Failed to save Sila Fitra'); }
  };

  const updateSilaFitraRecord = async (row) => {
    try {
      await vajebaatService.updateSilaFitra({
        ID:      row.id,
        ForYear: row.forYear,
        SF:      Number(row.sfRate)    || 0,
        M:       Number(row.mardo)     || 0,
        B:       Number(row.baira)     || 0,
        GB:      Number(row.gairBalig) || 0,
        H:       Number(row.hamal)     || 0,
        AM:      Number(row.amwaat)    || 0,
      });
      toast.success('Sila Fitra updated');
      await loadVajebaat();
    } catch { toast.error('Failed to update Sila Fitra'); }
  };

  const deleteSilaFitraRecord = async (id) => {
    if (!confirm('Delete this Sila Fitra record?')) return;
    try {
      await vajebaatService.deleteSilaFitra({ ID: id });
      toast.success('Deleted');
      await loadVajebaat();
    } catch { toast.error('Failed to delete'); }
  };

  // ── Receipt handlers ──────────────────────────────────────────────────────
  const saveReceipt = async ({ profile, rcForm, rcItems, splitRows, printOnly }) => {
    if (rcItems.length === 0) { toast.error('Add at least one item'); return; }

    const grandTotal  = rcItems.reduce((s, i) => s + Number(i.amount), 0);
    const createdBy   = user?.username || user?.UserName || user?.name || '';
    const baseParams  = {
      AccNo:            profile.accno,
      Mobile:           profile.mobile,
      ITSNo:            profile.itsNo,
      ReceivedDate:     rcForm.date,
      Mode:             rcForm.mode,
      TransactionRefNo: rcForm.transactionRefNo || '',
      Remark:           rcForm.remark,
      Createdby:        createdBy,
      ContributionType: rcForm.transType || 'VOLUNTARY CONTRIBUTION',
    };

    // Build list of receipt envelopes: [{familyMemberName, amount, items[]}]
    const envelopes = splitRows.length > 0
      ? distributeItems(rcItems, splitRows)
      : [{ familyMemberName: profile.fullName, amount: grandTotal, items: rcItems }];

    try {
      const savedNos = [];

      for (const env of envelopes) {
        const firstItem  = env.items[0] || {};
        const subHead    = firstItem.hubSubHead || firstItem.hubType || '';
        const mainHead   = firstItem.hubMainHead || getMainHead(subHead);

        // 1️⃣ Create transaction header → get receiptNo + insertId (TransID)
        const txRes = await receiptService.addTransaction({
          ...baseParams,
          ReceivedFrom:   env.familyMemberName || profile.fullName,
          ITSNo:          env.itsId            || baseParams.ITSNo,
          Mobile:         env.mobile           || baseParams.Mobile,
          ReceivedAmount: env.amount,
          HubMainHead:    mainHead,
          HubSubHead:     subHead,
          IsCashMemo:     rcForm.mode === 'Cash Memo' ? 1 : 0,
        });

        const { insertId, receiptNo } = txRes.data;

        // 2️⃣ Create one item row per item in this envelope
        for (const item of env.items) {
          const itemSubHead  = item.hubSubHead || item.hubType || subHead;
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

        savedNos.push(receiptNo);
      }

      toast.success(`${savedNos.length} receipt(s) saved: ${savedNos.join(', ')}`);
      closeModal('addReceipt');
      setRcItems([]);

      // Show print modal for the saved receipts
      const savedEnvelopes = envelopes.map((env, i) => ({
        receiptNo:         savedNos[i] || '',
        familyMemberName:  env.familyMemberName || profile.fullName || '',
        amount:            env.amount,
        items:             env.items.map(it => ({ hubSubHead: it.hubSubHead || it.hubType || '', forYear: it.forYear || '', amount: Number(it.amount) || 0 })),
        isCashMemo:        rcForm.mode === 'Cash Memo',
      }));
      setPrintData({
        receipts:         savedEnvelopes,
        profile:          { accno: profile.accno, fullName: profile.fullName, mobile: profile.mobile, itsNo: profile.itsNo, sector: profile.sector, address: member?.address || '' },
        date:             rcForm.date,
        mode:             rcForm.mode,
        refNo:            rcForm.transactionRefNo || '',
        remark:           rcForm.remark || '',
        createdBy:        createdBy,
        contributionType: rcForm.transType || '',
      });
      setShowPrint(true);

      // Send WhatsApp acknowledgment + PDF
      if (rcForm.sendWhatsApp) {
        const waMobile = (rcForm.whatsAppMobile || '').trim() || profile.mobile;
        if (waMobile) {
          toast.loading('Sending WhatsApp…', { id: 'wa-send' });
          const builtPrintData = {
            receipts:         savedEnvelopes,
            profile:          { accno: profile.accno, fullName: profile.fullName, mobile: profile.mobile, itsNo: profile.itsNo, sector: profile.sector, address: member?.address || '' },
            date:             rcForm.date,
            mode:             rcForm.mode,
            refNo:            rcForm.transactionRefNo || '',
            remark:           rcForm.remark || '',
            createdBy:        createdBy,
            contributionType: rcForm.transType || '',
          };
          whatsappService.sendReceipt({ mobile: waMobile, printData: builtPrintData })
            .then(res => {
              toast.dismiss('wa-send');
              const data = res.data;
              if (data?.success) {
                toast.success('WhatsApp sent successfully');
              } else {
                toast.error(data?.message || 'WhatsApp message could not be delivered.');
              }
            })
            .catch(err => {
              toast.dismiss('wa-send');
              const serverMsg = err?.response?.data?.message;
              toast.error(serverMsg || 'Unable to send WhatsApp. Please check the mobile number and try again.');
            });
        } else {
          toast.error('No mobile number to send WhatsApp');
        }
      }

      // Update takhmeen received totals for this member
      await takhmeenService.updateTakhmeenReceived({ AccNo: profile.accno }).catch(() => {});

      receiptService.loadTransactionDetails({ AccNo: member.accno })
        .then(res => setReceipts(normalizeArray(res.data).map(normalizeReceiptRow)))
        .catch(() => {});
    } catch (err) {
      toast.error('Failed to save: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  // ── Safai handler ─────────────────────────────────────────────────────────
  const saveSafai = async () => {
    try {
      await safaiService.create({ accno: member.accno, ...safaiForm });
      toast.success('Safai Chitthi issued');
      closeModal('addSafai');
      const res = await safaiService.getByAccno(member.accno);
      setSafaiList(res.data);
    } catch { toast.error('Failed to issue'); }
  };

  // ── Vajebaat handler ──────────────────────────────────────────────────────
  const saveVajebaat = async () => {
    const entries = [
      { key: 'sf',    subHead: 'Sila Fitra' },
      { key: 'vaj',   subHead: 'Vajebaat' },
      { key: 'house', subHead: 'House Vajebaat' },
      { key: 'niyaz', subHead: 'Shehrullah Niyaz' },
      { key: 'other', subHead: 'Other' },
    ].filter(({ key }) => Number(vajForm[key]) > 0);

    if (entries.length === 0) { toast.error('Enter at least one takhmeen value'); return; }

    try {
      await Promise.all(entries.map(({ key, subHead }) =>
        takhmeenService.addDetails({
          AccNo:        member.accno,
          ForYear:      user.ForYearAll,
          HubMainHead:  'Vajebaat',
          HubSubHead:   subHead,
          Takhmeen:     Number(vajForm[key]) || 0,
          Received:     0,
          TakhmeenDate: today(),
        })
      ));
      toast.success('Vajebaat takhmeen saved');
      await Promise.all([reloadTakhmeen(), loadVajebaat()]);
      setVajForm({ sf: '', vaj: '', house: '', niyaz: '', other: '' });
      openModal('addReceipt');
    } catch { toast.error('Failed to save'); }
  };

  // ── Member handlers ───────────────────────────────────────────────────────
  const resetPassword = async () => {
    try {
      await memberService.resetPassword(member.accno);
      toast.success('Password reset to ITS/Acc No.');
      closeModal('resetPass');
    } catch { toast.error('Failed to reset'); }
  };

  const loadFollowups = async (accno) => {
    setFollowupLoading(true);
    try {
      const res = await followupService.getByAccno(accno);
      setFollowupList(res.data?.data ?? res.data ?? []);
    } catch { /* silently ignore */ }
    finally { setFollowupLoading(false); }
  };

  const saveFollowup = async () => {
    try {
      await followupService.create({ accno: member.accno, ...followupForm });
      toast.success('Follow-up saved');
      closeModal('addFollowup');
      loadFollowups(member.accno);
    } catch { toast.error('Failed to save'); }
  };

  const saveFMB = async () => {
    try {
      const f = fmbForm;
      await memberService.updateMuminDetailsFMB({
        AccNo: member.accno,
        ThaaliStatus:    f.ThaaliStatus    || undefined,
        ThaaliSize:      f.ThaaliSize      || undefined,
        DistributorName: f.DistributorName || undefined,
        DistributorID:   f.DistributorID   || undefined,
        ThaliCloseYear:  f.ThaliCloseYear  || undefined,
        ThaliCloseDate:  f.ThaliCloseDate  || undefined,
        TempFromDate:    f.TempFromDate    || undefined,
        TempToDate:      f.TempToDate      || undefined,
        Reason:          f.Reason          || undefined,
        FMBRemark:       f.FMBRemark       || undefined,
      });
      toast.success('FMB details updated');
      closeModal('editFMB');
      await loadMember(member.accno);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update FMB details');
    }
  };

  const saveVajInfo = async () => {
    try {
      const f = vajInfoForm;
      await memberService.updateMuminDetailsVaj({
        AccNo:            member.accno,
        LocalTokenNo:     f.LocalTokenNo    || undefined,
        LocalTokenDate:   f.LocalTokenDate  || undefined,
        FavorName:        f.FavorName       || undefined,
        FavorITS:         f.FavorITS        || undefined,
        Mouze:            f.Mouze           || undefined,
        VajebaatRemark:   f.VajebaatRemark  || undefined,
        VajProfileUnlock: f.VajProfileUnlock,
      });
      toast.success('Vajebaat info updated');
      closeModal('editVaj');
      await loadMember(member.accno);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Vajebaat info');
    }
  };

  const saveNewMember = async () => {
    const f = newMemberForm;
    if (!f.AccNo?.trim())    { toast.error('Account No. is required'); return; }
    if (!f.FullName?.trim()) { toast.error('Full Name is required');   return; }
    try {
      await memberService.addMuminDetails({
        AccNo: f.AccNo.trim(), FullName: f.FullName.trim(),
        Sector: f.Sector || 'N/A', Mobile: f.Mobile || '0',
        Mobile1: f.Mobile1 || undefined, ITSNo: f.ITSNo || '0',
        LocalHOFITSNo: f.LocalHOFITSNo || undefined,
        Subsector: f.Subsector || 'N/A', SubsectorName: f.SubsectorName || undefined,
        StayingIn: f.StayingIn || 'N/A', WorkStatus: f.WorkStatus || undefined,
        SabeelRemark: f.SabeelRemark || undefined,
        Address: f.Address || undefined,
      });
      toast.success(`Member ${f.AccNo} added successfully`);
      closeModal('newMember');
      setNewMemberForm({ AccNo: '', FullName: '', Sector: '', Mobile: '', Mobile1: '', ITSNo: '', LocalHOFITSNo: '', HOFName: '', Subsector: '', SubsectorName: '', StayingIn: '', WorkStatus: '', SabeelRemark: '', Address: '' });
      setSearchVal(f.AccNo);
      await loadMember(f.AccNo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const updateMember = async () => {
    try {
      const f = memberForm;

      const basicPayload = { AccNo: member.accno };
      if (f.name          !== undefined) basicPayload.FullName       = f.name;
      if (f.itsNo         !== undefined) basicPayload.ITSNo          = f.itsNo;
      if (f.hofIts        !== undefined) basicPayload.LocalHOFITSNo  = f.hofIts;
      if (f.mobile        !== undefined) basicPayload.Mobile         = f.mobile;
      if (f.mobile1       !== undefined) basicPayload.Mobile1        = f.mobile1;
      if (f.stayingIn     !== undefined) basicPayload.StayingIn      = f.stayingIn;
      if (f.sector        !== undefined) basicPayload.Sector         = f.sector;
      if (f.subsector     !== undefined) basicPayload.Subsector      = f.subsector;
      if (f.subsectorName !== undefined) basicPayload.SubsectorName  = f.subsectorName;
      if (f.workStatus    !== undefined) basicPayload.WorkStatus     = f.workStatus;
      if (f.loginAccess   !== undefined) basicPayload.LoginAccess    = f.loginAccess;
      if (f.status        !== undefined) basicPayload.AccountStatus  = f.status;
      if (f.sabeelType    !== undefined) basicPayload.SabeelType     = f.sabeelType;
      if (f.grade         !== undefined) basicPayload.CurrentGrade   = f.grade;
      if (f.sabeelRemark  !== undefined) basicPayload.SabeelRemark   = f.sabeelRemark;
      if (f.address       !== undefined) basicPayload.Address        = f.address;

      await memberService.updateMuminDetails(basicPayload);
      toast.success('Member profile updated');
      closeModal('editMember');
      await loadMember(member.accno);
    } catch { toast.error('Failed to update'); }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const initials = (() => {
    const words = member?.name?.trim().split(/\s+/).filter(Boolean);
    if (!words || words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  })();

  const tabCounts = {
    takhmeen: takhmeen.length,
    receipts: receipts.length,
    family:   family.length,
    safai:    safaiCount,
    vajebaat: vajebaat.length + himList.length,
    followup: followupList.filter(r => r.status === 'open').length,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <MuminSearchBar
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        searching={searching}
        onSearch={(val) => { setShowSuggestions(false); loadMember(val); }}
        onClear={() => { setSearchVal(''); setMember(null); setSuggestions([]); setShowSuggestions(false); }}
        onNewMember={FEATURES.newMember ? () => openModal('newMember') : null}
        showSuggestions={showSuggestions}
        suggestLoading={suggestLoading}
        suggestions={suggestions}
        dropdownStyle={dropdownStyle}
        onSelectSuggestion={(m) => { setShowSuggestions(false); setSearchVal(String(m.accno || '')); loadMember(m.accno); }}
        searchInputRef={searchInputRef}
      />

      {!member && !searching && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-sm">Search for a member to view their profile</div>
        </div>
      )}

      {member && (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 items-start">

          {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <MuminProfileCard
              member={member}
              initials={initials}
              features={FEATURES}
              onEdit={() => openModal('editMember')}
              onAddReceipt={() => openModal('addReceipt')}
              onPrint={() => window.print()}
              onResetPass={() => openModal('resetPass')}
              onOverallDue={FEATURES.overallDue ? () => openModal('overallDue') : null}
            />
            {FEATURES.fmbCard && (
              <FmbDetailsCard
                member={member}
                showEdit={FEATURES.editFMB}
                showPrint={FEATURES.printFMB}
                onPrint={() => window.open(buildViewUrl({ accno: member?.accno, subhead: 'FMB' }), '_blank')}
                printButtonNode={FEATURES.printFMB ? (
                  <PrintConfigButton
                    buttonId="fmb-print"
                    accno={member?.accno}
                    defaultSubhead="FMB"
                    label="Print"
                    className="btn btn-secondary btn-sm flex-1 justify-center"
                    icon={<PrintIcon className="w-3.5 h-3.5 mr-1.5" />}
                  />
                ) : null}
                onEdit={() => {
                  setFmbForm({
                    ThaaliStatus:    member.thaaliStatus  || '',
                    ThaaliSize:      member.thaaliSize    || '',
                    DistributorName: member.distributor   || '',
                    DistributorID:   member.distributorId || '',
                    ThaliCloseYear:  member.closeYear     || '',
                    ThaliCloseDate:  toInputDate(member.closeDate),
                    TempFromDate:    toInputDate(member.tempFrom),
                    TempToDate:      toInputDate(member.tempTo),
                    Reason:          member.thaaliReason  || '',
                    FMBRemark:       member.fmbRemark     || '',
                  });
                  openModal('editFMB');
                }}
              />
            )}
            {FEATURES.vajebaatInfoCard && (
              <VajebaatInfoCard
                member={member}
                onEdit={() => {
                  setVajInfoForm({
                    LocalTokenNo:    member.tokenNo   || '',
                    LocalTokenDate:  toInputDate(member.tokenDate),
                    FavorName:       member.favorName || '',
                    FavorITS:        member.favorIts  || '',
                    Mouze:           member.mouze     || '',
                    VajebaatRemark:  '',
                    VajProfileUnlock:!!member.vajUnlock,
                  });
                  openModal('editVaj');
                }}
              />
            )}
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              {FEATURES.dueSummary && (
                <div className="sm:w-[35%] shrink-0">
                  <DueSummaryCards
                    takhmeen={takhmeen}
                    onOverallDue={FEATURES.overallDue ? () => openModal('overallDue') : null}
                    onSendReminder={(data) => { setDueReminderData(data); openModal('dueReminder'); }}
                  />
                </div>
              )}
              {FEATURES.alertBanners && (
                <div className="flex-1">
                  <AlertBanners
                    takhmeen={takhmeen}
                    member={member}
                    onAddTakhmeen={(mainHead, subHead, forYear) => {
                      setTakForm({ mainHead, subHead, forYear: forYear || user.ForYearAll || '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                      openModal('addTakhmeen');
                    }}
                  />
                </div>
              )}
            </div>
            {/* <ActionBar
              features={FEATURES}
              onAddReceipt={() => openModal('addReceipt')}
              onAddTakhmeen={() => {
                setTakForm({ mainHead: '', subHead: '', forYear: takYear || '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                openModal('addTakhmeen');
              }}
              onVajebaatEntry={() => openModal('vajebaatSpeed')}
              onSabeelDue={() => openModal('sabeelDue')}
              onAddSafai={() => openModal('addSafai')}
              onAddFollowup={() => openModal('addFollowup')}
              onTakPreview={() => openModal('takPreview')}
            /> */}

            {/* Tab panel */}
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b-2 border-border bg-surface overflow-x-auto scrollbar-thin">
                {TAB_LIST.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={clsx(
                      'px-4 py-2.5 text-[12.5px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-[2px] transition-all',
                      tab === t.key
                        ? 'text-blue-500 border-blue-500 font-semibold bg-white'
                        : 'text-gray-400 border-transparent hover:text-navy-900 hover:bg-white/60'
                    )}
                  >
                    {t.label}
                    {tabCounts[t.key] > 0 && (
                      <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {tabCounts[t.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'takhmeen' && (
                <TakhmeenTab
                  takhmeen={takhmeen}
                  takYear={takYear}     setTakYear={setTakYear}
                  takMainHead={takMainHead} setTakMainHead={setTakMainHead}
                  takSubHead={takSubHead}   setTakSubHead={setTakSubHead}
                  onAdd={() => {
                    setTakForm({ mainHead: '', subHead: '', forYear: takYear || '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onEdit={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDelete={deleteTakhmeen}
                />
              )}
              {tab === 'receipts' && (
                <ReceiptsTab
                  receipts={receipts}
                  setReceipts={setReceipts}
                  accno={member?.accno}
                  onAddReceipt={() => openModal('addReceipt')}
                  onEditReceipt={async (row) => {
                    // New data: TransactionsDetail.ID = transactionitemsdetail.TransID
                    // Old data: TransactionsDetail.(AccNo, HubSubHead, ReceiptNo) = transactionitemsdetail.(AccNo, HubSubHead, ReceiptNo)
                    const transId   = row.TransID ?? row.transID ?? row.transId ?? row.ID ?? row.Id ?? row.id;
                    const accNo     = row.AccNo      || row.accno    || member?.accno || '';
                    const hubSubHead= row.HubSubHead || row.subHead  || '';
                    const receiptNo = row.ReceiptNo  || row.receiptNo|| '';
                    const fallbackItem = {
                      subHead:  row.subHead  || '',
                      mainHead: row.mainHead || '',
                      forYear:  row.forYear  || '',
                      amount:   Number(row.amount) || 0,
                      remark:   row.remark   || '',
                      grade:    row.grade    || '',
                    };
                    try {
                      const res = await receiptService.loadTransactionItemDetails({
                        TransID:    transId,
                        AccNo:      accNo,
                        HubSubHead: hubSubHead,
                        ReceiptNo:  receiptNo,
                      });
                      const rawItems = normalizeArray(res.data);
                      const items = rawItems.length > 0
                        ? rawItems.map(it => ({
                            id:       it.ID      || it.Id      || null,
                            subHead:  it.HubSubHead  || it.subHead  || it.SubHead  || '',
                            mainHead: it.HubMainHead || it.mainHead || it.MainHead || '',
                            forYear:  it.ForYear     || it.forYear  || '',
                            amount:   Number(it.Amount || it.amount) || 0,
                            remark:   it.Remark      || it.remark   || '',
                            grade:    it.Grade       || it.grade    || '',
                          }))
                        : [fallbackItem];
                      setEditReceiptRow({ ...row, items });
                    } catch {
                      setEditReceiptRow({ ...row, items: [fallbackItem] });
                    }
                    openModal('editReceipt');
                  }}
                  onPrintReceipt={(row) => { setEditReceiptRow(row); openReceiptPrint(row); }}
                />
              )}
              {tab === 'family' && <FamilyTab family={family} loading={familyLoading} />}
              {tab === 'safai' && (
                <SafaiChitthiTab member={member} onCountChange={setSafaiCount} />
              )}
              {tab === 'vajebaat' && (
                <VajebaatTab
                  member={member}
                  vajebaat={vajebaat}
                  himList={himList}
                  sniyazList={sniyazList}
                  silaFitra={silaFitra}
                  vajForm={vajForm}
                  setVajForm={setVajForm}
                  onSaveVajebaat={saveVajebaat}
                  onAddHim={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'HIM', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onHimForm={() => window.open(buildViewUrl({ accno: member?.accno, subhead: 'HIM' }), '_blank')}
                  onEditHim={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteHim={deleteTakhmeen}
                  onAddSniyaz={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'Shehrullah Niyaz', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onSniyazForm={() => window.open(buildViewUrl({ accno: member?.accno, subhead: 'Shehrullah Niyaz' }), '_blank')}
                  onEditSniyaz={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteSniyaz={deleteTakhmeen}
                  onAddReceipt={() => openModal('addReceipt')}
                  onAddVaj={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'Vajebaat', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onVajForm={() => window.open(buildViewUrl({ accno: member?.accno, subhead: 'Vajebaat' }), '_blank')}
                  onEditVaj={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteVaj={deleteTakhmeen}
                  onPrintVaj={(row) => window.open(buildViewUrl({ accno: member?.accno, subhead: 'Vajebaat' }), '_blank')}
                  onSfForm={() => window.open(buildViewUrl({ accno: member?.accno, subhead: 'Sila Fitra' }), '_blank')}
                  onAddSf={saveSilaFitraRecord}
                  onUpdateSf={updateSilaFitraRecord}
                  onDeleteSf={deleteSilaFitraRecord}
                  onEditVajInfo={() => {
                    setVajInfoForm({
                      LocalTokenNo:     member.tokenNo   || '',
                      LocalTokenDate:   toInputDate(member.tokenDate),
                      FavorName:        member.favorName || '',
                      FavorITS:         member.favorIts  || '',
                      Mouze:            member.mouze     || '',
                      VajebaatRemark:   '',
                      VajProfileUnlock: !!member.vajUnlock,
                    });
                    openModal('editVaj');
                  }}
                />
              )}
              {tab === 'followup' && (
                <FollowupTab
                  followups={followupList}
                  loading={followupLoading}
                  onAdd={() => {
                    setFollowupForm({ date: today(), note: '', action: 'Call Again' });
                    openModal('addFollowup');
                  }}
                  onReload={() => member && loadFollowups(member.accno)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ MODALS ═══════════════════════════════════════ */}
      <TakhmeenModal
        mode="add"
        open={modals.addTakhmeen} onClose={() => closeModal('addTakhmeen')}
        member={member}
        row={takForm} setRow={setTakForm}
        onSave={saveTakhmeen}
      />
      <EditTakhmeenModal
        open={modals.editTakhmeen} onClose={() => closeModal('editTakhmeen')}
        member={member}
        editTakRow={editTakRow} setEditTakRow={setEditTakRow}
        onSave={updateTakhmeen}
      />
      <AddReceiptModal
        open={modals.addReceipt} onClose={() => closeModal('addReceipt')}
        member={member}
        rcForm={rcForm} setRcForm={setRcForm}
        rcItem={rcItem} setRcItem={setRcItem}
        rcItems={rcItems} setRcItems={setRcItems}
        onSave={saveReceipt}
      />
      <EditReceiptModal
        open={modals.editReceipt} onClose={() => closeModal('editReceipt')}
        member={member}
        rcForm={editReceiptRow || {}} setRcForm={setEditReceiptRow}
        onPrint={() => { closeModal('editReceipt'); openReceiptPrint(editReceiptRow); }}
        onSave={async () => {
          if (!editReceiptRow) return;
          if (!editReceiptRow.updateReason?.trim()) {
            toast.error('Please enter a reason for this update');
            return;
          }
          try {
            const { receiptNo, receivedDate, mode, status, updateReason, items } = editReceiptRow;
            const transId      = editReceiptRow.ID || editReceiptRow.Id || editReceiptRow.id;
            if (!transId) {
              toast.error('Receipt ID not found — please close this modal, refresh the Receipt History tab, and try again.');
              return;
            }
            const receivedFrom = editReceiptRow.fullName     || editReceiptRow.ReceivedFrom || '';
            const mobileVal    = editReceiptRow.mobile       || editReceiptRow.Mobile       || '';
            const itsNoVal     = editReceiptRow.itsNo        || editReceiptRow.ITSNo        || '';
            const totalAmt     = (items || []).reduce((s, it) => s + Number(it.amount || 0), 0);
            // MySQL DATETIME format: 'YYYY-MM-DD HH:MM:SS'
            const recordUpdateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const updatedBy        = user?.username || user?.UserName || user?.name || 'Unknown';
            const fullReason       = `${updateReason.trim()} - Updated by: ${updatedBy}`;

            // Step 1 — update TransactionsDetail header
            await receiptService.updateTransaction({
              ID:                 transId,
              ReceivedFrom:       receivedFrom,
              Mobile:             mobileVal,
              ITSNo:              itsNoVal,
              ReceivedDate:       receivedDate,
              ReceivedAmount:     totalAmt,
              Mode:               mode,
              TransactionRefNo:   editReceiptRow.transactionRefNo ?? editReceiptRow.TransactionRefNo ?? '',
              Remark:             editReceiptRow.remark ?? editReceiptRow.Remark ?? '',
              RecordUpdateReason: fullReason,
              RecordUpdateDate:   recordUpdateDate,
              Status:             status,
            });

            // Step 2 — update each item in transactionitemsdetail
            for (const item of (items || [])) {
              if (!item.id) continue;
              await receiptService.updateTransactionItem({
                ID:      item.id,
                ForYear: item.forYear,
                Grade:   item.grade,
                Amount:  item.amount,
                Remark:  item.remark,
                Status:  status,
              });
            }

            // Step 3 — recalculate takhmeen received totals
            await takhmeenService.updateTakhmeenReceived({ AccNo: member?.accno });

            toast.success('Receipt updated successfully');
            closeModal('editReceipt');
            receiptService.loadTransactionDetails({ AccNo: member?.accno })
              .then(res => setReceipts(normalizeArray(res.data).map(normalizeReceiptRow)))
              .catch(() => {});
          } catch (err) {
            console.error(err);
            toast.error('Failed to update receipt');
          }
        }}
      />
      <ReceiptPrintModal
        open={showPrint} onClose={() => setShowPrint(false)}
        printData={printData}
      />
      <ResetPasswordModal
        open={modals.resetPass} onClose={() => closeModal('resetPass')}
        member={member} onReset={resetPassword}
      />
      <AddFollowupModal
        open={modals.addFollowup} onClose={() => closeModal('addFollowup')}
        followupForm={followupForm} setFollowupForm={setFollowupForm}
        onSave={saveFollowup}
      />
      


      <OverallDueModal
        open={modals.overallDue} onClose={() => closeModal('overallDue')}
        member={member} due={due} takhmeen={takhmeen}
      />
      <SendDueReminderModal
        open={modals.dueReminder} onClose={() => closeModal('dueReminder')}
        member={member} dueData={dueReminderData}
      />
      <TakhmeenPreviewModal
        open={modals.takPreview} onClose={() => closeModal('takPreview')}
        member={member} takhmeen={takhmeen}
      />
      <EditMemberModal
        open={modals.editMember} onClose={() => closeModal('editMember')}
        member={member} memberForm={memberForm} setMemberForm={setMemberForm}
        sectorOptions={sectorOptions} cityOptions={cityOptions} subsectorOpts={subsectorOpts}
        workStatusOptions={lookupWorkStatuses} distributorOptions={lookupDistributors}
        onSave={updateMember}
      />
      <AddNewMemberModal
        open={modals.newMember} onClose={() => closeModal('newMember')}
        newMemberForm={newMemberForm} setNF={setNF}
        sectorOptions={sectorOptions} cityOptions={cityOptions} subsectorOpts={subsectorOpts}
        onSave={saveNewMember}
      />
      <EditFmbModal
        open={modals.editFMB} onClose={() => closeModal('editFMB')}
        member={member} fmbForm={fmbForm} setFF={setFF}
        distributorOptions={lookupDistributors}
        onSave={saveFMB}
      />
      <FmbTakhmeenPrintModal
        open={modals.fmbPrint} onClose={() => closeModal('fmbPrint')}
        member={member} takhmeen={takhmeen}
      />
      <EditVajInfoModal
        open={modals.editVaj} onClose={() => closeModal('editVaj')}
        member={member} vajInfoForm={vajInfoForm} setVF={setVF}
        onSave={saveVajInfo}
      />
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it
export default function MuminDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading…</div>}>
      <MuminDetailsInner />
    </Suspense>
  );
}
