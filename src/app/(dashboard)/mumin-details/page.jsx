'use client';

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  memberService, takhmeenService, receiptService,
  safaiService, vajebaatService, followupService,
} from '@/services';
import toast  from 'react-hot-toast';
import clsx   from 'clsx';

import {
  today, toInputDate,
  normalizeArray, normalizeTakRow, normalizeMemberPayload,
} from './utils';

// Layout components
import MuminSearchBar   from './components/MuminSearchBar';
import MuminProfileCard from './components/MuminProfileCard';
import FmbDetailsCard   from './components/FmbDetailsCard';
import VajebaatInfoCard from './components/VajebaatInfoCard';
import DueSummaryCards  from './components/DueSummaryCards';
import AlertBanners     from './components/AlertBanners';
import ActionBar        from './components/ActionBar';

// Tab components
import TakhmeenTab     from './components/tabs/TakhmeenTab';
import ReceiptsTab     from './components/tabs/ReceiptsTab';
import FamilyTab       from './components/tabs/FamilyTab';
import SafaiChitthiTab from './components/tabs/SafaiChitthiTab';
import VajebaatTab     from './components/tabs/VajebaatTab';

// Modal components
import TakhmeenModal       from './components/modals/TakhmeenModal';
import AddReceiptModal     from './components/modals/AddReceiptModal';
import ResetPasswordModal  from './components/modals/ResetPasswordModal';
import AddFollowupModal    from './components/modals/AddFollowupModal';
import AddSafaiModal       from './components/modals/AddSafaiModal';
import OverallDueModal     from './components/modals/OverallDueModal';
import TakhmeenPreviewModal from './components/modals/TakhmeenPreviewModal';
import EditMemberModal     from './components/modals/EditMemberModal';
import AddNewMemberModal   from './components/modals/AddNewMemberModal';
import EditFmbModal        from './components/modals/EditFmbModal';
import EditVajInfoModal    from './components/modals/EditVajInfoModal';

// ── Feature flags — set false to hide, true to show ──────────────────────────
// Tab list is derived at module level so the default tab state uses it
const FEATURES = {
  // Left panel cards
  fmbCard:         true,
  vajebaatInfoCard:false,

  // Profile card actions
  editProfile:     true,
  resetPassword:   true,
  overallDue:      true,

  // Due summary row
  dueSummary:      true,

  // Alert banners (HIM / FMB pending warnings)
  alertBanners:    true,

  // Action bar buttons
  addReceipt:      true,
  addTakhmeen:     true,
  vajebaatEntry:   true,
  sabeelDue:       true,
  addSafai:        true,
  followup:        true,
  takhmeenPreview: true,

  // Tabs
  takhmeenTab:     true,
  receiptsTab:     true,
  familyTab:       true,
  safaiTab:        true,
  vajebaatTab:     true,

  // New member button in search bar
  newMember:       true,
};

const TAB_LIST = [
  FEATURES.takhmeenTab && { key: 'takhmeen', label: 'Takhmeen' },
  FEATURES.receiptsTab && { key: 'receipts', label: 'Receipt History' },
  FEATURES.familyTab   && { key: 'family',   label: 'Family Details' },
  FEATURES.safaiTab    && { key: 'safai',     label: 'Safai Chitthi' },
  FEATURES.vajebaatTab && { key: 'vajebaat',  label: 'Vajebaat' },
].filter(Boolean);

