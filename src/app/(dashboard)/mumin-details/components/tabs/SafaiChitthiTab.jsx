'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { safaiService } from '@/services';
import Modal from '@/components/shared/Modal';
import { EditIcon, PrintIcon, TrashIcon, CheckIcon, RefreshIcon } from '@/components/shared/Icons';
import AddSafaiChitthiModal  from '../modals/AddSafaiChitthiModal';
import EditSafaiChitthiModal from '../modals/EditSafaiChitthiModal';

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const EMPTY = {
  RequestDate: todayStr(), EventDate: '', HijriDate: '', RazaStatus: 'Raza Pending',
  Razafor: '', Place: '', EventTime: '', Thaal: '', Remark: '',
  Mobile: '', Mobile1: '', Address: '', FullName: '', ITSNo: '',
  Requestby: '', Createdby: '',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const toInput = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().split('T')[0]; } catch { return ''; }
};

function statusBadge(status) {
  if (status === 'Raza Done')     return 'bg-green-600 text-white';
  if (status === 'Raza Approved') return 'bg-green-600 text-white';
  if (status === 'Raza Rejected') return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

function parseList(raw) {
  const payload = raw?.data ?? raw;
  const arr = Array.isArray(payload)                  ? payload
            : Array.isArray(payload?.data)            ? payload.data
            : Array.isArray(payload?.recordset)       ? payload.recordset
            : Array.isArray(payload?.recordsets?.[0]) ? payload.recordsets[0]
            : [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    const val = item?.Value ?? item?.value ?? item?.Name ?? item?.name
              ?? item?.Razafor ?? item?.Place ?? item?.EventTime
              ?? Object.values(item).find(v => v !== null && typeof v === 'string');
    return String(val ?? '').trim();
  }).filter(Boolean);
}

function ActionBtn({ label, onClick, className, children, disabled }) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors disabled:opacity-40 ${className || 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}
    >
      {children}
    </button>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────────
