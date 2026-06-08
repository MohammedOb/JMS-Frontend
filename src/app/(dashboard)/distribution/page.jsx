'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useState, useEffect, useCallback } from 'react';
import toast                                  from 'react-hot-toast';
import PageHeader                             from '@/components/shared/PageHeader';
import { distributionService, distributorService, lookupService } from '@/services';

import DistributorListCard  from './components/DistributorListCard';
import DistributorFormModal from './components/DistributorFormModal';
import DistributionFilters  from './components/DistributionFilters';
import DistributionTable    from './components/DistributionTable';

const EMPTY_FILTERS = {
  search:             '',
  DistributorName:    '',
  DistributorID:      '',
  Sector:             '',
  Subsector:          '',
  MohallaDescription: '',
  ThaaliSize:         '',
};

const TABS = [
  { key: 'distributors', label: 'Distributors' },
  { key: 'list',         label: 'Distribution List' },
];

function exportCSV(data, cols, filename) {
  const header = cols.map(c => c.label).join(',');
  const rowsStr = data.map(r =>
    cols.map(c => {
      const v = String(r[c.key] ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n')
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    }).join(',')
  );
  const csv = '﻿' + [header, ...rowsStr].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DistributionPage() {
  const [tab, setTab] = useState('distributors');

  // ── Distributor management ────────────────────────────────────────────────
  const [distributors,    setDistributors]    = useState([]);
  const [distLoading,     setDistLoading]     = useState(false);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [isEdit,          setIsEdit]          = useState(false);
  const [form,            setForm]            = useState(DistributorFormModal.EMPTY);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [toggleTarget,    setToggleTarget]    = useState(null);

  const loadDistributors = useCallback(async () => {
    setDistLoading(true);
    try {
      const res = await distributorService.load({});
      setDistributors(res?.data?.data ?? res?.data ?? []);
    } catch {
      toast.error('Failed to load distributors.');
    } finally {
      setDistLoading(false);
    }
  }, []);

  useEffect(() => { loadDistributors(); }, [loadDistributors]);

  const distributorOptions = distributors;

  const openAdd = () => {
    setForm(DistributorFormModal.EMPTY);
    setIsEdit(false);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({ ID: row.ID, DistributorName: row.DistributorName, Mobile: row.Mobile || '' });
    setIsEdit(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.DistributorName?.trim()) { toast.error('Distributor name is required.'); return; }
    try {
      if (isEdit) {
        await distributorService.update(form);
        toast.success('Distributor updated.');
      } else {
        await distributorService.add(form);
        toast.success('Distributor added.');
      }
      setModalOpen(false);
      loadDistributors();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save distributor.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await distributorService.remove({ ID: deleteTarget.ID });
      toast.success('Distributor deleted.');
      setDeleteTarget(null);
      loadDistributors();
    } catch {
      toast.error('Failed to delete distributor.');
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      const newStatus = toggleTarget.IsActive ? 0 : 1;
      await distributorService.update({ ID: toggleTarget.ID, IsActive: newStatus });
      setDistributors(prev =>
        prev.map(d => d.ID === toggleTarget.ID ? { ...d, IsActive: newStatus } : d)
      );
      toast.success(`Distributor marked as ${newStatus ? 'Active' : 'Inactive'}.`);
      setToggleTarget(null);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleExportDistributors = () => {
    exportCSV(
      distributors.map((d, i) => ({ ...d, _no: i + 1, _active: d.IsActive ? 'Yes' : 'No' })),
      [
        { label: 'No',               key: '_no' },
        { label: 'Distributor Name', key: 'DistributorName' },
        { label: 'Mobile',           key: 'Mobile' },
        { label: 'Active',           key: '_active' },
      ],
      'distributors.csv'
    );
  };

  // ── Distribution member list ───────────────────────────────────────────────
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [sectorOptions,  setSectorOptions]  = useState([]);
  const [allMohallas,    setAllMohallas]    = useState([]);
  const [thaliSizeOptions, setThaliSizeOptions] = useState([]);

  useEffect(() => {
    lookupService.getMohallaData()
      .then(r => {
        const d = r?.data?.data ?? r?.data ?? {};
        setSectorOptions(d.sectors ?? []);
        setAllMohallas(d.mohallas ?? []);
      })
      .catch(() => {});

    lookupService.getThaliSizes()
      .then(r => setThaliSizeOptions(r?.data?.data ?? r?.data ?? []))
      .catch(() => {});
  }, []);

  const setFilter = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  const loadMembers = useCallback(async (params) => {
    setLoading(true);
    try {
      const query = {};
      if (params.DistributorID)        query.DistributorID      = params.DistributorID;
      else if (params.DistributorName) query.DistributorName    = params.DistributorName;
      if (params.Sector)               query.Sector             = params.Sector;
      if (params.Subsector)            query.Subsector          = params.Subsector;
      if (params.MohallaDescription)   query.MohallaDescription = params.MohallaDescription;
      if (params.ThaaliSize)           query.ThaaliSize         = params.ThaaliSize;

      const res  = await distributionService.getAll(query);
      let   data = res?.data?.data ?? res?.data ?? [];

      if (params.search) {
        const q = params.search.toLowerCase();
        data = data.filter(r =>
          r.FullName?.toLowerCase().includes(q) ||
          String(r.AccNo).includes(params.search)
        );
      }
      setRows(data);
    } catch {
      toast.error('Failed to load distribution list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => loadMembers(filters);
  const handleReset  = () => { setFilters(EMPTY_FILTERS); setRows([]); };

  const handleExportDistribution = () => {
    if (rows.length === 0) { toast.error('No data to export.'); return; }
    exportCSV(
      rows.map((r, i) => ({ ...r, _no: i + 1 })),
      [
        { label: 'S No',             key: '_no' },
        { label: 'Acc No',           key: 'AccNo' },
        { label: 'Full Name',        key: 'FullName' },
        { label: 'Mobile',           key: 'Mobile' },
        { label: 'Sector',            key: 'Sector' },
        { label: 'Subsector',        key: 'Subsector' },
        { label: 'MohallaDescription', key: 'MohallaDescription' },
        { label: 'Thaali Size',      key: 'ThaaliSize' },
        { label: 'Distributor Name', key: 'DistributorName' },
      ],
      'distribution-list.csv'
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PermissionGuard permission="distribution.view">
    <div>
      <PageHeader title="Distribution" subtitle="Manage distributors and view member thaali assignments" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-all -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Distributors tab ── */}
      {tab === 'distributors' && (
        <DistributorListCard
          distributors={distributors}
          loading={distLoading}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onToggleActive={setToggleTarget}
          onExport={handleExportDistributors}
        />
      )}

      {/* ── Distribution List tab ── */}
      {tab === 'list' && (
        <>
          <DistributionFilters
            filters={filters}
            onChange={setFilter}
            onSearch={handleSearch}
            onReset={handleReset}
            distributorOptions={distributorOptions}
            sectorOptions={sectorOptions}
            allMohallas={allMohallas}
            thaliSizeOptions={thaliSizeOptions}
          />
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <span>Distribution Members</span>
                {rows.length > 0 && (
                  <span className="text-[11px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                    {rows.length} records
                  </span>
                )}
              </div>
              {rows.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={handleExportDistribution}>
                  Export CSV
                </button>
              )}
            </div>
            <DistributionTable rows={rows} loading={loading} />
          </div>
        </>
      )}

      {/* Add / Edit distributor modal */}
      <DistributorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isEdit={isEdit}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Distributor</h3>
            <p className="text-sm text-gray-600 mb-4">
              Delete <strong>{deleteTarget.DistributorName}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle active confirmation */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              {toggleTarget.IsActive ? 'Deactivate' : 'Activate'} Distributor
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to mark <strong>{toggleTarget.DistributorName}</strong> as{' '}
              <strong>{toggleTarget.IsActive ? 'Inactive' : 'Active'}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setToggleTarget(null)}>Cancel</button>
              <button
                className={`btn btn-sm ${toggleTarget.IsActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleActive}
              >
                {toggleTarget.IsActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </PermissionGuard>
  );
}
