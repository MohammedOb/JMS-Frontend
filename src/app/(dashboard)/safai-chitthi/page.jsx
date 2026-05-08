'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { safaiService } from '@/services';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import Modal from '@/components/shared/Modal';
import { PrintIcon, EditIcon, SaveIcon, TrashIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  AccNo: '', RequestDate: today(), EventDate: '', HijriDate: '',
  RazaFor: '', Location: '', EventTime: '', Thaal: '', Remark: '', RazaStatus: 'Raza Pending',
};

const RAZA_STATUS_OPTIONS = ['Raza Pending', 'Raza Approved', 'Raza Rejected'];

function SafaiChitthiInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlAccNo = searchParams.get('accno') || '';

  const [accNo,    setAccNo]    = useState(urlAccNo);
  const [inputVal, setInputVal] = useState(urlAccNo);
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);

  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async (acc) => {
    if (!acc) return;
    setLoading(true);
    try {
      const res = await safaiService.loadRazaDetails({ AccNo: acc });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load Raza details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accNo) load(accNo);
  }, [accNo, load]);

  const handleSearch = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) { toast.error('Enter an Account No.'); return; }
    setAccNo(trimmed);
    router.replace(`/safai-chitthi?accno=${trimmed}`, { scroll: false });
  };

  // ── Add ────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, AccNo: accNo });
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!form.AccNo) { toast.error('Account No. is required'); return; }
    if (!form.EventDate) { toast.error('Event Date is required'); return; }
    if (!form.RazaFor) { toast.error('Raza For is required'); return; }
    setSaving(true);
    try {
      await safaiService.addRazaDetails(form);
      toast.success('Raza added successfully');
      setAddModal(false);
      load(accNo);
    } catch {
      toast.error('Failed to add Raza');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      AccNo:       row.AccNo       || accNo,
      RequestDate: row.RequestDate || today(),
      EventDate:   row.EventDate   || '',
      HijriDate:   row.HijriDate   || '',
      RazaFor:     row.RazaFor     || '',
      Location:    row.Location    || '',
      EventTime:   row.EventTime   || '',
      Thaal:       row.Thaal       || '',
      Remark:      row.Remark      || '',
      RazaStatus:  row.RazaStatus  || 'Raza Pending',
    });
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!form.EventDate) { toast.error('Event Date is required'); return; }
    if (!form.RazaFor)   { toast.error('Raza For is required'); return; }
    setSaving(true);
    try {
      await safaiService.updateRazaDetails({ SrNo: editTarget.SrNo, ...form });
      toast.success('Raza updated successfully');
      setEditModal(false);
      load(accNo);
    } catch {
      toast.error('Failed to update Raza');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await safaiService.deleteRazaDetails({ SrNo: deleteTarget.SrNo });
      toast.success('Raza deleted');
      setDeleteModal(false);
      load(accNo);
    } catch {
      toast.error('Failed to delete Raza');
    } finally {
      setDeleting(false);
    }
  };

  const COLS = [
    'Action', 'Serial No', 'Request Date', 'Full Name', 'Mobile', 'Mobile1',
    'ITS No', 'Address', 'Event Date', 'Hijri Date', 'Raza for', 'Location',
    'Event Time', 'Thaal', 'Remark', 'Raza Status', 'Request by', 'Created by',
  ];

  return (
    <div>
      <PageHeader title="Safai Chitthi" subtitle="Raza request list">
        {accNo && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Raza</button>
        )}
      </PageHeader>

      {/* AccNo search bar */}
      <div className="card mb-4">
        <div className="card-header">Search by Account No.</div>
        <div className="p-4 flex gap-2">
          <input
            className="form-input max-w-xs"
            placeholder="Enter Account No."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSearch}>Load</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          {accNo ? `Raza List — Acc# ${accNo}` : 'Raza List'}
          {accNo && !loading && (
            <span className="ml-2 text-[11px] font-normal text-gray-400">({rows.length} record{rows.length !== 1 ? 's' : ''})</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] whitespace-nowrap">
            <thead>
              <tr>{COLS.map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {!accNo ? (
                <tr><td colSpan={COLS.length} className="text-center py-10 text-gray-400">Enter an Account No. to load records</td></tr>
              ) : loading ? (
                <tr><td colSpan={COLS.length} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={COLS.length} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  {/* Action */}
                  <td className="px-2 py-2 border-t border-border">
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                        <EditIcon className="w-3 h-3 mr-1" />Edit
                      </button>
                      <button className="btn btn-secondary btn-sm">
                        <PrintIcon className="w-3 h-3 mr-1" />Print
                      </button>
                      <button className="btn btn-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" onClick={() => openDelete(r)}>
                        <TrashIcon className="w-3 h-3 mr-1" />Delete
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-t border-border font-semibold">{r.SrNo}</td>
                  <td className="px-3 py-2 border-t border-border">{r.RequestDate}</td>
                  <td className="px-3 py-2 border-t border-border font-medium text-blue-600 cursor-pointer"
                    onClick={() => router.push(`/mumin-details?accno=${r.AccNo || accNo}`)}>
                    {r.FullName}
                  </td>
                  <td className="px-3 py-2 border-t border-border">{r.Mobile}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Mobile1}</td>
                  <td className="px-3 py-2 border-t border-border">{r.ITSNo}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Address}</td>
                  <td className="px-3 py-2 border-t border-border">{r.EventDate}</td>
                  <td className="px-3 py-2 border-t border-border">{r.HijriDate}</td>
                  <td className="px-3 py-2 border-t border-border">{r.RazaFor}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Location}</td>
                  <td className="px-3 py-2 border-t border-border">{r.EventTime}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Thaal ?? '-'}</td>
                  <td className="px-3 py-2 border-t border-border max-w-[160px] truncate">{r.Remark}</td>
                  <td className="px-3 py-2 border-t border-border">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      r.RazaStatus === 'Raza Approved' ? 'bg-green-100 text-green-700' :
                      r.RazaStatus === 'Raza Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{r.RazaStatus}</span>
                  </td>
                  <td className="px-3 py-2 border-t border-border">{r.RequestBy ?? '-'}</td>
                  <td className="px-3 py-2 border-t border-border">{r.CreatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Safai Chitthi" size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <RazaForm form={form} set={set} showStatus={false} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)}
        title={`Edit Safai Chitthi — Sr# ${editTarget?.SrNo ?? ''}`} size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Updating…' : 'Update'}
            </button>
          </>
        }
      >
        <RazaForm form={form} set={set} showStatus={true} />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Raza" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700 border-0" onClick={handleDelete} disabled={deleting}>
              <TrashIcon className="w-3.5 h-3.5 mr-1.5" />{deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-gray-600">
          Are you sure you want to delete Sr# <strong>{deleteTarget?.SrNo}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function RazaForm({ form, set, showStatus }) {
  return (
    <div className="space-y-3 text-[13px]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Account No.</label>
          <input className="form-input" value={form.AccNo}
            onChange={e => set('AccNo', e.target.value)} placeholder="AccNo" />
        </div>
        <div>
          <label className="form-label">Request Date</label>
          <input type="date" className="form-input" value={form.RequestDate}
            onChange={e => set('RequestDate', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Event Date <span className="text-red-500">*</span></label>
          <input type="date" className="form-input" value={form.EventDate}
            onChange={e => set('EventDate', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Hijri Date</label>
          <input className="form-input" value={form.HijriDate}
            onChange={e => set('HijriDate', e.target.value)} placeholder="e.g. 1446-ذي القعادة-13" />
        </div>
      </div>
      <div>
        <label className="form-label">Raza For <span className="text-red-500">*</span></label>
        <input className="form-input" value={form.RazaFor}
          onChange={e => set('RazaFor', e.target.value)} placeholder="e.g. Aqiqa, Waras Jaman, Mithi Shitabi" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Location</label>
          <input className="form-input" value={form.Location}
            onChange={e => set('Location', e.target.value)} placeholder="e.g. Jumaat Khana, Ghare" />
        </div>
        <div>
          <label className="form-label">Event Time</label>
          <input className="form-input" value={form.EventTime}
            onChange={e => set('EventTime', e.target.value)} placeholder="e.g. 01:45 PM" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Thaal</label>
          <input type="number" className="form-input" value={form.Thaal}
            onChange={e => set('Thaal', e.target.value)} placeholder="No. of thaals" />
        </div>
        {showStatus && (
          <div>
            <label className="form-label">Raza Status</label>
            <select className="form-select" value={form.RazaStatus}
              onChange={e => set('RazaStatus', e.target.value)}>
              {RAZA_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="form-label">Remark</label>
        <textarea className="form-input h-16 py-2" value={form.Remark}
          onChange={e => set('Remark', e.target.value)} placeholder="Additional remarks…" />
      </div>
    </div>
  );
}

export default function SafaiChitthiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      <SafaiChitthiInner />
    </Suspense>
  );
}
