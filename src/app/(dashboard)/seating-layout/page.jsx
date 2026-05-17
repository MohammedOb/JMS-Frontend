'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { hallService, memberService, seatingLookupService, voidService } from '@/services';
import { getRowLabel, THIS_YEAR, buildSeatKey, buildSeatMap, buildVoidMap, DEFAULT_LOOKUPS } from './components/constants';

import FilterBar       from './components/booking/FilterBar';
import StatsActionBar  from './components/booking/StatsActionBar';
import SeatGrid        from './components/booking/SeatGrid';
import HallsTable      from './components/layout-manager/HallsTable';
import HallModal       from './components/modals/HallModal';
import SectionModal    from './components/modals/SectionModal';
import SeatClickModal  from './components/modals/SeatClickModal';
import AutoAssignModal from './components/modals/AutoAssignModal';
import BlockRangeModal from './components/modals/BlockRangeModal';
import VoidSeatsModal  from './components/modals/VoidSeatsModal';

export default function SeatingLayoutPage() {
  const [activeTab, setActiveTab] = useState('booking');

  // ── Lookup options (from DB) ──────────────────────────────────────────────────
  const [lookups, setLookups] = useState(DEFAULT_LOOKUPS);

  useEffect(() => {
    seatingLookupService.loadLookups({})
      .then(res => { if (res.data?.data) setLookups(prev => ({ ...prev, ...res.data.data })); })
      .catch(() => {});
  }, []);

  // ── Layout Manager state ──────────────────────────────────────────────────────
  const [halls, setHalls]               = useState([]);
  const [expandedHall, setExpandedHall] = useState(null);
  const [sections, setSections]         = useState({});
  const [loadingHalls, setLoadingHalls] = useState(false);

  const [hallModal, setHallModal]       = useState({ open: false, mode: 'add', data: {} });
  const [sectionModal, setSectionModal] = useState({ open: false, mode: 'add', data: {}, hallId: null });

  // ── Booking state ─────────────────────────────────────────────────────────────
  const [filterEventType, setFilterEventType] = useState('');
  const [filterYear, setFilterYear]           = useState(THIS_YEAR);
  const [filterHallId, setFilterHallId]       = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [bookingSections, setBookingSections] = useState([]);
  const [seatMap, setSeatMap]                 = useState({});
  const [activeSec, setActiveSec]             = useState(null);
  const [loadingGrid, setLoadingGrid]         = useState(false);

  // ── Seat modal state ──────────────────────────────────────────────────────────
  const [seatModal, setSeatModal]               = useState({ open: false, row: '', col: '', alloc: null });
  const [memberQuery, setMemberQuery]           = useState('');
  const [memberResults, setMemberResults]       = useState([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember]     = useState(null);
  const [blockRemark, setBlockRemark]           = useState('');
  const memberSearchTimer                       = useRef(null);

  // ── Void seats state ──────────────────────────────────────────────────────────
  const [voidMap,   setVoidMap]   = useState({});
  const [voidModal, setVoidModal] = useState({ open: false, section: null });

  // ── Block-range modal state ───────────────────────────────────────────────────
  const [blockRangeModal, setBlockRangeModal] = useState(false);

  // ── Auto-assign modal state ───────────────────────────────────────────────────
  const [autoModal,   setAutoModal]   = useState(false);
  const [autoMembers, setAutoMembers] = useState([]);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [autoPreview, setAutoPreview] = useState(null);

  // ── Load halls ────────────────────────────────────────────────────────────────

  const loadHalls = useCallback(async () => {
    setLoadingHalls(true);
    try {
      const res = await hallService.loadLayouts({});
      setHalls(res.data?.data || []);
    } catch { toast.error('Failed to load venues'); }
    finally { setLoadingHalls(false); }
  }, []);

  useEffect(() => { loadHalls(); }, [loadHalls]);

  const loadSectionsForHall = useCallback(async (hallId) => {
    try {
      const res = await hallService.loadSections({ HallID: hallId });
      setSections(prev => ({ ...prev, [hallId]: res.data?.data || [] }));
    } catch { toast.error('Failed to load sections'); }
  }, []);

  const toggleExpandHall = (hallId) => {
    if (expandedHall === hallId) { setExpandedHall(null); return; }
    setExpandedHall(hallId);
    loadSectionsForHall(hallId);
  };

  // ── Hall CRUD ─────────────────────────────────────────────────────────────────

  const saveHall = async () => {
    const { mode, data } = hallModal;
    if (!data.HallName?.trim()) { toast.error('Venue name is required'); return; }
    try {
      if (mode === 'add') {
        await hallService.addLayout({ HallName: data.HallName, HallType: data.HallType || 'Masjid', Description: data.Description });
        toast.success('Venue added');
      } else {
        await hallService.updateLayout({ ID: data.ID, HallName: data.HallName, HallType: data.HallType, Description: data.Description });
        toast.success('Venue updated');
      }
      setHallModal({ open: false, mode: 'add', data: {} });
      loadHalls();
    } catch { toast.error('Failed to save venue'); }
  };

  const deleteHall = async (id) => {
    if (!confirm('Delete this venue? All its sections will also be deactivated.')) return;
    try {
      await hallService.deleteLayout({ ID: id });
      toast.success('Venue deleted');
      loadHalls();
    } catch { toast.error('Failed to delete venue'); }
  };

  // ── Section CRUD ──────────────────────────────────────────────────────────────

  const saveSection = async () => {
    const { mode, data, hallId } = sectionModal;
    if (!data.SectionName?.trim()) { toast.error('Section name is required'); return; }
    const rows = parseInt(data.RowCount) || 10;
    const cols = parseInt(data.ColCount) || 10;
    if (rows < 1) { toast.error('Rows must be at least 1'); return; }
    if (cols < 1) { toast.error('Columns must be at least 1'); return; }
    try {
      if (mode === 'add') {
        await hallService.addSection({ HallID: hallId, SectionName: data.SectionName, SectionType: data.SectionType || 'Gents', Position: data.Position || 'Center', RowCount: rows, ColCount: cols });
        toast.success('Section added');
      } else {
        await hallService.updateSection({ ID: data.ID, SectionName: data.SectionName, SectionType: data.SectionType, Position: data.Position, RowCount: rows, ColCount: cols });
        toast.success('Section updated');
      }
      setSectionModal({ open: false, mode: 'add', data: {}, hallId: null });
      loadSectionsForHall(hallId);
    } catch { toast.error('Failed to save section'); }
  };

  const deleteSection = async (id, hallId) => {
    if (!confirm('Delete this section? Its seat allocations will also be removed.')) return;
    try {
      await hallService.deleteSection({ ID: id });
      toast.success('Section deleted');
      loadSectionsForHall(hallId);
    } catch { toast.error('Failed to delete section'); }
  };

  // ── Booking: load sections when hall changes ──────────────────────────────────

  useEffect(() => {
    if (!filterHallId) { setBookingSections([]); setFilterSectionId(''); return; }
    hallService.loadSections({ HallID: filterHallId })
      .then(res => setBookingSections(res.data?.data || []))
      .catch(() => {});
  }, [filterHallId]);

  // ── Load seat grid ────────────────────────────────────────────────────────────

  const loadGrid = useCallback(async () => {
    if (!filterSectionId) return;
    const sec = bookingSections.find(s => String(s.ID) === String(filterSectionId));
    if (!sec) return;
    setActiveSec(sec);
    setLoadingGrid(true);
    try {
      const [gridRes, voidRes] = await Promise.all([
        hallService.loadSeatGrid({
          SectionID: filterSectionId,
          EventType: filterEventType || null,
          ForYear: filterYear || null,
        }),
        voidService.loadVoidGroups({ SectionID: filterSectionId }),
      ]);
      setSeatMap(buildSeatMap(gridRes.data?.data));
      setVoidMap(buildVoidMap(voidRes.data?.data || []));
    } catch { toast.error('Failed to load seat grid'); }
    finally { setLoadingGrid(false); }
  }, [filterSectionId, filterEventType, filterYear, bookingSections]);

  // ── Seat stats ────────────────────────────────────────────────────────────────

  const stats = (() => {
    if (!activeSec) return { total: 0, allocated: 0, blocked: 0, available: 0 };
    const voidCount = Object.keys(voidMap).length;
    const total = activeSec.RowCount * activeSec.ColCount - voidCount;
    const allocs = Object.values(seatMap);
    const allocated = allocs.filter(a => a.SeatStatus === 'Allocated').length;
    const blocked   = allocs.filter(a => a.SeatStatus === 'Blocked').length;
    return { total, allocated, blocked, available: total - allocated - blocked };
  })();

  // ── Seat click ────────────────────────────────────────────────────────────────

  const handleSeatClick = (row, col, alloc) => {
    setSeatModal({ open: true, row, col, alloc: alloc || null });
    setSelectedMember(null);
    setMemberQuery('');
    setMemberResults([]);
    setBlockRemark('');
  };

  // ── Member search (debounced) ─────────────────────────────────────────────────

  useEffect(() => {
    if (!memberQuery.trim() || memberQuery.length < 2) { setMemberResults([]); return; }
    clearTimeout(memberSearchTimer.current);
    memberSearchTimer.current = setTimeout(async () => {
      setSearchingMembers(true);
      try {
        const res = await memberService.loadFamilyMembersDetails({ Search: memberQuery });
        const seen = new Set();
        const unique = (res.data?.data || []).filter(m => {
          const k = m.ITS_ID || m.AccNo;
          if (!k || seen.has(k)) return false;
          seen.add(k); return true;
        });
        setMemberResults(unique.slice(0, 20));
      } catch {} finally { setSearchingMembers(false); }
    }, 350);
    return () => clearTimeout(memberSearchTimer.current);
  }, [memberQuery]);

  // ── Seat actions ──────────────────────────────────────────────────────────────

  const doAllocate = async () => {
    if (!selectedMember) { toast.error('Select a member first'); return; }
    const memberITS = String(selectedMember.ITS_ID || selectedMember.ITSNo || selectedMember.ITS_No || selectedMember.itsNo || '');
    if (memberITS) {
      const dupe = Object.values(seatMap).find(
        a => a.SeatStatus === 'Allocated' && String(a.ITSNo || '') === memberITS
      );
      if (dupe) {
        toast.error(`${selectedMember.Full_Name || selectedMember.FullName || 'This member'} is already in seat ${dupe.RowLabel}${dupe.ColNo}`);
        return;
      }
    }
    try {
      await hallService.allocateSeat({
        SectionID: filterSectionId, EventType: filterEventType || null,
        ForYear: filterYear || null, RowLabel: seatModal.row, ColNo: seatModal.col,
        AccNo: selectedMember.AccNo || selectedMember.accno || null,
        ITS_ID: selectedMember.ITS_ID || selectedMember.ITSNo || selectedMember.ITS_No || selectedMember.itsNo || null,
      });
      toast.success('Seat allocated');
      setSeatModal({ open: false, row: '', col: '', alloc: null });
      loadGrid();
    } catch { toast.error('Failed to allocate seat'); }
  };

  const doBlock = async () => {
    try {
      await hallService.blockSeat({
        SectionID: filterSectionId, EventType: filterEventType || null,
        ForYear: filterYear || null, RowLabel: seatModal.row, ColNo: seatModal.col,
        Remark: blockRemark,
      });
      toast.success('Seat blocked');
      setSeatModal({ open: false, row: '', col: '', alloc: null });
      loadGrid();
    } catch { toast.error('Failed to block seat'); }
  };

  const doClear = async () => {
    try {
      await hallService.clearSeat({
        SectionID: filterSectionId, EventType: filterEventType || null,
        ForYear: filterYear || null, RowLabel: seatModal.row, ColNo: seatModal.col,
      });
      toast.success('Seat cleared');
      setSeatModal({ open: false, row: '', col: '', alloc: null });
      loadGrid();
    } catch { toast.error('Failed to clear seat'); }
  };

  const doClearAll = async () => {
    if (!filterSectionId) { toast.error('Select a section first'); return; }
    if (!confirm('Clear ALL seat allocations for this section/event/year?')) return;
    try {
      await hallService.clearAllSeats({
        SectionID: filterSectionId, EventType: filterEventType || null, ForYear: filterYear || null,
      });
      toast.success('All seats cleared');
      loadGrid();
    } catch { toast.error('Failed to clear seats'); }
  };

  // ── Auto-assign ───────────────────────────────────────────────────────────────

  const fetchAutoMembers = async ({ gender, ageMin, ageMax, misaq, sector, mohallaDescription, source, excelMembers: excelMems }) => {
    if (!filterSectionId) { toast.error('Select a section first'); return; }
    setLoadingAuto(true);
    setAutoPreview(null);
    try {
      let members = [];

      const norm = (m) => ({
        AccNo:    m.AccNo    || m.ITSNo    || String(m.ITS_ID || ''),
        FullName: m.FullName || m.Full_Name || '',
        ITSNo:    m.ITSNo    || String(m.ITS_ID || ''),
        Age:      m.Age != null ? Number(m.Age) : null,
        Gender:   m.Gender   || '',
        Misaq:    m.Misaq    || '',
        Sector:   m.Sector   || '',
      });

      if (source === 'system' || source === 'both') {
        const res = await memberService.loadFamilyMembersDetails({
          Gender:             gender             || undefined,
          AgeMin:             ageMin             || undefined,
          AgeMax:             ageMax             || undefined,
          Misaq:              misaq              || undefined,
          Sector:             sector             || undefined,
          MohallaDescription: mohallaDescription || undefined,
        });
        members = (res.data?.data || []).map(norm);
      }

      if ((source === 'excel' || source === 'both') && excelMems?.length) {
        const sysITSNos = new Set(members.map(m => m.ITSNo).filter(Boolean));
        const unique = excelMems.map(norm).filter(m => !(m.ITSNo && sysITSNos.has(m.ITSNo)));
        members = [...members, ...unique];
      }

      const allocatedAccNos = new Set(
        Object.values(seatMap)
          .filter(a => a.SeatStatus === 'Allocated' && a.AccNo)
          .map(a => String(a.AccNo))
      );
      members = members.filter(m => !m.AccNo || !allocatedAccNos.has(m.AccNo));

      setAutoMembers(members);
    } catch { toast.error('Failed to load members'); }
    finally { setLoadingAuto(false); }
  };

  const generateAutoPreview = (sortBy, sortBy2) => {
    if (!autoMembers?.length || !activeSec) return;

    const cmp = (key, a, b) => {
      switch (key) {
        case 'age_asc':       return (a.Age ?? 999) - (b.Age ?? 999);
        case 'age_desc':      return (b.Age ?? -1) - (a.Age ?? -1);
        case 'name_asc':      return (a.FullName || '').localeCompare(b.FullName || '');
        case 'gender_male':   return (a.Gender === 'Male' ? 0 : 1) - (b.Gender === 'Male' ? 0 : 1);
        case 'gender_female': return (a.Gender === 'Female' ? 0 : 1) - (b.Gender === 'Female' ? 0 : 1);
        case 'misaq_done':    return (a.Misaq === 'Done' ? 0 : 1) - (b.Misaq === 'Done' ? 0 : 1);
        case 'misaq_not':     return (a.Misaq !== 'Done' ? 0 : 1) - (b.Misaq !== 'Done' ? 0 : 1);
        case 'sector_asc':    return (a.Sector || '').localeCompare(b.Sector || '');
        default:              return 0;
      }
    };

    let sorted = [...autoMembers];
    if (sortBy && sortBy !== 'none') {
      sorted.sort((a, b) => {
        const primary = cmp(sortBy, a, b);
        if (primary !== 0 || !sortBy2 || sortBy2 === 'none') return primary;
        return cmp(sortBy2, a, b);
      });
    }

    const available = [];
    for (let r = 0; r < activeSec.RowCount; r++) {
      for (let c = 1; c <= activeSec.ColCount; c++) {
        const rowLabel = getRowLabel(r);
        const key = buildSeatKey(rowLabel, c);
        if (!seatMap[key] && !voidMap[key]) available.push({ RowLabel: rowLabel, ColNo: c });
      }
    }
    const pairs = sorted.slice(0, available.length).map((m, i) => ({
      AccNo: m.AccNo, FullName: m.FullName, ITSNo: m.ITSNo,
      RowLabel: available[i].RowLabel, ColNo: available[i].ColNo,
    }));
    setAutoPreview(pairs);
  };

  const confirmAutoAssign = async () => {
    if (!autoPreview?.length) return;
    try {
      await hallService.autoAssignSeats({
        SectionID: filterSectionId,
        EventType: filterEventType || null,
        ForYear: filterYear || null,
        Assignments: autoPreview.map(p => ({
          SectionID: filterSectionId,
          EventType: filterEventType || null,
          ForYear: filterYear || null,
          RowLabel: p.RowLabel, ColNo: p.ColNo, AccNo: p.AccNo, ITS_ID: p.ITSNo || null,
        })),
      });
      toast.success(`${autoPreview.length} seats assigned`);
      setAutoModal(false);
      setAutoPreview(null);
      setAutoMembers([]);
      loadGrid();
    } catch { toast.error('Auto-assign failed'); }
  };

  // ── Print ─────────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    if (!activeSec) { toast.error('Load a seat grid first'); return; }
    const rows = Array.from({ length: activeSec.RowCount }, (_, i) => getRowLabel(i));
    const cols = Array.from({ length: activeSec.ColCount }, (_, i) => i + 1);

    const gridHtml = `
      <table style="border-collapse:collapse;font-size:10px;font-family:sans-serif;">
        <thead>
          <tr>
            <th style="padding:4px 6px;background:#1e3a5f;color:#fff;"></th>
            ${cols.map(c => `<th style="padding:4px 6px;background:#1e3a5f;color:#fff;text-align:center;">${c}</th>`).join('')}
            <th style="padding:4px 6px;background:#1e3a5f;color:#fff;"></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td style="padding:4px 6px;background:#1e3a5f;color:#fff;font-weight:bold;text-align:center;">${row}</td>
              ${cols.map(col => {
                const a = seatMap[buildSeatKey(row, col)];
                const bg  = a?.SeatStatus === 'Allocated' ? '#ef4444' : a?.SeatStatus === 'Blocked' ? '#f59e0b' : '#e5e7eb';
                const txt = a?.SeatStatus === 'Allocated' ? (a.FullName || a.AccNo) : a?.SeatStatus === 'Blocked' ? 'BLOCKED' : '';
                return `<td style="padding:3px 5px;background:${bg};border:1px solid #ccc;min-width:60px;text-align:center;font-size:9px;">${txt}</td>`;
              }).join('')}
              <td style="padding:4px 6px;background:#1e3a5f;color:#fff;font-weight:bold;text-align:center;">${row}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    const hall = halls.find(h => String(h.ID) === String(filterHallId));
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Seating Layout — ${hall?.HallName || ''} ${activeSec.SectionName}</title>
      <style>@media print{body{margin:10mm}}</style></head>
      <body>
        <h2 style="font-family:sans-serif;margin-bottom:4px;">${hall?.HallName || ''} — ${activeSec.SectionName}</h2>
        <p style="font-family:sans-serif;font-size:11px;margin-bottom:12px;">
          Event: ${filterEventType || '—'} &nbsp;|&nbsp; Year: ${filterYear || '—'} &nbsp;|&nbsp;
          Total: ${stats.total} &nbsp;|&nbsp; Allocated: ${stats.allocated} &nbsp;|&nbsp; Available: ${stats.available} &nbsp;|&nbsp; Blocked: ${stats.blocked}
        </p>
        ${gridHtml}
        <br/>
        <p style="font-family:sans-serif;font-size:10px;color:#888;">
          ■ <span style="color:#ef4444">Red</span> = Allocated &nbsp;&nbsp;
          ■ <span style="color:#f59e0b">Yellow</span> = Blocked &nbsp;&nbsp;
          ■ <span style="color:#9ca3af">Gray</span> = Available
        </p>
        <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>`);
    w.document.close();
  };

  // ── Export Excel ──────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (!activeSec) { toast.error('Load a seat grid first'); return; }
    const rows = Array.from({ length: activeSec.RowCount }, (_, i) => getRowLabel(i));
    const cols = Array.from({ length: activeSec.ColCount }, (_, i) => i + 1);

    const header = ['Row / Col', ...cols.map(String)];
    const dataRows = rows.map(row => [
      row,
      ...cols.map(col => {
        const a = seatMap[buildSeatKey(row, col)];
        if (!a) return '';
        return a.SeatStatus === 'Allocated' ? (a.FullName || a.AccNo) : 'BLOCKED';
      }),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
    const wb = XLSX.utils.book_new();
    const hall = halls.find(h => String(h.ID) === String(filterHallId));
    XLSX.utils.book_append_sheet(wb, ws, activeSec.SectionName.slice(0, 31));
    XLSX.writeFile(wb, `seating_${hall?.HallName || 'hall'}_${activeSec.SectionName}_${filterYear || 'all'}.xlsx`);
  };

  // ── Filter change handlers (with side-effect resets) ──────────────────────────

  const handleHallChange = (hallId) => {
    setFilterHallId(hallId);
    setFilterSectionId('');
    setActiveSec(null);
    setSeatMap({});
  };

  const handleSectionChange = (sectionId) => {
    setFilterSectionId(sectionId);
    setActiveSec(null);
    setSeatMap({});
    setVoidMap({});
  };

  // ── Block range ───────────────────────────────────────────────────────────────

  const doBlockRange = async ({ RowFrom, RowTo, ColFrom, ColTo, Remark }) => {
    try {
      await hallService.blockSeatRange({
        SectionID: filterSectionId, EventType: filterEventType || null, ForYear: filterYear || null,
        RowFrom, RowTo, ColFrom, ColTo, Remark,
      });
      toast.success('Seat range blocked');
      loadGrid();
    } catch { toast.error('Failed to block seat range'); }
  };

  const closeAutoModal = () => { setAutoModal(false); setAutoPreview(null); setAutoMembers([]); };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface p-4">

      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-navy-900">Seating Layout</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage Masjid / Markaz venue layouts and seat allocations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-border w-fit shadow-sm">
        {[['booking', 'Seat Booking'], ['manager', 'Layout Manager']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === key ? 'bg-navy-800 text-white shadow' : 'text-gray-500 hover:text-navy-800'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ── Seat Booking tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'booking' && (
        <div className="space-y-4">
          <FilterBar
            filterEventType={filterEventType} setFilterEventType={setFilterEventType}
            filterYear={filterYear}           setFilterYear={setFilterYear}
            filterHallId={filterHallId}
            filterSectionId={filterSectionId}
            halls={halls}
            bookingSections={bookingSections}
            loadingGrid={loadingGrid}
            eventTypeOptions={lookups.EventType}
            yearOptions={lookups.Year || []}
            onSearch={loadGrid}
            onHallChange={handleHallChange}
            onSectionChange={handleSectionChange}
          />

          {activeSec && (
            <StatsActionBar
              stats={stats}
              onAutoAssign={() => setAutoModal(true)}
              onBlockRange={() => setBlockRangeModal(true)}
              onClearAll={doClearAll}
              onPrint={handlePrint}
              onExport={handleExport}
            />
          )}

          <SeatGrid activeSec={activeSec} seatMap={seatMap} voidMap={voidMap} onSeatClick={handleSeatClick} />
        </div>
      )}

      {/* ── Layout Manager tab ────────────────────────────────────────────────────── */}
      {activeTab === 'manager' && (
        <HallsTable
          halls={halls}
          loadingHalls={loadingHalls}
          expandedHall={expandedHall}
          sections={sections}
          onToggleExpand={toggleExpandHall}
          onAddHall={() => setHallModal({ open: true, mode: 'add', data: {} })}
          onEditHall={(hall) => setHallModal({ open: true, mode: 'edit', data: { ...hall } })}
          onDeleteHall={deleteHall}
          onAddSection={(hallId) => setSectionModal({ open: true, mode: 'add', data: {}, hallId })}
          onEditSection={(sec, hallId) => setSectionModal({ open: true, mode: 'edit', data: { ...sec }, hallId })}
          onDeleteSection={deleteSection}
          onVoidSeats={(sec) => setVoidModal({ open: true, section: sec })}
        />
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────────── */}
      <HallModal
        open={hallModal.open}
        mode={hallModal.mode}
        data={hallModal.data}
        onClose={() => setHallModal({ open: false, mode: 'add', data: {} })}
        onChange={(field, value) => setHallModal(p => ({ ...p, data: { ...p.data, [field]: value } }))}
        onSave={saveHall}
        venueTypeOptions={lookups.VenueType}
      />

      <SectionModal
        open={sectionModal.open}
        mode={sectionModal.mode}
        data={sectionModal.data}
        onClose={() => setSectionModal({ open: false, mode: 'add', data: {}, hallId: null })}
        onChange={(field, value) => setSectionModal(p => ({ ...p, data: { ...p.data, [field]: value } }))}
        onSave={saveSection}
        sectionTypeOptions={lookups.SectionType}
        positionOptions={lookups.Position}
      />

      <SeatClickModal
        open={seatModal.open}
        row={seatModal.row}
        col={seatModal.col}
        alloc={seatModal.alloc}
        onClose={() => setSeatModal({ open: false, row: '', col: '', alloc: null })}
        memberQuery={memberQuery}     setMemberQuery={setMemberQuery}
        memberResults={memberResults}
        searchingMembers={searchingMembers}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        setMemberResults={setMemberResults}
        blockRemark={blockRemark}     setBlockRemark={setBlockRemark}
        onAllocate={doAllocate}
        onBlock={doBlock}
        onClear={doClear}
      />

      <AutoAssignModal
        open={autoModal}
        onClose={closeAutoModal}
        autoPreview={autoPreview}
        autoMembers={autoMembers}
        loadingAuto={loadingAuto}
        stats={stats}
        onFetchMembers={fetchAutoMembers}
        onPreview={generateAutoPreview}
        onClearPreview={() => setAutoPreview(null)}
        onConfirm={confirmAutoAssign}
      />

      <BlockRangeModal
        open={blockRangeModal}
        activeSec={activeSec}
        onClose={() => setBlockRangeModal(false)}
        onConfirm={doBlockRange}
      />

      <VoidSeatsModal
        open={voidModal.open}
        section={voidModal.section}
        onClose={() => setVoidModal({ open: false, section: null })}
        onSaved={() => { if (activeSec && String(activeSec.ID) === String(voidModal.section?.ID)) loadGrid(); }}
      />
    </div>
  );
}