// ═══════════════════════════════════════════════════════════════════════════
function MuminDetailsInner() {
  const params          = useSearchParams();
  const router          = useRouter();
  const { permissions } = useAuth();

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchVal,       setSearchVal]       = useState(params.get('accno') || '');
  const [searching,       setSearching]       = useState(false);
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading,  setSuggestLoading]  = useState(false);
  const [dropdownStyle,   setDropdownStyle]   = useState({});
  const searchInputRef = useRef(null);
  const suggestTimer   = useRef(null);

  // ── Member data ───────────────────────────────────────────────────────────
  const [member,     setMember]     = useState(null);
  const [takhmeen,   setTakhmeen]   = useState([]);
  const [receipts,   setReceipts]   = useState([]);
  const [family,     setFamily]     = useState([]);
  const [safaiList,  setSafaiList]  = useState([]);
  const [vajebaat,   setVajebaat]   = useState([]);
  const [himList,    setHimList]    = useState([]);
  const [sniyazList, setSniyazList] = useState([]);
  const [silaFitra,  setSilaFitra]  = useState([]);
  const [due,        setDue]        = useState(null);

  // ── Tab & modals ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState(TAB_LIST[0]?.key || '');

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
    takPreview:  false,
  });
  const openModal  = (k) => setModals(p => ({ ...p, [k]: true }));
  const closeModal = (k) => setModals(p => ({ ...p, [k]: false }));

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
  const [rcItems,      setRcItems]      = useState([]);
  const [rcForm,       setRcForm]       = useState({ date: today(), mode: 'Cash', transType: 'VOLUNTARY CONTRIBUTION', remark: '', sendSMS: false });
  const [rcItem,       setRcItem]       = useState({ hubType: 'Sabeel Regular', forYear: '', amount: '' });
  const [safaiForm,    setSafaiForm]    = useState({ issueDate: today(), validTill: '', reason: '', remark: '' });
  const [vajForm,      setVajForm]      = useState({ sf: '', vaj: '', house: '', niyaz: '', other: '' });
  const [himForm,      setHimForm]      = useState({ forYear: '', override: '' });
  const [sniyazForm,   setSniyazForm]   = useState({ forYear: '', count: '', tareekh: '', status: 'Done', amount: '' });
  const [memberForm,   setMemberForm]   = useState({});
  const [newMemberForm, setNewMemberForm] = useState({
    AccNo: '', FullName: '', Sector: '', Mobile: '', Mobile1: '',
    ITSNo: '', LocalHOFITSNo: '', Subsector: '', SubsectorName: '',
    StayingIn: '', WorkStatus: '', SabeelRemark: '',
  });
  const setNF = (k, v) => setNewMemberForm(p => ({ ...p, [k]: v }));

  const [fmbForm, setFmbForm] = useState({
    ThaaliStatus: '', ThaaliSize: '', DistributorName: '',
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
  const [mohallaList,  setMohallaList]  = useState([]);
  const [lookupCities, setLookupCities] = useState([]);

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
        value:         String(m.Subsector     ?? m.subsector     ?? ''),
        label:         `${m.Subsector ?? m.subsector ?? ''} — ${m.SubsectorName ?? m.subsectorName ?? ''}`,
        sector:        String(m.Sector        ?? m.sector        ?? ''),
        subsectorName: String(m.SubsectorName ?? m.subsectorName ?? ''),
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
    if (!query || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
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
      const [memberRes, takRes] = await Promise.all([
        memberService.loadMuminDetails({ Search: accno }),
        takhmeenService.loadDetails({ AccNo: accno }),
      ]);
      const payload    = memberRes.data ?? {};
      const normalized = normalizeMemberPayload(payload);
      const memberData = normalized.member;
      if (!memberData || !memberData.accno) throw new Error('Member not found');
      setMember(memberData);
      setTakhmeen(normalizeArray(takRes.data).map(normalizeTakRow));
      setReceipts(normalized.receipts);
      setFamily(normalized.family);
      setSafaiList(normalized.safai);
      setMemberForm(memberData);
      router.replace(`/mumin-details?accno=${accno}`, { scroll: false });
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
    const takRes = await takhmeenService.loadDetails({ AccNo: member.accno });
    const all = normalizeArray(takRes.data).map(normalizeTakRow);
    setVajebaat(all.filter(r => r.subHead === 'Vajebaat'));
    setHimList(all.filter(r => r.subHead === 'HIM'));
    setSniyazList(all.filter(r => r.subHead === 'Shehrullah Niyaz'));
    setSilaFitra(all.filter(r => r.subHead === 'Sila Fitra'));
  }, [member]);

  useEffect(() => {
    const a = params.get('accno');
    if (a) loadMember(a);
    const toArray = (r) =>
      Array.isArray(r?.data?.data) ? r.data.data
      : Array.isArray(r?.data)     ? r.data
      : (r?.data?.recordset ?? r?.data?.recordsets?.[0] ?? []);

    memberService.loadMohallaDetails({ ID: '', Sector: '', Subsector: '', SubsectorName: '' })
      .then(res => setMohallaList(toArray(res)))
      .catch(err => console.error('LoadMohallaDetails failed:', err?.response?.data ?? err.message));

    memberService.loadMuminDetails({ Search: '' })
      .then(res => {
        const cities = [...new Set(
          toArray(res).map(m => m.StayingIn ?? m.stayingIn ?? '').filter(Boolean)
        )].sort();
        setLookupCities(cities);
      })
      .catch(err => console.error('LoadMuminDetails (cities) failed:', err?.response?.data ?? err.message));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (tab === 'vajebaat' && member) loadVajebaat();
  }, [tab, member, loadVajebaat]);

  // ── Takhmeen handlers ─────────────────────────────────────────────────────
  const reloadTakhmeen = async () => {
    const res = await takhmeenService.loadDetails({ AccNo: member.accno });
    setTakhmeen(normalizeArray(res.data).map(normalizeTakRow));
  };

  const saveTakhmeen = async () => {
    if (!takForm.mainHead || !takForm.takhmeen) { toast.error('Fill required fields'); return; }
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
    try {
      await takhmeenService.updateDetails({
        ID:           editTakRow.id,
        AccNo:        member.accno,
        ForYear:      editTakRow.forYear,
        HubMainHead:  editTakRow.mainHead,
        HubSubHead:   editTakRow.subHead,
        Grade:        editTakRow.grade,
        Takhmeen:     Number(editTakRow.takhmeen) || 0,
        Received:     Number(editTakRow.received) || 0,
        TakhmeenDate: editTakRow.date,
        Remark:       editTakRow.remark,
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

  // ── Receipt handlers ──────────────────────────────────────────────────────
  const saveReceipt = async () => {
    if (rcItems.length === 0) { toast.error('Add at least one item'); return; }
    try {
      const res = await receiptService.save({ accno: member.accno, ...rcForm, items: rcItems });
      toast.success(`Receipt #${res.data.receiptNo} saved`);
      closeModal('addReceipt');
      setRcItems([]);
      const rRes = await receiptService.getDailyReport({ accno: member.accno });
      setReceipts(rRes.data);
    } catch { toast.error('Failed to save receipt'); }
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
          ForYear:      permissions.ForYearAll,
          HubMainHead:  'Vajebaat',
          HubSubHead:   subHead,
          Takhmeen:     Number(vajForm[key]) || 0,
          Received:     0,
          TakhmeenDate: today(),
        })
      ));
      toast.success('Vajebaat takhmeen saved');
      await Promise.all([reloadTakhmeen(), loadVajebaat()]);
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

  const saveFollowup = async () => {
    try {
      await followupService.create({ accno: member.accno, ...followupForm });
      toast.success('Follow-up saved');
      closeModal('addFollowup');
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
    if (!f.AccNo.trim())    { toast.error('Account No. is required'); return; }
    if (!f.FullName.trim()) { toast.error('Full Name is required');   return; }
    try {
      await memberService.addMuminDetails({
        AccNo: f.AccNo.trim(), FullName: f.FullName.trim(),
        Sector: f.Sector || undefined, Mobile: f.Mobile || undefined,
        Mobile1: f.Mobile1 || undefined, ITSNo: f.ITSNo || undefined,
        LocalHOFITSNo: f.LocalHOFITSNo || undefined,
        Subsector: f.Subsector || undefined, SubsectorName: f.SubsectorName || undefined,
        StayingIn: f.StayingIn || undefined, WorkStatus: f.WorkStatus || undefined,
        SabeelRemark: f.SabeelRemark || undefined,
      });
      toast.success(`Member ${f.AccNo} added successfully`);
      closeModal('newMember');
      setNewMemberForm({ AccNo: '', FullName: '', Sector: '', Mobile: '', Mobile1: '', ITSNo: '', LocalHOFITSNo: '', Subsector: '', SubsectorName: '', StayingIn: '', WorkStatus: '', SabeelRemark: '' });
      setSearchVal(f.AccNo);
      await loadMember(f.AccNo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const updateMember = async () => {
    try {
      const f       = memberForm;
      const payload = { AccNo: member.accno };
      if (f.name          !== undefined) payload.FullName      = f.name;
      if (f.sector        !== undefined) payload.Sector        = f.sector;
      if (f.mobile        !== undefined) payload.Mobile        = f.mobile;
      const altMobile = f.mobile1 ?? f.mobile2;
      if (altMobile       !== undefined) payload.Mobile1       = altMobile;
      if (f.itsNo         !== undefined) payload.ITSNo         = f.itsNo;
      if (f.hofIts        !== undefined) payload.LocalHOFITSNo = f.hofIts;
      if (f.stayingIn     !== undefined) payload.StayingIn     = f.stayingIn;
      if (f.workStatus    !== undefined) payload.WorkStatus    = f.workStatus;
      if (f.loginAccess   !== undefined) payload.LoginAccess   = f.loginAccess;
      if (f.status        !== undefined) payload.AccountStatus = f.status;
      if (f.subsector     !== undefined) payload.Subsector     = f.subsector;
      if (f.subsectorName !== undefined) payload.SubsectorName = f.subsectorName;
      await memberService.updateMuminDetails(payload);
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
    safai:    safaiList.length,
    vajebaat: vajebaat.length + himList.length,
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
        <div className="grid grid-cols-[280px_1fr] gap-4 items-start">

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
              onOverallDue={() => openModal('overallDue')}
            />
            {FEATURES.fmbCard && (
              <FmbDetailsCard
                member={member}
                onEdit={() => {
                  setFmbForm({
                    ThaaliStatus:    member.thaaliStatus  || '',
                    ThaaliSize:      member.thaaliSize    || '',
                    DistributorName: member.distributor   || '',
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
          <div>
            {FEATURES.dueSummary && <DueSummaryCards due={due} />}
            {FEATURES.alertBanners && (
              <AlertBanners
                due={due}
                onHimTakhmeen={() => openModal('himTakhmeen')}
                onFmbTakhmeen={() => openModal('fmbTakhmeen')}
              />
            )}
            <ActionBar
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
            />

            {/* Tab panel */}
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b-2 border-border bg-surface overflow-x-auto">
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
                  permissions={permissions}
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
                  permissions={permissions}
                  onAddReceipt={() => openModal('addReceipt')}
                  onEditReceipt={() => openModal('editReceipt')}
                  onPrintReceipt={() => openModal('printReceipt')}
                />
              )}
              {tab === 'family' && <FamilyTab family={family} />}
              {tab === 'safai' && (
                <SafaiChitthiTab
                  safaiList={safaiList}
                  onAdd={() => openModal('addSafai')}
                  onEdit={() => openModal('editSafai')}
                  onPrint={() => openModal('printSafai')}
                />
              )}
              {tab === 'vajebaat' && permissions.MDVajebaatTabView && (
                <VajebaatTab
                  member={member}
                  vajebaat={vajebaat}
                  himList={himList}
                  sniyazList={sniyazList}
                  silaFitra={silaFitra}
                  vajForm={vajForm}
                  setVajForm={setVajForm}
                  permissions={permissions}
                  onSaveVajebaat={saveVajebaat}
                  onAddHim={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'HIM', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onHimForm={() => openModal('takPreview')}
                  onEditHim={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteHim={deleteTakhmeen}
                  onAddSniyaz={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'Shehrullah Niyaz', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onSniyazForm={() => openModal('takPreview')}
                  onEditSniyaz={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteSniyaz={deleteTakhmeen}
                  onAddReceipt={() => openModal('addReceipt')}
                  onAddVaj={() => {
                    setTakForm({ mainHead: 'Vajebaat', subHead: 'Vajebaat', forYear: '', grade: '', takhmeen: 0, received: 0, date: today(), remark: '', lastTakhmeen: 0, currentTakhmeen: 0, paidin: '', place: '' });
                    openModal('addTakhmeen');
                  }}
                  onVajForm={() => openModal('takPreview')}
                  onEditVaj={(row) => { setEditTakRow(row); openModal('editTakhmeen'); }}
                  onDeleteVaj={deleteTakhmeen}
                  onPrintVaj={(row) => { setEditTakRow(row); openModal('printReceipt'); }}
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
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ MODALS ═══════════════════════════════════════ */}
      <TakhmeenModal
        mode="add"
        open={modals.addTakhmeen} onClose={() => closeModal('addTakhmeen')}
        member={member} permissions={permissions}
        row={takForm} setRow={setTakForm}
        onSave={saveTakhmeen}
      />
      <TakhmeenModal
        mode="edit"
        open={modals.editTakhmeen} onClose={() => closeModal('editTakhmeen')}
        member={member} permissions={permissions}
        row={editTakRow} setRow={setEditTakRow}
        onSave={updateTakhmeen}
      />
      <AddReceiptModal
        open={modals.addReceipt} onClose={() => closeModal('addReceipt')}
        member={member} permissions={permissions}
        rcForm={rcForm} setRcForm={setRcForm}
        rcItem={rcItem} setRcItem={setRcItem}
        rcItems={rcItems} setRcItems={setRcItems}
        onSave={saveReceipt}
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
      <AddSafaiModal
        open={modals.addSafai} onClose={() => closeModal('addSafai')}
        member={member} safaiForm={safaiForm} setSafaiForm={setSafaiForm}
        onSave={saveSafai}
      />


      <OverallDueModal
        open={modals.overallDue} onClose={() => closeModal('overallDue')}
        member={member} due={due} takhmeen={takhmeen}
      />
      <TakhmeenPreviewModal
        open={modals.takPreview} onClose={() => closeModal('takPreview')}
        member={member} permissions={permissions} takhmeen={takhmeen}
      />
      <EditMemberModal
        open={modals.editMember} onClose={() => closeModal('editMember')}
        member={member} memberForm={memberForm} setMemberForm={setMemberForm}
        sectorOptions={sectorOptions} cityOptions={cityOptions} subsectorOpts={subsectorOpts}
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
        onSave={saveFMB}
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
