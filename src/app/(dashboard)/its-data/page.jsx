'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { itsService, memberService } from '@/services';
import {
  SearchIcon, XIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon, SendIcon,
} from '@/components/shared/Icons';
import PaginationBar     from './_components/PaginationBar';
import PrefixRadio       from './_components/PrefixRadio';
import TypeBadge         from './_components/TypeBadge';
import AutocompleteInput from './_components/AutocompleteInput';
import WAReminderModal   from '../mumin-search/components/WAReminderModal';
import WABulkModal       from '../mumin-search/components/WABulkModal';
import WAQueuePanel      from '../takhmeen-not-done/components/WAQueuePanel';

// ── Constants ────────────────────────────────────────────────────────────────

const INIT_FILTERS = {
  itsIds:        '',
  namePrefix:    'None',
  firstName:     '',
  surname:       '',
  fatherPrefix:  'None',
  fatherName:    '',
  fatherSurname: '',
  husbandPrefix: 'None',
  husbandName:   '',
  motherName:    '',
  gender:        'Both',
  ageMin:        '',
  ageMax:        '',
  misaq:         '',
  maritalStatus: '',
  bloodGroup:    '',
  quranSanad:    '',
  title:         '',
  hofType:       '',
  hofId:         '',
  sector:        '',
  subSector:     '',
};

const PAGE_SIZE_OPTIONS = [
  { label: '50',    value: 50   },
  { label: '100',   value: 100  },
  { label: '500',   value: 500  },
  { label: '1 000', value: 1000 },
  { label: 'All',   value: 0    },
];

const EXPORT_COLS = [
  { key: 'ITS_ID',                   label: 'ITS ID' },
  { key: 'HOF_ID',                   label: 'HOF ID' },
  { key: 'HOF_FM_TYPE',              label: 'Type' },
  { key: 'Full_Name',                label: 'Full Name' },
  { key: 'Full_Name_Arabic',         label: 'Full Name (Arabic)' },
  { key: 'First_Prefix',             label: 'Prefix' },
  { key: 'First_Name',               label: 'First Name' },
  { key: 'Surname',                  label: 'Surname' },
  { key: 'Father_Prefix',            label: 'Father Prefix' },
  { key: 'Father_Name',              label: 'Father Name' },
  { key: 'Father_Surname',           label: 'Father Surname' },
  { key: 'Husband_Prefix',           label: 'Husband Prefix' },
  { key: 'Husband_Name',             label: 'Husband Name' },
  { key: 'Age',                      label: 'Age' },
  { key: 'Gender',                   label: 'Gender' },
  { key: 'Misaq',                    label: 'Misaq' },
  { key: 'Marital_Status',           label: 'Marital Status' },
  { key: 'Blood_Group',              label: 'Blood Group' },
  { key: 'Title',                    label: 'Title' },
  { key: 'Mobile',                   label: 'Mobile' },
  { key: 'WhatsApp_No',              label: 'WhatsApp' },
  { key: 'Email',                    label: 'Email' },
  { key: 'Quran_Sanad',              label: 'Quran Sanad' },
  { key: 'Karbala_Ziyarat',          label: 'Karbala Ziyarat' },
  { key: 'Raudat_Tahera_Ziyarat',    label: 'Raudat Tahera' },
  { key: 'Ashara_Mubaraka',          label: 'Ashara Mubaraka' },
  { key: 'Qualification',            label: 'Qualification' },
  { key: 'Occupation',               label: 'Occupation' },
  { key: 'Sub_Occupation',           label: 'Sub Occupation' },
  { key: 'Organisation',             label: 'Organisation' },
  { key: 'Idara',                    label: 'Idara' },
  { key: 'Category',                 label: 'Category' },
  { key: 'Vatan',                    label: 'Vatan' },
  { key: 'Nationality',              label: 'Nationality' },
  { key: 'Jamaat',                   label: 'Jamaat' },
  { key: 'Date_Of_Nikah',            label: 'Date of Nikah' },
  { key: 'Sector',                   label: 'Sector' },
  { key: 'Sub_Sector',               label: 'Sub Sector' },
  { key: 'Address',                  label: 'Address' },
  { key: 'City',                     label: 'City' },
  { key: 'State',                    label: 'State' },
  { key: 'Pincode',                  label: 'Pincode' },
  { key: 'Data_Verification_Status', label: 'Data Verified' },
  { key: 'Photo_Verification_Status',label: 'Photo Verified' },
  { key: 'Last_Scanned_Event',       label: 'Last Scanned Event' },
  { key: 'Last_Scanned_Place',       label: 'Last Scanned Place' },
  { key: 'Inactive_Status',          label: 'Inactive Status' },
  { key: 'TanzeemFile_No',           label: 'Tanzeem File No.' },
];

