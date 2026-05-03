'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import toast           from 'react-hot-toast';
import PageHeader      from '@/components/shared/PageHeader';
import Modal           from '@/components/shared/Modal';
import { StatusBadge } from '@/components/shared/Badge';
import { useAuth }     from '@/context/AuthContext';
import { takhmeenService } from '@/services';
import { PlusIcon, PrintIcon, EditIcon, XIcon, SaveIcon } from '@/components/shared/Icons';

const CY = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CY - i);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPES  = ['Sabeel','FMB','Niyaz','Nazrana','Sila','HIM','Other'];

export default function MuminTakhmeenPage() {
  const router = useRouter();
  const { permissions } = useAuth();

  const [rows,    setRows]    = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [delId,   setDelId]   = useState(null);

  const [filters, setFilters] = useState({
    year:    CY,
    month:   '',
    mohallah:'',
    type:    '',
    search:  '',
    status:  '',
  });

  const [form, setForm] = useState({
    accno: '', year: CY, month: 1, type: 'Sabeel',
    amount: '', paidAmount: '', status: 'Pending', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [rowRes, sumRes] = await Promise.all([
        takhmeenService.getAll(params),
        takhmeenService.getSummary(params),
      ]);
      setRows(rowRes.data);
      setSummary(sumRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ accno: '', year: CY, month: 1, type: 'Sabeel', amount: '', paidAmount: '', status: 'Pending', notes: '' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
    if (!form.accno || !form.amount) { toast.error('Fill required fields'); return; }
    try {
      if (editing) {
        await takhmeenService.update(editing.id, form);
        toast.success('Takhmeen updated');
      } else {
        await takhmeenService.create(form);
        toast.success('Takhmeen added');
      }
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  const confirmDelete = async () => {
    if (!delId) return;
    try {
      await takhmeenService.delete(delId);
      toast.success('Deleted');
      setDelId(null);
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const fmt   = (n) => Number(n || 0).toLocaleString('en-IN');
  const due   = (r) => Math.max(0, Number(r.amount || 0) - Number(r.paidAmount || 0));
  const setF  = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Mumin Takhmeen" subtitle="SP: TakhmeenReport — Member annual commitment ledger">
        {permissions.MDEditTakhmeen && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}><PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Takhmeen</button>
        )}
        <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print</button>
      </PageHeader>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Demand',  val: `₹${fmt(summary.totalDemand)}`,  color: 'text-navy-800' },
            { label: 'Total Paid',    val: `₹${fmt(summary.totalPaid)}`,    color: 'text-green-600' },
            { label: 'Total Due',     val: `₹${fmt(summary.totalDue)}`,     color: 'text-red-500' },
            { label: 'Total Records', val: summary.count || rows.length,    color: 'text-blue-500' },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
              <div className="text-[11px] font-semibold text-gray-600 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div>
              <label className="form-label">Year</label>
              <select className="form-select" value={filters.year} onChange={e => setF('year', e.target.value)}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Month</label>
              <select className="form-select" value={filters.month} onChange={e => setF('month', e.target.value)}>
                <option value="">All</option>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={filters.type} onChange={e => setF('type', e.target.value)}>
                <option value="">All Types</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={filters.status} onChange={e => setF('status', e.target.value)}>
                <option value="">All</option>
                {['Pending','Partial','Paid','Overdue'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Mohallah</label>
              <input className="form-input" placeholder="Mohallah…" value={filters.mohallah} onChange={e => setF('mohallah', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Search</label>
              <input className="form-input" placeholder="Acc# or Name…" value={filters.search} onChange={e => setF('search', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          Takhmeen Records
          <span className="text-[11px] text-gray-400">{rows.length} records</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Acc#','Member Name','Mohallah','Year','Month','Type','Demand (₹)','Paid (₹)','Due (₹)','Status','Actions'].map(h =>
                  <th key={h} className="th-navy">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : rows.map((r, i) => {
                const dueAmt = due(r);
                return (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2.5 border-t border-border font-semibold">{r.accno}</td>
                    <td className="px-3 py-2.5 border-t border-border font-medium text-blue-500 cursor-pointer"
                      onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>{r.memberName}</td>
                    <td className="px-3 py-2.5 border-t border-border">{r.mohallah}</td>
                    <td className="px-3 py-2.5 border-t border-border text-center">{r.year}</td>
                    <td className="px-3 py-2.5 border-t border-border text-center">{r.month ? MONTHS[r.month - 1] : '—'}</td>
                    <td className="px-3 py-2.5 border-t border-border">
                      <span className="badge badge-blue">{r.type}</span>
                    </td>
                    <td className="px-3 py-2.5 border-t border-border text-right">₹{fmt(r.amount)}</td>
                    <td className="px-3 py-2.5 border-t border-border text-right text-green-600">₹{fmt(r.paidAmount)}</td>
                    <td className={`px-3 py-2.5 border-t border-border text-right font-semibold ${dueAmt > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      ₹{fmt(dueAmt)}
                    </td>
                    <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Pending'} /></td>
                    <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                      {permissions.MDEditTakhmeen && (
                        <button className="btn btn-secondary btn-sm mr-1" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5" /></button>
                      )}
                      {permissions.MDDeleteTakhmeen && (
                        <button className="btn btn-danger btn-sm" onClick={() => setDelId(r.id)}><XIcon className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (() => {
              const totDemand = rows.reduce((s, r) => s + Number(r.amount     || 0), 0);
              const totPaid   = rows.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
              const totDue    = rows.reduce((s, r) => s + due(r),                    0);
              return (
                <tfoot>
                  <tr className="bg-navy-800/[0.04] font-bold text-[12px]">
                    <td colSpan={6} className="px-3 py-2.5 border-t-2 border-navy-800/20">Total ({rows.length} records)</td>
                    <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right">₹{fmt(totDemand)}</td>
                    <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right text-green-600">₹{fmt(totPaid)}</td>
                    <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right text-red-500">₹{fmt(totDue)}</td>
                    <td colSpan={2} className="px-3 py-2.5 border-t-2 border-navy-800/20" />
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit Takhmeen — ${editing.accno}` : 'Add Takhmeen'}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />{editing ? 'Update' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          {!editing && (
            <div><label className="form-label">Account No. *</label><input className="form-input" placeholder="Acc No." value={form.accno} onChange={e => setForm(p => ({ ...p, accno: e.target.value }))} /></div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Month</label>
              <select className="form-select" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Demand Amount (₹) *</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label className="form-label">Paid Amount (₹)</label><input type="number" className="form-input" value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))} /></div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['Pending','Partial','Paid','Overdue'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="form-label">Notes</label><textarea className="form-input h-16 py-2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Confirm Delete" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDelId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-[13px] text-gray-600">Are you sure you want to delete this takhmeen record? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
