'use client';

import { useState, useEffect, useCallback } from 'react';
import { userService }    from '@/services';
import toast              from 'react-hot-toast';
import PageHeader         from '@/components/shared/PageHeader';
import Modal              from '@/components/shared/Modal';
import { StatusBadge }    from '@/components/shared/Badge';
import { SaveIcon } from '@/components/shared/Icons';

const ALL_PERMISSIONS = {
  'Menu Access': [
    ['MPBasicMenu',        'Basic Menu (Add Receipt, Daily Report, Search)'],
    ['MPMuminDetails',     'Mumin Details'],
    ['MPDueDetails',       'Due Details'],
    ['MPMuminTakhmeen',    'Mumin Takhmeen'],
    ['MPSabeelStatistics', 'Sabeel Statistics'],
    ['MPFMBStatistics',    'FMB Statistics'],
    ['MPExpense',          'Expenses & Expense Report'],
    ['MPDistributor',      'Distribution List'],
    ['MPMohallah',         'Mohallah Details'],
    ['MPBooking',          'Bookings / Calendar'],
    ['MPOhbatMajlis',      'Majlis List'],
    ['MPSafaiChitthi',     'Safai Chitthi'],
    ['MPFollowupList',     'Follow Up List'],
    ['MPFMBDailyMenu',     'FMB Daily Menu'],
    ['MPManagUser',        'Manage Users'],
    ['MPUtility',          'Utility'],
  ],
  'Receipt Actions': [
    ['UREdit',   'Edit Receipt (UREdit)'],
    ['URDelete', 'Delete Receipt (URDelete)'],
    ['URCancel', 'Cancel Receipt (URCancel)'],
  ],
  'Mumin Details Actions': [
    ['MDEditTakhmeen',        'Edit Takhmeen'],
    ['MDDeleteTakhmeen',      'Delete Takhmeen'],
    ['MDEditReceipt',         'Edit Receipt (MDEditReceipt)'],
    ['MDNewInsert',           'New Insert (MDNewInsert)'],
    ['MDVajUnlock',           'Vajebaat Unlock'],
    ['MDHIMView',             'View HIM'],
    ['MDSpeedVajebaatView',   'Speed Vajebaat View'],
    ['MDVajebaatDetailsView', 'Vajebaat Details View'],
    ['MDVajebaatTabView',     'Vajebaat Tab View'],
    ['MDHideAllButtons',      'Hide All Buttons'],
  ],
  'Daily Report': [
    ['DREdit',       'Edit in Daily Report'],
    ['DRViewSabeel', 'View Sabeel'],
    ['DRViewFMB',    'View FMB'],
    ['DRViewOther',  'View Other'],
  ],
  'Due Report': [
    ['GDViewSabeel',   'View Sabeel'],
    ['GDViewFMB',      'View FMB'],
    ['GDViewVajebaat', 'View Vajebaat'],
    ['GDViewOther',    'View Other'],
  ],
  'Bookings': [
    ['BookingAdd',    'Add Booking'],
    ['BookingEdit',   'Edit Booking'],
    ['BookingDelete', 'Delete Booking'],
  ],
};

export default function ManageUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [permUser,setPermUser]= useState(null);  // user being edited for permissions
  const [perms,   setPerms]   = useState({});
  const [newModal,setNewModal]= useState(false);
  const [newForm, setNewForm] = useState({ username: '', password: '', role: 'Accounts' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await userService.getAll(); setUsers(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPermissions = (u) => {
    setPermUser(u);
    const p = {};
    Object.values(ALL_PERMISSIONS).flat().forEach(([key]) => { p[key] = !!u.permissions?.[key]; });
    setPerms(p);
  };

  const savePermissions = async () => {
    try {
      await userService.updatePermissions(permUser.id, perms);
      toast.success('Permissions updated');
      setPermUser(null);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const resetPassword = async (id) => {
    if (!confirm('Reset password for this user?')) return;
    try { await userService.resetPassword(id); toast.success('Password reset'); }
    catch { toast.error('Failed'); }
  };

  const createUser = async () => {
    if (!newForm.username || !newForm.password) { toast.error('Fill all fields'); return; }
    try {
      await userService.create(newForm);
      toast.success('User created');
      setNewModal(false);
      load();
    } catch { toast.error('Failed to create user'); }
  };

  const ROLE_BADGE = { 'Super Admin': 'blue', 'Accounts': 'blue', 'Reports Only': 'amber', 'Read Only': 'red' };

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="Role-based access control for all system users">
        <button className="btn btn-primary btn-sm" onClick={() => setNewModal(true)}>+ Add New User</button>
      </PageHeader>

      {/* Users table */}
      <div className="card mb-4">
        <div className="card-header">System Users</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Username','Role','Last Login','Status','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{u.username}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <span className={`badge badge-${ROLE_BADGE[u.role] || 'gray'}`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">{u.lastLogin || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={u.status || 'Active'} /></td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    <button className="btn btn-primary btn-sm mr-1" onClick={() => openPermissions(u)}>Permissions</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => resetPassword(u.id)}>Reset Pass</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission editor */}
      {permUser && (
        <div className="card">
          <div className="card-header">
            Edit Permissions — <strong>{permUser.username}</strong>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setPermUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={savePermissions}>Save Permissions</button>
            </div>
          </div>
          <div className="card-body">
            {Object.entries(ALL_PERMISSIONS).map(([section, items]) => (
              <div key={section} className="mb-5">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{section}</div>
                <div className="grid grid-cols-3 gap-2">
                  {items.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-500 w-3.5 h-3.5"
                        checked={!!perms[key]}
                        onChange={e => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New user modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Add New User" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createUser}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Create User</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Username</label><input className="form-input" value={newForm.username} onChange={e => setNewForm(p => ({ ...p, username: e.target.value }))} /></div>
          <div><label className="form-label">Password</label><input type="password" className="form-input" value={newForm.password} onChange={e => setNewForm(p => ({ ...p, password: e.target.value }))} /></div>
          <div><label className="form-label">Role</label>
            <select className="form-select" value={newForm.role} onChange={e => setNewForm(p => ({ ...p, role: e.target.value }))}>
              {['Super Admin','Accounts','Reports Only','Read Only'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