const v = (row, key) => row?.[key] ?? '';

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ITSDataPage() {
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);

  const [filters,       setFilters]       = useState(INIT_FILTERS);
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searched,      setSearched]      = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [pageSize,      setPageSize]      = useState(100);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [showExport,    setShowExport]    = useState(false);
  const [exportPos,     setExportPos]     = useState({});
  const [searchSummary, setSearchSummary] = useState('');

  // ── WhatsApp state ──────────────────────────────────────────────────────────
  const [selectedItsIds, setSelectedItsIds] = useState(new Set());
  const [waReminderRow,  setWaReminderRow]  = useState(null);
  const [waBulkRows,     setWaBulkRows]     = useState([]);
  const [waBulkOpen,     setWaBulkOpen]     = useState(false);

  // Autocomplete lookup data
  const [mohallaRows, setMohallaRows] = useState([]);
  const [quranSanads, setQuranSanads] = useState([]);
  const [titles,      setTitles]      = useState([]);

  const setF = useCallback((k, val) => setFilters(p => ({ ...p, [k]: val })), []);

  // Load lookup data on mount
  useEffect(() => {
    memberService.loadMohallaDetails({ Sector: '', Subsector: '', MohallaDescription: '' })
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
          : res.data?.recordset ?? res.data?.recordsets?.[0] ?? [];
        setMohallaRows(raw);
      })
      .catch(() => {});

    itsService.getDistincts()
      .then(res => {
        const d = res.data ?? {};
        setQuranSanads(Array.isArray(d.quranSanads) ? d.quranSanads : []);
        setTitles(Array.isArray(d.titles) ? d.titles : []);
      })
      .catch(() => {});
  }, []);

  // Sector suggestions from mohalla table
  const sectorSuggestions = useMemo(() =>
    [...new Set(mohallaRows.map(r => String(r.Sector ?? r.sector ?? '').trim()).filter(Boolean))].sort(),
    [mohallaRows]
  );

  // Sub Sector suggestions: {label: "B4 - Mohalla Name", value: "B4"}
  const subSectorSuggestions = useMemo(() => {
    const seen = new Set();
    return mohallaRows
      .filter(r => !filters.sector || String(r.Sector ?? r.sector ?? '').trim() === filters.sector)
      .reduce((acc, r) => {
        const code = String(r.Subsector ?? r.subsector ?? '').trim();
        const desc = String(r.MohallaDescription ?? r.SubsectorName ?? '').trim();
        if (code && !seen.has(code)) {
          seen.add(code);
          acc.push({ label: desc ? `${code} - ${desc}` : code, value: code });
        }
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [mohallaRows, filters.sector]);

  // ── Search ──────────────────────────────────────────────────────────────────

  const buildPayload = useCallback((f) => ({
    ITSIDs:        f.itsIds,
    NamePrefix:    f.namePrefix,
    FirstName:     f.firstName,
    Surname:       f.surname,
    FatherPrefix:  f.fatherPrefix,
    FatherName:    f.fatherName,
    FatherSurname: f.fatherSurname,
    HusbandPrefix: f.husbandPrefix,
    HusbandName:   f.husbandName,
    MotherName:    f.motherName,
    Gender:        f.gender,
    AgeMin:        f.ageMin,
    AgeMax:        f.ageMax,
    Misaq:         f.misaq,
    MaritalStatus: f.maritalStatus,
    BloodGroup:    f.bloodGroup,
    QuranSanad:    f.quranSanad,
    Title:         f.title,
    HOFType:       f.hofType,
    HOF_ID:        f.hofId,
    Sector:        f.sector,
    SubSector:     f.subSector,
  }), []);

  const buildSummary = (f) => {
    const parts = [];
    if (f.itsIds)        parts.push(`ITS IDs: ${f.itsIds.replace(/\s*[\n,;]\s*/g, ', ')}`);
    if (f.hofId)         parts.push(`HOF ID: ${f.hofId}`);
    if (f.firstName)     parts.push(`Name: ${f.namePrefix !== 'None' ? f.namePrefix + ' ' : ''}${f.firstName}`);
    if (f.surname)       parts.push(`Surname: ${f.surname}`);
    if (f.fatherName)    parts.push(`Father: ${f.fatherPrefix !== 'None' ? f.fatherPrefix + ' ' : ''}${f.fatherName}`);
    if (f.fatherSurname) parts.push(`Father Surname: ${f.fatherSurname}`);
    if (f.husbandName)   parts.push(`Husband: ${f.husbandPrefix !== 'None' ? f.husbandPrefix + ' ' : ''}${f.husbandName}`);
    if (f.motherName)    parts.push(`Mother: ${f.motherName}`);
    if (f.gender && f.gender !== 'Both') parts.push(`Gender: ${f.gender}`);
    if (f.ageMin || f.ageMax) parts.push(`Age: ${f.ageMin || '—'}–${f.ageMax || '—'}`);
    if (f.misaq)         parts.push(`Misaq: ${f.misaq}`);
    if (f.maritalStatus) parts.push(`Marital Status: ${f.maritalStatus}`);
    if (f.bloodGroup)    parts.push(`Blood Group: ${f.bloodGroup}`);
    if (f.quranSanad)    parts.push(`Quran Sanad: ${f.quranSanad}`);
    if (f.hofType)       parts.push(`Type: ${f.hofType}`);
    if (f.sector)        parts.push(`Sector: ${f.sector}`);
    if (f.subSector)     parts.push(`Sub Sector: ${f.subSector}`);
    if (f.title)         parts.push(`Title: ${f.title}`);
    return parts.length > 0 ? 'You Searched: ' + parts.join(' | ') : 'All Records';
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(false);
    const t0 = Date.now();
    try {
      const res  = await itsService.search(buildPayload(filters));
      const data = res.data?.data ?? res.data ?? [];
      setResults(Array.isArray(data) ? data : []);
      setElapsed(((Date.now() - t0) / 1000).toFixed(2));
      setSearchSummary(buildSummary(filters));
      setSearched(true);
      setCurrentPage(1);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, buildPayload]);

  const handleClear = useCallback(() => {
    setFilters(INIT_FILTERS);
    setResults([]);
    setSearched(false);
    setSearchSummary('');
  }, []);

  useEffect(() => { setCurrentPage(1); }, [results, pageSize]);

  // Export dropdown close on outside click
  useEffect(() => {
    const h = (e) => {
      if (
        exportBtnRef.current  && !exportBtnRef.current.contains(e.target) &&
        exportMenuRef.current && !exportMenuRef.current.contains(e.target)
      ) setShowExport(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Pagination ──────────────────────────────────────────────────────────────

  const effectiveSize = pageSize === 0 ? (results.length || 1) : pageSize;
  const totalPages    = Math.max(1, Math.ceil(results.length / effectiveSize));
  const rowOffset     = (currentPage - 1) * effectiveSize;
  const pagedRows     = pageSize === 0 ? results : results.slice(rowOffset, rowOffset + effectiveSize);
  const pageStart     = results.length === 0 ? 0 : rowOffset + 1;
  const pageEnd       = Math.min(rowOffset + effectiveSize, results.length);

  // ── Export ──────────────────────────────────────────────────────────────────

  const exportLabel = `${results.length.toLocaleString()} records`;

  const toggleExport = () => {
    if (!showExport && exportBtnRef.current) {
      const rect = exportBtnRef.current.getBoundingClientRect();
      setExportPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    }
    setShowExport(p => !p);
  };

  const exportCSV = () => {
    const header = EXPORT_COLS.map(c => c.label).join(',');
    const body   = results.map(r => EXPORT_COLS.map(c => `"${String(v(r, c.key)).replace(/"/g, '""')}"`).join(','));
    download(new Blob([header + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'its-data.csv');
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...results.map(r => EXPORT_COLS.map(c => v(r, c.key))),
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'ITS Data');
    writeFile(wb, 'its-data.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('ITS Data', 14, 15);
    doc.setFontSize(9);
    doc.text(`${searchSummary} · ${exportLabel} · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   results.map(r => EXPORT_COLS.map(c => String(v(r, c.key) || '—'))),
      styles:             { fontSize: 5.5, cellPadding: 1.2 },
      headStyles:         { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save('its-data.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const cols = EXPORT_COLS.slice(0, 18);
    const bodyRows = results.map((r, i) =>
      `<tr><td>${i + 1}</td>${cols.map(c => `<td>${v(r, c.key) || '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>ITS Data</title><style>
      body{font-family:sans-serif;font-size:9px}h2{margin-bottom:4px}p{margin:0 0 10px;color:#666}
      table{width:100%;border-collapse:collapse}th{background:#0f2850;color:#fff;padding:3px 5px;text-align:left}
      td{padding:2px 5px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>ITS Data</h2>
      <p>${searchSummary} &nbsp;·&nbsp; ${exportLabel} &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB')}</p>
      <table><thead><tr><th>#</th>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${bodyRows}</tbody></table>
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  // ── Misc ────────────────────────────────────────────────────────────────────

  const openHOFProfile = (hofId) => {
    if (!hofId) return;
    window.open(`/mumin-details?accno=${hofId}`, '_blank');
  };

  const hasFilters = Object.keys(INIT_FILTERS).some(k => filters[k] !== INIT_FILTERS[k]);

  // ── WA helpers ──────────────────────────────────────────────────────────────

  const toWARow = useCallback((r) => ({
    name:        v(r, 'Full_Name')  || '—',
    mobile:      v(r, 'WhatsApp_No') || v(r, 'Mobile') || '',
    accno:       v(r, 'ITS_ID')    || '',
    sector:      v(r, 'Sector')    || '',
    sabeelType:  '',
    stayingIn:   '',
    thaliStatus: '',
  }), []);

  const isAllSelected = results.length > 0 && results.every(r => selectedItsIds.has(v(r, 'ITS_ID')));

  const toggleRow = useCallback((itsId) => {
    setSelectedItsIds(prev => {
      const next = new Set(prev);
      next.has(itsId) ? next.delete(itsId) : next.add(itsId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedItsIds(prev => {
      const allSel = results.every(r => prev.has(v(r, 'ITS_ID')));
      const next   = new Set(prev);
      if (allSel) results.forEach(r => next.delete(v(r, 'ITS_ID')));
      else        results.forEach(r => next.add(v(r, 'ITS_ID')));
      return next;
    });
  }, [results]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="ITS Data" subtitle="Search & manage ITS organisation records" />

      {/* ── Filter Card ─────────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-body space-y-3">

          {/* Row 1: ITS IDs + HOF ID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="form-label">ITS ID(s) <span className="text-gray-900 font-normal">(CSV format)</span></label>
              <textarea
                className="form-input !h-auto resize-y text-[12px] min-h-[100px]"
                rows={5}
                placeholder="e.g. 20303336, 30311101"
                value={filters.itsIds}
                onChange={e => setF('itsIds', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">HOF ID</label>
              <input type="text" className="form-input" placeholder="HOF ITS number"
                value={filters.hofId} onChange={e => setF('hofId', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Name + Surname */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Name</label>
              <div className="flex items-center gap-2">
                <PrefixRadio name="namePrefix" value={filters.namePrefix} onChange={val => setF('namePrefix', val)} />
                <input type="text" className="form-input flex-1" placeholder="First name"
                  value={filters.firstName} onChange={e => setF('firstName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Surname</label>
              <input type="text" className="form-input" placeholder="Surname"
                value={filters.surname} onChange={e => setF('surname', e.target.value)} />
            </div>
          </div>

          {/* Row 3: Father Name + Father Surname */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Father Name</label>
              <div className="flex items-center gap-2">
                <PrefixRadio name="fatherPrefix" value={filters.fatherPrefix} onChange={val => setF('fatherPrefix', val)} />
                <input type="text" className="form-input flex-1" placeholder="Father first name"
                  value={filters.fatherName} onChange={e => setF('fatherName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Father Surname</label>
              <input type="text" className="form-input" placeholder="Father surname"
                value={filters.fatherSurname} onChange={e => setF('fatherSurname', e.target.value)} />
            </div>
          </div>

          {/* Row 4: Husband Name + Mother Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Husband Name</label>
              <div className="flex items-center gap-2">
                <PrefixRadio name="husbandPrefix" value={filters.husbandPrefix} onChange={val => setF('husbandPrefix', val)} />
                <input type="text" className="form-input flex-1" placeholder="Husband first name"
                  value={filters.husbandName} onChange={e => setF('husbandName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Mother Name</label>
              <input type="text" className="form-input" placeholder="Mother full name (searches via ITS link)"
                value={filters.motherName} onChange={e => setF('motherName', e.target.value)} />
            </div>
          </div>

          {/* Row 5: Gender + Age + Misaq + HOF FM Type */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-1">
              <label className="form-label">Gender</label>
              <div className="flex items-center gap-3 mt-1">
                {['Both', 'Male', 'Female'].map(g => (
                  <label key={g} className="flex items-center gap-1 text-[12px] cursor-pointer select-none">
                    <input type="radio" name="gender" value={g}
                      checked={filters.gender === g}
                      onChange={() => setF('gender', g)}
                      className="cursor-pointer accent-blue-600"
                    />
                    <span className={filters.gender === g ? 'text-blue-700 font-medium' : 'text-gray-900'}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Age From</label>
              <input type="number" className="form-input" placeholder="Min"
                value={filters.ageMin} onChange={e => setF('ageMin', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Age To</label>
              <input type="number" className="form-input" placeholder="Max"
                value={filters.ageMax} onChange={e => setF('ageMax', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Misaq</label>
              <select className="form-select" value={filters.misaq} onChange={e => setF('misaq', e.target.value)}>
                <option value="">All</option>
                <option>Done</option>
                <option>Not Done</option>
              </select>
            </div>
            <div>
              <label className="form-label">HOF FM Type</label>
              <select className="form-select" value={filters.hofType} onChange={e => setF('hofType', e.target.value)}>
                <option value="">All</option>
                <option value="HOF">HOF</option>
                <option value="FM">FM</option>
              </select>
            </div>
          </div>

          {/* Row 6: Marital Status + Blood Group + Quran Sanad + Title */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Marital Status</label>
              <select className="form-select" value={filters.maritalStatus} onChange={e => setF('maritalStatus', e.target.value)}>
                <option value="">All</option>
                <option>Married</option>
                <option>Single</option>
                <option>Widowed</option>
                <option>Divorced</option>
              </select>
            </div>
            <div>
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={filters.bloodGroup} onChange={e => setF('bloodGroup', e.target.value)}>
                <option value="">All</option>
                {['A +ve','A -ve','B +ve','B -ve','O +ve','O -ve','AB +ve','AB -ve'].map(bg => (
                  <option key={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Quran Sanad</label>
              <AutocompleteInput
                value={filters.quranSanad}
                onChange={val => setF('quranSanad', val)}
                suggestions={quranSanads}
                placeholder="e.g. Marhala Ula"
              />
            </div>
            <div>
              <label className="form-label">Title</label>
              <AutocompleteInput
                value={filters.title}
                onChange={val => setF('title', val)}
                suggestions={titles}
                placeholder="Title"
              />
            </div>
          </div>

          {/* Row 7: Sector + Sub Sector (Mohalla) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Sector</label>
              <AutocompleteInput
                value={filters.sector}
                onChange={val => setFilters(p => ({ ...p, sector: val, subSector: '' }))}
                suggestions={sectorSuggestions}
                placeholder="e.g. Burhani Masjid"
              />
            </div>
            <div>
              <label className="form-label">Sub Sector (Mohalla)</label>
              <AutocompleteInput
                value={filters.subSector}
                onChange={val => setF('subSector', val)}
                suggestions={subSectorSuggestions}
                placeholder="e.g. B4"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching…' : <><SearchIcon className="w-3.5 h-3.5 mr-1.5" />Search</>}
            </button>
            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={handleClear}>
                <XIcon className="w-3.5 h-3.5 mr-1.5" />Clear All
              </button>
            )}
            <button
              ref={exportBtnRef}
              className="btn btn-secondary btn-sm"
              onClick={toggleExport}
              disabled={results.length === 0}
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11.5px] text-gray-900 whitespace-nowrap">Rows per page:</span>
              <select className="form-select !py-1 !text-[12px] !w-auto" value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}>
                {PAGE_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {searched && (
              <span className="text-[12px] font-medium text-navy-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
                {results.length.toLocaleString()} records
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Export Dropdown Portal ───────────────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        showExport && (
          <div
            ref={exportMenuRef}
            style={{ position: 'fixed', ...exportPos, zIndex: 9999, background: '#fff',
              border: '1px solid var(--border,#e2e8f0)', borderRadius: '0.5rem',
              boxShadow: '0 8px 20px rgba(0,0,0,0.13)' }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold text-gray-900 uppercase tracking-wider border-b border-border">
              Export {exportLabel}
            </div>
            {[
              { icon: BarChartIcon,  label: 'Excel (.xlsx)', action: exportExcel },
              { icon: FileTextIcon,  label: 'CSV (.csv)',    action: exportCSV   },
              { icon: DownloadIcon,  label: 'PDF (.pdf)',    action: exportPDF   },
              { icon: PrintIcon,     label: 'Print',         action: printList   },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action}
                className="w-full text-left px-4 py-2 text-[12.5px] hover:bg-blue-500/[0.08] flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-500" />{label}
              </button>
            ))}
          </div>
        ),
        document.body
      )}

      {/* ── WhatsApp queue status panel ─────────────────────────────────────── */}
      <WAQueuePanel />

      {/* ── WhatsApp bulk action bar ─────────────────────────────────────────── */}
      {searched && results.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11.5px] text-gray-500">
            {selectedItsIds.size > 0
              ? `${selectedItsIds.size} selected`
              : 'Select rows for bulk message'}
          </span>
          <button
            className="btn btn-sm bg-green-600 text-white border-green-600 hover:bg-green-700"
            disabled={selectedItsIds.size === 0}
            onClick={() => {
              setWaBulkRows(results.filter(r => selectedItsIds.has(v(r, 'ITS_ID'))).map(toWARow));
              setWaBulkOpen(true);
            }}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            Send Selected ({selectedItsIds.size})
          </button>
          <button
            className="btn btn-sm bg-green-700 text-white border-green-700 hover:bg-green-800"
            onClick={() => {
              setWaBulkRows(results.map(toWARow));
              setWaBulkOpen(true);
            }}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            Send All ({results.length})
          </button>
          {selectedItsIds.size > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedItsIds(new Set())}>
              <XIcon className="w-3 h-3 mr-1" />Clear
            </button>
          )}
        </div>
      )}

      {/* ── Search Status ────────────────────────────────────────────────────── */}
      {searched && (
        <div className="text-[12px] text-gray-900 mb-3 px-1 space-y-0.5">
          <div className="text-[11.5px] font-medium text-navy-700">{searchSummary}</div>
          <div>
            About <span className="font-semibold text-navy-800">{results.length.toLocaleString()}</span> results in{' '}
            <span className="font-semibold text-blue-600">{elapsed}s</span>
          </div>
        </div>
      )}

      {/* ── Results Table ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="th-navy px-2 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="cursor-pointer"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  />
                </th>
                {[
                  'Sr', 'ITS ID', 'HOF ID', 'Type', 'Full Name', 'Full Name (AR)',
                  'Prefix', 'First Name', 'Surname',
                  'Father Prefix', 'Father Name', 'Father Surname',
                  'Husband Prefix', 'Husband Name',
                  'Age', 'Gender', 'Misaq', 'Marital Status', 'Blood Group',
                  'Title', 'Mobile', 'WhatsApp', 'Email',
                  'Quran Sanad', 'Karbala', 'Ashara',
                  'Qualification', 'Occupation', 'Organisation', 'Idara', 'Category',
                  'Vatan', 'Nationality', 'Sector', 'Sub Sector',
                  'City', 'State', 'Data Verified', 'Tanzeem File No.',
                ].map(h => <th key={h} className="th-navy whitespace-nowrap">{h}</th>)}
                <th className="th-navy px-2 w-8" title="Send WhatsApp message">WA</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr>
                  <td colSpan={41} className="text-center py-16 text-gray-900">
                    Enter filters above and click <strong>Search</strong>
                  </td>
                </tr>
              ) : loading ? (
                <tr><td colSpan={41} className="text-center py-16 text-gray-900">Searching…</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={41} className="text-center py-16 text-gray-900">No records found</td></tr>
              ) : pagedRows.map((r, i) => (
                <tr key={v(r, 'ITS_ID') + '-' + (rowOffset + i)} className={selectedItsIds.has(v(r, 'ITS_ID')) ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-blue-500/[0.025]'}>
                  <td className="px-2 py-2 border-t border-border text-center">
                    <input
                      type="checkbox"
                      checked={selectedItsIds.has(v(r, 'ITS_ID'))}
                      onChange={() => toggleRow(v(r, 'ITS_ID'))}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 border-t border-border text-gray-900">{rowOffset + i + 1}</td>
                  <td className="px-3 py-2 border-t border-border font-semibold text-navy-800">{v(r, 'ITS_ID') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">
                    {v(r, 'HOF_ID') ? (
                      <button
                        className="text-blue-600 font-semibold hover:underline"
                        onClick={() => openHOFProfile(v(r, 'HOF_ID'))}
                        title="Open HOF profile in new tab"
                      >
                        {v(r, 'HOF_ID')}
                      </button>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 border-t border-border"><TypeBadge type={v(r, 'HOF_FM_TYPE')} /></td>
                  <td className="px-3 py-2 border-t border-border font-medium min-w-[160px]">{v(r, 'Full_Name') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[13px] text-gray-900 min-w-[160px] font-alkanz">{v(r, 'Full_Name_Arabic') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'First_Prefix')  || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'First_Name')    || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Surname')        || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Father_Prefix')  || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Father_Name')    || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Father_Surname') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Husband_Prefix') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Husband_Name')   || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-center">{v(r, 'Age') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">
                    <span className={`text-[11px] font-medium ${v(r,'Gender')==='Male' ? 'text-blue-600' : v(r,'Gender')==='Female' ? 'text-pink-600' : 'text-gray-900'}`}>
                      {v(r, 'Gender') || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-t border-border">
                    <span className={`text-[11px] font-medium ${v(r,'Misaq')==='Done' ? 'text-green-700' : v(r,'Misaq')==='Not Done' ? 'text-orange-500' : 'text-gray-900'}`}>
                      {v(r, 'Misaq') || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Marital_Status') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Blood_Group')     || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Title')           || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Mobile')          || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'WhatsApp_No')     || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[11px]">{v(r, 'Email') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Quran_Sanad')     || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-center">{v(r, 'Karbala_Ziyarat')  || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[11px] max-w-[140px] truncate">{v(r, 'Ashara_Mubaraka') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Qualification')   || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Occupation')      || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[11px] max-w-[150px] truncate">{v(r, 'Organisation') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[11px] max-w-[140px] truncate">{v(r, 'Idara')        || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Category')        || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Vatan')           || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Nationality')     || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Sector')          || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'Sub_Sector')      || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'City')            || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'State')           || '—'}</td>
                  <td className="px-3 py-2 border-t border-border text-[11px]">{v(r, 'Data_Verification_Status') || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{v(r, 'TanzeemFile_No')  || '—'}</td>
                  <td className="px-2 py-2 border-t border-border text-center">
                    <button
                      title={`Send message to ${v(r, 'Full_Name')}`}
                      onClick={() => setWaReminderRow(toWARow(r))}
                      className="inline-flex items-center justify-center w-6 h-6 rounded text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length > 0 && (
          <div className="border-t border-border px-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <span className="text-[11.5px] text-gray-900">
                Showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {results.length.toLocaleString()} records
              </span>
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
            </div>
          </div>
        )}
      </div>

      {/* ── WhatsApp modals ───────────────────────────────────────────────────── */}
      <WAReminderModal
        open={!!waReminderRow}
        onClose={() => setWaReminderRow(null)}
        row={waReminderRow}
      />
      <WABulkModal
        open={waBulkOpen}
        onClose={() => setWaBulkOpen(false)}
        rows={waBulkRows}
        batchLabel="ITS Data"
      />
    </div>
  );
}
