'use client';

import { useState, useEffect, useCallback } from 'react';
import { rbacService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { PlusIcon } from '@/components/shared/Icons';

import UsersTab          from './_components/UsersTab';
import RolesTab          from './_components/RolesTab';
import PermissionsTab    from './_components/PermissionsTab';
import ScopesTab         from './_components/ScopesTab';
import AuditTab          from './_components/AuditTab';
import UserModal         from './_components/UserModal';
import ResetPasswordModal from './_components/ResetPasswordModal';
import RoleModal         from './_components/RoleModal';
import PermissionModal   from './_components/PermissionModal';
import ScopeModal        from './_components/ScopeModal';

const TABS = [
  { key: 'users',       label: 'Users' },
  { key: 'roles',       label: 'Roles' },
  { key: 'permissions', label: 'Permissions Catalog' },
  { key: 'scopes',      label: 'Scopes' },
  { key: 'audit',       label: 'Audit Log' },
];

export default function AccessControlPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState('users');

  // ── data ──────────────────────────────────────────────────────────────────
  const [users,      setUsers]      = useState([]);
  const [roles,      setRoles]      = useState([]);
  const [permissions,setPermissions]= useState([]);
  const [scopes,     setScopes]     = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage,  setAuditPage]  = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(50);
  const [loading,    setLoading]    = useState({});

  // ── modal state ───────────────────────────────────────────────────────────
  const [userModalOpen,      setUserModalOpen]      = useState(false);
  const [editUser,           setEditUser]           = useState(null);
  const [roleModalOpen,      setRoleModalOpen]      = useState(false);
  const [editRole,           setEditRole]           = useState(null);
  const [permModalOpen,      setPermModalOpen]      = useState(false);
  const [editPerm,           setEditPerm]           = useState(null);
  const [permPrefillModule,  setPermPrefillModule]  = useState('');
  const [scopeModalOpen,     setScopeModalOpen]     = useState(false);
  const [editScope,          setEditScope]          = useState(null);
  const [pwdModalUserId,     setPwdModalUserId]     = useState(null);

  // ── data loaders ──────────────────────────────────────────────────────────
  const load = useCallback(async (what) => {
    setLoading(p => ({ ...p, [what]: true }));
    try {
      if (what === 'users')       { const r = await rbacService.getUsers();       setUsers(r.data.data); }
      if (what === 'roles')       { const r = await rbacService.getRoles();       setRoles(r.data.data); }
      if (what === 'permissions') { const r = await rbacService.getPermissions(); setPermissions(r.data.data); }
      if (what === 'scopes')      { const r = await rbacService.getScopes();      setScopes(r.data.data); }
      if (what === 'audit') {
        const limit = auditPageSize === 'All' ? 999999 : auditPageSize;
        const r = await rbacService.getAuditLogs({ page: auditPage, limit });
        setAuditLogs(r.data.rows);
        setAuditTotal(r.data.total);
      }
    } catch { toast.error(`Failed to load ${what}`); }
    finally  { setLoading(p => ({ ...p, [what]: false })); }
  }, [auditPage, auditPageSize]);

  useEffect(() => { load('users'); load('roles'); load('scopes'); }, []);
  useEffect(() => { if (tab === 'permissions') load('permissions'); }, [tab]);
  useEffect(() => { if (tab === 'audit') load('audit'); }, [tab, auditPage, auditPageSize]);

  // ── user handlers ─────────────────────────────────────────────────────────
  const openAddUser  = () => { setEditUser(null); setUserModalOpen(true); };
  const openEditUser = async (u) => {
    try {
      const r = await rbacService.getUser(u.id);
      setEditUser(r.data.data);
      setUserModalOpen(true);
    } catch { toast.error('Failed to load user'); }
  };
  const toggleUserActive = async (user, newValue) => {
    await rbacService.updateUser(user.id, {
      full_name: user.full_name, email: user.email, is_active: newValue, force_pwd_reset: user.force_pwd_reset,
    });
    toast.success(newValue ? `"${user.username}" activated` : `"${user.username}" deactivated`);
    load('users');
  };

  // ── role handlers ─────────────────────────────────────────────────────────
  const openAddRole  = () => { setEditRole(null); setRoleModalOpen(true); };
  const openEditRole = async (r) => {
    try {
      const res = await rbacService.getRole(r.id);
      setEditRole(res.data.data);
      setRoleModalOpen(true);
    } catch { toast.error('Failed to load role'); }
  };
  const toggleRoleActive = async (role, newValue) => {
    await rbacService.updateRole(role.id, {
      name: role.name, description: role.description || '', is_active: newValue,
    });
    toast.success(newValue ? `"${role.name}" activated` : `"${role.name}" deactivated`);
    load('roles');
  };

  // ── permission handlers ───────────────────────────────────────────────────
  const openAddPermission  = (module = '') => {
    setEditPerm(null);
    setPermPrefillModule(module);
    setPermModalOpen(true);
  };
  const openEditPermission = (p) => {
    setEditPerm(p);
    setPermPrefillModule('');
    setPermModalOpen(true);
  };
  const deletePermission = async (p) => {
    if (!confirm(`Delete permission "${p.code}"?\n\nThis will remove it from all roles that have it.`)) return;
    try {
      await rbacService.deletePermission(p.id);
      toast.success('Permission deleted');
      load('permissions');
    } catch { toast.error('Failed to delete'); }
  };

  // ── scope handlers ────────────────────────────────────────────────────────
  const openAddScope  = () => { setEditScope(null); setScopeModalOpen(true); };
  const openEditScope = (s) => { setEditScope(s); setScopeModalOpen(true); };
  const deleteScope = async (s) => {
    if (!confirm(`Delete scope "${s.type}:${s.value}"?\n\nThis will remove it from all users and roles that have it.`)) return;
    try {
      await rbacService.deleteScope(s.id);
      toast.success('Scope deleted');
      load('scopes');
    } catch { toast.error('Failed to delete scope'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Access Control" subtitle="Manage users, roles, permissions and scopes">
        {tab === 'users' && can('users.create') && (
          <button className="btn btn-primary btn-sm" onClick={openAddUser}>
            <PlusIcon className="w-3.5 h-3.5 mr-1" />Add User
          </button>
        )}
        {tab === 'roles' && can('roles.create') && (
          <button className="btn btn-primary btn-sm" onClick={openAddRole}>
            <PlusIcon className="w-3.5 h-3.5 mr-1" />New Role
          </button>
        )}
        {tab === 'permissions' && can('permissions.assign') && (
          <button className="btn btn-primary btn-sm" onClick={() => openAddPermission()}>
            <PlusIcon className="w-3.5 h-3.5 mr-1" />Add Permission
          </button>
        )}
        {tab === 'scopes' && can('permissions.assign') && (
          <button className="btn btn-primary btn-sm" onClick={openAddScope}>
            <PlusIcon className="w-3.5 h-3.5 mr-1" />Add Scope
          </button>
        )}
      </PageHeader>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12.5px] font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'users' && (
        <UsersTab
          users={users}
          loading={loading.users}
          can={can}
          onEditUser={openEditUser}
          onResetPassword={(id) => setPwdModalUserId(id)}
          onRefresh={() => load('users')}
          onToggleActive={toggleUserActive}
        />
      )}

      {tab === 'roles' && (
        <RolesTab
          roles={roles}
          loading={loading.roles}
          can={can}
          onEditRole={openEditRole}
          onToggleActive={toggleRoleActive}
        />
      )}

      {tab === 'permissions' && (
        <PermissionsTab
          permissions={permissions}
          loading={loading.permissions}
          can={can}
          onRefresh={() => load('permissions')}
          onAddPermission={openAddPermission}
          onEditPermission={openEditPermission}
          onDeletePermission={deletePermission}
        />
      )}

      {tab === 'scopes' && (
        <ScopesTab
          scopes={scopes}
          loading={loading.scopes}
          can={can}
          onRefresh={() => load('scopes')}
          onEditScope={openEditScope}
          onDeleteScope={deleteScope}
        />
      )}

      {tab === 'audit' && (
        <AuditTab
          auditLogs={auditLogs}
          auditTotal={auditTotal}
          auditPage={auditPage}
          setAuditPage={setAuditPage}
          pageSize={auditPageSize}
          setPageSize={setAuditPageSize}
          loading={loading.audit}
          onRefresh={() => load('audit')}
        />
      )}

      {/* Modals */}
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        editUser={editUser}
        roles={roles}
        scopes={scopes}
        onSuccess={() => load('users')}
      />

      <ResetPasswordModal
        open={!!pwdModalUserId}
        onClose={() => setPwdModalUserId(null)}
        userId={pwdModalUserId}
      />

      <RoleModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        editRole={editRole}
        scopes={scopes}
        onSuccess={() => load('roles')}
      />

      <PermissionModal
        open={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        editPerm={editPerm}
        prefillModule={permPrefillModule}
        onSuccess={() => load('permissions')}
      />

      <ScopeModal
        open={scopeModalOpen}
        onClose={() => setScopeModalOpen(false)}
        editScope={editScope}
        onSuccess={() => load('scopes')}
      />
    </div>
  );
}