export default function SafaiChitthiTab({ member, onCountChange }) {
  const accNo = member?.accno || member?.AccNo || '';
  const { user } = useAuth();

  const [rows,          setRows]          = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [pageSize,      setPageSize]      = useState(20);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [addModal,      setAddModal]      = useState(false);
  const [editModal,     setEditModal]     = useState(false);
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [approveModal,  setApproveModal]  = useState(false);
  const [revertModal,   setRevertModal]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [approving,     setApproving]     = useState(false);
  const [reverting,     setReverting]     = useState(false);
  const [form,          setForm]          = useState({ ...EMPTY });
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [revertTarget,  setRevertTarget]  = useState(null);
  const [allRazafor,    setAllRazafor]    = useState([]);
  const [allPlace,      setAllPlace]      = useState([]);
  const [allTime,       setAllTime]       = useState([]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.allSettled([
      safaiService.loadRazaDropdownDetails({ Razafor:   'All' }),
      safaiService.loadRazaDropdownDetails({ Place:     'All' }),
      safaiService.loadRazaDropdownDetails({ EventTime: 'All' }),
    ]).then(([rfRes, plRes, tmRes]) => {
      if (rfRes.status === 'fulfilled') setAllRazafor(parseList(rfRes.value.data));
      if (plRes.status === 'fulfilled') setAllPlace(parseList(plRes.value.data));
      if (tmRes.status === 'fulfilled') setAllTime(parseList(tmRes.value.data));
    });
  }, []);

  const razaOpts  = useMemo(() => {
    const mine = [...new Set(rows.map(r => r.Razafor).filter(Boolean))];
    return [...mine, ...allRazafor.filter(v => !mine.includes(v))];
  }, [rows, allRazafor]);

  const placeOpts = useMemo(() => {
    const mine = [...new Set(rows.map(r => r.Place).filter(Boolean))];
    return [...mine, ...allPlace.filter(v => !mine.includes(v))];
  }, [rows, allPlace]);

  const timeOpts  = useMemo(() => {
    const mine = [...new Set(rows.map(r => r.EventTime).filter(Boolean))];
    return [...mine, ...allTime.filter(v => !mine.includes(v))];
  }, [rows, allTime]);

  useEffect(() => { onCountChange?.(rows.length); }, [rows.length, onCountChange]);

  const load = useCallback(async () => {
    if (!accNo) return;
    setLoading(true);
    try {
      const res     = await safaiService.loadRazaDetails({ AccNo: accNo });
      const payload = res.data;
      const arr = Array.isArray(payload)            ? payload
                : Array.isArray(payload?.data)      ? payload.data
                : Array.isArray(payload?.recordset) ? payload.recordset
                : (payload?.recordsets?.[0] ?? []);
      setRows(arr);
    } catch { toast.error('Failed to load Raza details'); }
    finally  { setLoading(false); }
  }, [accNo]);

  useEffect(() => { load(); }, [load]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({
      ...EMPTY,
      FullName:  member?.FullName  || member?.name   || '',
      Mobile:    member?.Mobile    || member?.mobile  || '',
      Mobile1:   member?.Mobile1   || member?.mobile1 || '',
      ITSNo:     member?.ITSNo     || member?.itsNo   || member?.itsno || '',
      Address:   member?.Address   || member?.address || member?.mohallah || '',
      Createdby: user?.username || '',
    });
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!form.EventDate) { toast.error('Event Date is required'); return; }
    if (!form.Razafor)   { toast.error('Raza For is required');   return; }
    setSaving(true);
    try {
      await safaiService.addRazaDetails({ AccNo: accNo, ...form });
      toast.success('Raza added');
      setAddModal(false);
      load();
    } catch { toast.error('Failed to add Raza'); }
    finally { setSaving(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      RequestDate: toInput(row.RequestDate) || todayStr(),
      EventDate:   toInput(row.EventDate)   || '',
      HijriDate:   row.HijriDate   || '',
      RazaStatus:  row.RazaStatus  || 'Raza Pending',
      Razafor:     row.Razafor     || '',
      Place:       row.Place       || '',
      EventTime:   row.EventTime   || '',
      Thaal:       row.Thaal       || '',
      Remark:      row.Remark      || '',
      Mobile:      row.Mobile      || '',
      Mobile1:     row.Mobile1     || '',
      Address:     row.Address     || '',
      FullName:    row.FullName    || '',
      ITSNo:       row.ITSNo       || '',
      Requestby:   row.Requestby   || '',
      Createdby:   row.Createdby   || '',
    });
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!form.EventDate) { toast.error('Event Date is required'); return; }
    if (!form.Razafor)   { toast.error('Raza For is required');   return; }
    setSaving(true);
    try {
      await safaiService.updateRazaDetails({
        ID:         editTarget.ID,
        Mobile:     form.Mobile,
        Mobile1:    form.Mobile1,
        Address:    form.Address,
        Razafor:    form.Razafor,
        EventDate:  form.EventDate,
        HijriDate:  form.HijriDate,
        Place:      form.Place,
        EventTime:  form.EventTime,
        Thaal:      form.Thaal,
        Remark:     form.Remark,
        RazaStatus: form.RazaStatus,
      });
      toast.success('Raza updated');
      setEditModal(false);
      load();
    } catch { toast.error('Failed to update Raza'); }
    finally { setSaving(false); }
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const openApprove = (row) => { setApproveTarget(row); setApproveModal(true); };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await safaiService.updateRazaDetails({
        ID:         approveTarget.ID,
        Mobile:     approveTarget.Mobile     || '',
        Mobile1:    approveTarget.Mobile1    || '',
        Address:    approveTarget.Address    || '',
        Razafor:    approveTarget.Razafor    || '',
        EventDate:  toInput(approveTarget.EventDate),
        HijriDate:  approveTarget.HijriDate  || '',
        Place:      approveTarget.Place      || '',
        EventTime:  approveTarget.EventTime  || '',
        Thaal:      approveTarget.Thaal      || '',
        Remark:     approveTarget.Remark     || '',
        RazaStatus: 'Raza Done',
      });
      toast.success('Raza approved');
      setApproveModal(false);
      load();
    } catch { toast.error('Failed to approve Raza'); }
    finally { setApproving(false); }
  };

  // ── Revert to Pending ──────────────────────────────────────────────────────
  const openRevert = (row) => { setRevertTarget(row); setRevertModal(true); };

  const handleRevert = async () => {
    setReverting(true);
    try {
      await safaiService.updateRazaDetails({
        ID:         revertTarget.ID,
        Mobile:     revertTarget.Mobile     || '',
        Mobile1:    revertTarget.Mobile1    || '',
        Address:    revertTarget.Address    || '',
        Razafor:    revertTarget.Razafor    || '',
        EventDate:  toInput(revertTarget.EventDate),
        HijriDate:  revertTarget.HijriDate  || '',
        Place:      revertTarget.Place      || '',
        EventTime:  revertTarget.EventTime  || '',
        Thaal:      revertTarget.Thaal      || '',
        Remark:     revertTarget.Remark     || '',
        RazaStatus: 'Raza Pending',
      });
      toast.success('Reverted to Raza Pending');
      setRevertModal(false);
      load();
    } catch { toast.error('Failed to revert Raza'); }
    finally { setReverting(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDelete = (row) => { setDeleteTarget(row); setDeleteModal(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await safaiService.deleteRazaDetails({ ID: deleteTarget.ID });
      toast.success('Raza deleted');
      setDeleteModal(false);
      load();
    } catch { toast.error('Failed to delete Raza'); }
    finally { setDeleting(false); }
  };

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(rows.length / pageSize);
  const paginatedRows = pageSize === 'All'
    ? rows
    : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const COLS = [
    'Action', 'Serial No', 'Request Date', 'Full Name', 'Mobile', 'Mobile1',
    'ITS No', 'Address', 'Event Date', 'Hijri Date', 'Raza for', 'Place',
    'Event Time', 'Thaal', 'Remark', 'Raza Status', 'Request by', 'Created by',
  ];

  return (
    <div className="p-4">
      <style>{`
        @font-face{font-family:'AL-KANZ';src:url('/fonts/AL-KANZ.ttf') format('truetype');font-display:swap}
        .safai-scroll::-webkit-scrollbar{height:4px}
        .safai-scroll:hover::-webkit-scrollbar{height:8px}
        .safai-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:4px}
        .safai-scroll::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:4px}
        .safai-scroll:hover::-webkit-scrollbar-thumb{background:#334155}
      `}</style>

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Raza requests for this member</span>
          {!loading && (
            <span className="text-[12px] font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
              {rows.length} record{rows.length !== 1 ? 's' : ''}
            </span>
          )}
          <select
            className="form-input py-1 text-[12px] w-[80px]"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
          >
            {[20, 50, 100, 200, 500, 1000, 'All'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Raza</button>
      </div>

      <div className="rounded-lg overflow-hidden border border-border overflow-x-auto safai-scroll">
        <table className="w-full border-collapse text-[12px] whitespace-nowrap">
          <thead>
            <tr>{COLS.map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length} className="text-center py-8 text-gray-400">No Raza records found</td></tr>
            ) : paginatedRows.map((r, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-2 py-2 border-t border-border">
                  <div className="flex gap-1">
                    <ActionBtn label="Edit" onClick={() => openEdit(r)}>
                      <EditIcon className="w-3.5 h-3.5" />
                    </ActionBtn>
                    <ActionBtn label="Print">
                      <PrintIcon className="w-3.5 h-3.5" />
                    </ActionBtn>
                    {r.RazaStatus !== 'Raza Done' && r.RazaStatus !== 'Raza Approved' && (
                      <ActionBtn
                        label="Approve"
                        className="bg-white border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400"
                        onClick={() => openApprove(r)}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </ActionBtn>
                    )}
                    {(r.RazaStatus === 'Raza Done' || r.RazaStatus === 'Raza Approved') && (
                      <ActionBtn
                        label="Revert to Pending"
                        className="bg-white border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-400"
                        onClick={() => openRevert(r)}
                      >
                        <RefreshIcon className="w-3.5 h-3.5" />
                      </ActionBtn>
                    )}
                    <ActionBtn
                      label="Delete"
                      className="bg-white border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400"
                      onClick={() => openDelete(r)}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </ActionBtn>
                  </div>
                </td>
                <td className="px-3 py-2 border-t border-border font-semibold">{r.SerialNo}</td>
                <td className="px-3 py-2 border-t border-border">{fmtDate(r.RequestDate)}</td>
                <td className="px-3 py-2 border-t border-border font-medium">{r.FullName}</td>
                <td className="px-3 py-2 border-t border-border">{r.Mobile}</td>
                <td className="px-3 py-2 border-t border-border">{r.Mobile1}</td>
                <td className="px-3 py-2 border-t border-border">{r.ITSNo}</td>
                <td className="px-3 py-2 border-t border-border">{r.Address}</td>
                <td className="px-3 py-2 border-t border-border">{fmtDate(r.EventDate)}</td>
                <td className="px-3 py-2 border-t border-border" dir="rtl" style={{ fontFamily: "'AL-KANZ', serif" }}>{r.HijriDate}</td>
                <td className="px-3 py-2 border-t border-border">{r.Razafor}</td>
                <td className="px-3 py-2 border-t border-border">{r.Place}</td>
                <td className="px-3 py-2 border-t border-border">{r.EventTime}</td>
                <td className="px-3 py-2 border-t border-border">{r.Thaal ?? '—'}</td>
                <td className="px-3 py-2 border-t border-border max-w-[160px] truncate">{r.Remark || '—'}</td>
                <td className="px-3 py-2 border-t border-border">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadge(r.RazaStatus)}`}>
                    {r.RazaStatus}
                  </span>
                </td>
                <td className="px-3 py-2 border-t border-border">{r.Requestby ?? '—'}</td>
                <td className="px-3 py-2 border-t border-border">{r.Createdby}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
            <span className="text-[11px] text-gray-500 px-2">Page {currentPage} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AddSafaiChitthiModal
        open={addModal}
        onClose={() => setAddModal(false)}
        member={member}
        accNo={accNo}
        form={form}
        set={set}
        saving={saving}
        onSave={handleAdd}
        razaOpts={razaOpts}
        placeOpts={placeOpts}
        timeOpts={timeOpts}
      />

      {/* Edit Modal */}
      <EditSafaiChitthiModal
        open={editModal}
        onClose={() => setEditModal(false)}
        editTarget={editTarget}
        form={form}
        set={set}
        saving={saving}
        onSave={handleEdit}
        razaOpts={razaOpts}
        placeOpts={placeOpts}
        timeOpts={timeOpts}
      />

      {/* Approve Confirm */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Approve Raza" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setApproveModal(false)}>Cancel</button>
          <button className="btn btn-sm bg-green-600 text-white hover:bg-green-700 border-0" onClick={handleApprove} disabled={approving}>
            <CheckIcon className="w-3.5 h-3.5 mr-1.5" />{approving ? 'Approving…' : 'Yes, Approve'}
          </button>
        </>}
      >
        <p className="text-[13px] text-gray-600">
          Are you sure to Approve Sr# <strong>{approveTarget?.SerialNo}</strong>?
        </p>
      </Modal>

      {/* Revert Confirm */}
      <Modal open={revertModal} onClose={() => setRevertModal(false)} title="Revert Raza" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setRevertModal(false)}>Cancel</button>
          <button className="btn btn-sm bg-orange-500 text-white hover:bg-orange-600 border-0" onClick={handleRevert} disabled={reverting}>
            <RefreshIcon className="w-3.5 h-3.5 mr-1.5" />{reverting ? 'Reverting…' : 'Yes, Revert'}
          </button>
        </>}
      >
        <p className="text-[13px] text-gray-600">
          Are you sure to revert Sr# <strong>{revertTarget?.SerialNo}</strong> back to <strong>Raza Pending</strong>?
        </p>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Raza" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
          <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700 border-0" onClick={handleDelete} disabled={deleting}>
            <TrashIcon className="w-3.5 h-3.5 mr-1.5" />{deleting ? 'Deleting…' : 'Delete'}
          </button>
        </>}
      >
        <p className="text-[13px] text-gray-600">
          Delete Sr# <strong>{deleteTarget?.SerialNo}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
