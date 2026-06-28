// src/services/index.js
// All API calls. Each function maps to a backend endpoint / stored procedure.

import api, { publicApi } from '@/lib/api';
import * as cache from '@/lib/cache';

const TTL = {
  lookup: 10 * 60_000, // 10 min – static dropdown values
  ref:     5 * 60_000, // 5 min  – reference tables (mohallahs, heads)
  list:       60_000,  // 1 min  – list / summary results
  report:  2 * 60_000, // 2 min  – report / aggregation results
  search:     30_000,  // 30 sec – user-filtered search results
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats:              cache.cached(() => api.get('/dashboard/stats'),                         () => 'dash:stats',               TTL.list),
  getRecentTransactions: cache.cached((limit=5) => api.get(`/dashboard/recent?limit=${limit}`), (limit=5) => `dash:recent:${limit}`, TTL.search),
  getWidgetRecent: cache.cached(
    (p) => api.get('/dashboard/recent', { params: {
      hubs:     (p.hubs     || []).join(','),
      subheads: (p.subheads || []).join(','),
      limit:    p.limit || 5,
    }}),
    (p) => `dash:recent:${(p.hubs||[]).join(',')}:${(p.subheads||[]).join(',')}:${p.limit||5}`,
    TTL.search
  ),
  getSabeelStats:        cache.cached((year='') => api.get('/dashboard/sabeel',   { params: { year } }), (y='') => `dash:sabeel:${y}`,   TTL.list),
  getFmbStats:           cache.cached((year='') => api.get('/dashboard/fmb',      { params: { year } }), (y='') => `dash:fmb:${y}`,      TTL.list),
  getMainHeadStats:      cache.cached((year='') => api.get('/dashboard/mainhead', { params: { year } }), (y='') => `dash:mainhead:${y}`, TTL.list),
  getDashboardMeta:      cache.cached(() => api.get('/dashboard/meta'), () => 'dash:meta', TTL.lookup),
  getDashboardConfig:         () => api.get('/dashboard/config'),
  getDashboardConfigForScope: (scope, scopeId) => api.get('/dashboard/config', { params: { scope, scopeId } }),
  saveDashboardConfig:        (payload) => api.put('/dashboard/config', payload),
  getWidgetData:         cache.cached(
    (p) => api.get('/dashboard/widget', { params: {
      hubs:     (p.hubs     || []).join(','),
      subheads: (p.subheads || []).join(','),
      metrics:  (p.metrics  || []).join(','),
      year:     p.year || '',
    }}),
    (p) => `dash:widget:${(p.hubs||[]).join(',')}:${(p.subheads||[]).join(',')}:${(p.metrics||[]).join(',')}:${p.year||''}`,
    TTL.list
  ),
};

// ── Receipts ─────────────────────────────────────────────────────────────────
export const receiptService = {
  save:          cache.mutates((data)    => api.post('/receipts', data),         'receipt', 'dash'),
  update:        cache.mutates((id, data)=> api.put(`/receipts/${id}`, data),    'receipt', 'dash'),
  cancel:        cache.mutates((id)      => api.put(`/receipts/${id}/cancel`),   'receipt', 'dash'),
  delete:        cache.mutates((id)      => api.delete(`/receipts/${id}`),       'receipt', 'dash'),
  getDailyReport:     cache.cached((params) => api.get('/receipts/daily',             { params }), (p) => cache.makeKey('receipt:daily',  p), TTL.report),
  getDailyTotals:     cache.cached((params) => api.get('/receipts/daily/totals',      { params }), (p) => cache.makeKey('receipt:totals', p), TTL.report),
  getDailyItemTotals: cache.cached((params) => api.get('/receipts/daily/item-totals', { params }), (p) => cache.makeKey('receipt:items',  p), TTL.report),
  print:         (id)      => api.get(`/receipts/${id}/print`),
  loadTransactionDetails:     cache.cached((data) => api.post('/LoadTransactionDetails',     data), (d) => cache.makeKey('receipt:tx',      d), TTL.search),
  addTransaction:             cache.mutates((data) => api.post('/AddTransactionDetails',     data), 'receipt', 'dash'),
  addTransactionItem:         cache.mutates((data) => api.post('/AddTransactionItemDetails', data), 'receipt'),
  loadTransactionItemDetails: cache.cached((data) => api.post('/LoadTransactionItemDetails', data), (d) => cache.makeKey('receipt:tx-item', d), TTL.search),
  updateTransaction:          cache.mutates((data) => api.post('/UpdateTransactionDetails',          data), 'receipt', 'dash'),
  updateTransactionItem:      cache.mutates((data) => api.post('/UpdateTransactionItemsDetails',     data), 'receipt'),
};

// ── Members ──────────────────────────────────────────────────────────────────
export const memberService = {
  loadMuminDetails:         cache.cached((filters) => api.post('/LoadMuminDetails',         filters), (f) => cache.makeKey('mumin',        f), TTL.search),
  loadFamilyMembersDetails: cache.cached((data)    => api.post('/LoadFamilyMembersDetails', data),    (d) => cache.makeKey('mumin:family',  d), TTL.search),
  loadFamilyMembersCount:   cache.cached((data)    => api.post('/LoadFamilyMembersCount',   data),    (d) => cache.makeKey('mumin:fcount',  d), TTL.search),
  updateMuminDetails:            cache.mutates((data) => api.post('/UpdateMuminDetails',            data), 'mumin'),
  addMuminDetails:               cache.mutates((data) => api.post('/AddMuminDetails',               data), 'mumin'),
  updateMuminDetailsFMB:         cache.mutates((data) => api.post('/UpdateMuminDetailsFMB',         data), 'mumin'),
  updateMuminDetailsVaj:         cache.mutates((data) => api.post('/UpdateMuminDetailsVaj',         data), 'mumin'),
  updateMuminDetailsSabeel:      cache.mutates((data) => api.post('/UpdateMuminDetailsSabeel',      data), 'mumin'),
  bulkUpdateMuminDetailsSabeel:  cache.mutates(()     => api.post('/BulkUpdateMuminDetailsSabeel',  {}),   'mumin'),
  loadMohallaDetails:       cache.cached((filters) => api.post('/LoadMohallaDetails',    filters), (f) => cache.makeKey('mohallah', f), TTL.ref),
};

// ── Takhmeen ─────────────────────────────────────────────────────────────────
export const takhmeenService = {
  loadDetails:          cache.cached((params) => api.post('/LoadTakhmeenDetails',         params), (p) => cache.makeKey('takhmeen',         p), TTL.list),
  bulkLoadHistory:      (data)  => api.post('/BulkLoadTakhmeenHistory', data),
  bulkAddDetails:       (data)  => api.post('/BulkAddTakhmeenDetails',  data),
  addDetails:    cache.mutates((data)  => api.post('/AddTakhmeenDetails',    data),   'takhmeen'),
  updateDetails: cache.mutates((data)  => api.post('/UpdateTakhmeenDetails', data),   'takhmeen'),
  deleteDetails: cache.mutates((data)  => api.delete('/DeleteTakhmeenDetails', { data }), 'takhmeen'),

  getAll:           cache.cached((params) => api.get('/takhmeen',          { params }), (p) => cache.makeKey('takhmeen:all',     p), TTL.list),
  getSummary:       cache.cached((params) => api.get('/takhmeen/summary',  { params }), (p) => cache.makeKey('takhmeen:sum',     p), TTL.list),
  create:           cache.mutates((data)  => api.post('/takhmeen',          data),      'takhmeen'),
  update:           cache.mutates((id, d) => api.put(`/takhmeen/${id}`,     d),         'takhmeen'),
  delete:           cache.mutates((id)    => api.delete(`/takhmeen/${id}`),             'takhmeen'),
  getNotDone:       cache.cached((params) => api.get('/takhmeen/not-done', { params }), (p) => cache.makeKey('takhmeen:notdone', p), TTL.list),
  getMuminTakhmeen: cache.cached((params) => api.get('/takhmeen/mumin',    { params }), (p) => cache.makeKey('takhmeen:mumin',   p), TTL.search),

  loadTakhmeenNotDoneList: cache.cached((data) => api.post('/LoadTakhmeenNotDoneList', data), (d) => cache.makeKey('takhmeen:notdone-list', d), TTL.list),
  loadNotContributeList:   cache.cached((data) => api.post('/LoadNotContributeList',   data), (d) => cache.makeKey('takhmeen:no-contrib',   d), TTL.list),
  loadGradeDetails:        cache.cached((data) => api.post('/LoadGradeDetails',        data), (d) => cache.makeKey('takhmeen:grades',        d), TTL.ref),
  loadHubHeadDetails:      cache.cached((data) => api.post('/LoadHubHeadDetails',      data), (d) => cache.makeKey('hub-head',               d), TTL.ref),
  updateTakhmeenReceived:  cache.mutates((data) => api.post('/UpdateTakhmeenReceived', data), 'takhmeen'),

  // Form template CRUD (DB-backed, replaces localStorage)
  loadFormTemplates:   ()     => api.post('/LoadTakhmeenFormTemplates', {}),
  addFormTemplate:     (data) => api.post('/AddTakhmeenFormTemplate',    data),
  updateFormTemplate:  (data) => api.post('/UpdateTakhmeenFormTemplate', data),
  deleteFormTemplate:  (id)   => api.post('/DeleteTakhmeenFormTemplate', { ID: id }),

  // Print button configs (DB-backed, replaces localStorage)
  loadPrintButtonConfig: (buttonId) => api.post('/LoadPrintButtonConfig', { ButtonId: buttonId }),
  savePrintButtonConfig: (data)     => api.post('/SavePrintButtonConfig', data),

  // Alert rules (DB-backed, replaces hardcoded REQUIRED_TAKHMEEN in AlertBanners)
  loadRequiredTakhmeenRules: cache.cached(
    () => api.post('/LoadRequiredTakhmeenRules', {}),
    () => 'takhmeen:required-rules',
    TTL.lookup
  ),
  loadAllRequiredTakhmeenRules: () => api.post('/LoadAllRequiredTakhmeenRules', {}),
  saveRequiredTakhmeenRule:   cache.mutates((data) => api.post('/SaveRequiredTakhmeenRule',   data), 'takhmeen:required-rules'),
  deleteRequiredTakhmeenRule: cache.mutates((data) => api.post('/DeleteRequiredTakhmeenRule', data), 'takhmeen:required-rules'),
};

// ── Vajebaat ─────────────────────────────────────────────────────────────────
export const vajebaatService = {
  getByAccno:    (accno)   => api.get(`/vajebaat/${accno}`),
  save:          (data)    => api.post('/vajebaat', data),
  getHIM:        (accno)   => api.get(`/vajebaat/${accno}/him`),
  saveHIM:       (data)    => api.post('/vajebaat/him', data),
  getSNiyaz:     (accno)   => api.get(`/vajebaat/${accno}/sniyaz`),
  saveSNiyaz:    (data)    => api.post('/vajebaat/sniyaz', data),
  getSilaFitra:  (accno)   => api.get(`/vajebaat/${accno}/sila-fitra`),
  loadSilaFitra:   (data)  => api.post('/LoadSilaFitraDetails',   data),
  addSilaFitra:    (data)  => api.post('/AddSilaFitraDetails',    data),
  updateSilaFitra: (data)  => api.post('/UpdateSilaFitraDetails', data),
  deleteSilaFitra: (data)  => api.delete('/DeleteSilaFitraDetails', { data }),
};

// ── Safai Chitthi ────────────────────────────────────────────────────────────
export const safaiService = {
  getAll:        (params)  => api.get('/safai-chitthi', { params }),
  getByAccno:    (accno)   => api.get(`/safai-chitthi/${accno}`),
  create:        (data)    => api.post('/safai-chitthi', data),
  update:        (id, data)=> api.put(`/safai-chitthi/${id}`, data),
  cancel:        (id)      => api.put(`/safai-chitthi/${id}/cancel`),

  loadRazaDetails:         cache.cached((data) => api.post('/LoadRazaDetails',         data), (d) => cache.makeKey('raza',          d), TTL.search),
  addRazaDetails:          cache.mutates((data) => api.post('/AddRazaDetails',         data), 'raza'),
  updateRazaDetails:       cache.mutates((data) => api.post('/UpdateRazaDetails',      data), 'raza'),
  deleteRazaDetails:       cache.mutates((data) => api.delete('/DeleteRazaDetails',    { data }), 'raza'),
  loadRazaDropdownDetails: cache.cached((data) => api.post('/LoadRazaDropdownDetails', data), (d) => cache.makeKey('raza:dropdown',  d), TTL.ref),
};

// ── Due ──────────────────────────────────────────────────────────────────────
export const dueService = {
  getGeneralDue:         cache.cached((params) => api.get('/due/general',         { params }), (p) => cache.makeKey('due:general', p), TTL.list),
  loadGeneralDueDetails: cache.cached((data)   => api.post('/LoadGeneralDueDetails', data),   (d) => cache.makeKey('due:load',    d), TTL.list),
  sendBulkSMS:           (ids)    => api.post('/due/bulk-sms', { ids }),
  export:                (params) => api.get('/due/export', { params, responseType: 'blob' }),
};

// ── Follow Up ────────────────────────────────────────────────────────────────
export const followupService = {
  getAll:     (params)     => api.get('/followup', { params }),
  getByAccno: (accno)      => api.get('/followup', { params: { accno } }),
  create:     (data)       => api.post('/followup', data),
  update:     (id, data)   => api.put(`/followup/${id}`, data),
  close:      (id)         => api.post(`/followup/${id}/close`),
  reopen:     (id)         => api.post(`/followup/${id}/reopen`),
  delete:     (id)         => api.delete(`/followup/${id}`),
};

// ── Expenses ─────────────────────────────────────────────────────────────────
export const expenseService = {
  getAll:        cache.cached((params) => api.get('/expenses',        { params }), (p) => cache.makeKey('expense:all',    p), TTL.list),
  create:        cache.mutates((data)  => api.post('/expenses',        data),      'expense'),
  update:        cache.mutates((id, d) => api.put(`/expenses/${id}`,   d),         'expense'),
  delete:        cache.mutates((id)    => api.delete(`/expenses/${id}`),           'expense'),
  getReport:     cache.cached((params) => api.get('/expenses/report', { params }), (p) => cache.makeKey('expense:report', p), TTL.report),
  getCategories: cache.cached(() => api.get('/expenses/categories'),               () => 'expense:cats',                      TTL.ref),

  loadExpenseDetails:   cache.cached((data) => api.post('/LoadExpenseDetails',   data), (d) => cache.makeKey('expense:load', d), TTL.search),
  addExpenseDetails:    cache.mutates((data) => api.post('/AddExpenseDetails',    data), 'expense'),
  updateExpenseDetails: cache.mutates((data) => api.post('/UpdateExpenseDetails', data), 'expense'),
  deleteExpenseDetails: cache.mutates((data) => api.delete('/DeleteExpenseDetails', { data }), 'expense'),
};

// ── Income Head (Hub Head) ────────────────────────────────────────────────────
export const incomeHeadService = {
  load:   cache.cached((data) => api.post('/LoadHubHeadDetails',   data), (d) => cache.makeKey('income-head', d), TTL.ref),
  add:    cache.mutates((data) => api.post('/AddHubHeadDetails',    data), 'income-head', 'hub-head'),
  update: cache.mutates((data) => api.post('/UpdateHubHeadDetails', data), 'income-head', 'hub-head'),
  delete: cache.mutates((data) => api.delete('/DeleteHubHeadDetails', { data }), 'income-head', 'hub-head'),
};

// ── Expense Head ──────────────────────────────────────────────────────────────
export const expenseHeadService = {
  load:   cache.cached((data) => api.post('/LoadExpenseHeadDetails',   data), (d) => cache.makeKey('expense-head', d), TTL.ref),
  add:    cache.mutates((data) => api.post('/AddExpenseHeadDetails',    data), 'expense-head'),
  update: cache.mutates((data) => api.post('/UpdateExpenseHeadDetails', data), 'expense-head'),
  delete: cache.mutates((data) => api.delete('/DeleteExpenseHeadDetails', { data }), 'expense-head'),
};

// ── Distribution ─────────────────────────────────────────────────────────────
export const distributionService = {
  getAll: cache.cached((params) => api.get('/distribution', { params }), (p) => cache.makeKey('distribution', p), TTL.list),
};

// ── Distributor Master ────────────────────────────────────────────────────────
export const distributorService = {
  load:   cache.cached((data) => api.post('/LoadDistributorDetails',   data), (d) => cache.makeKey('distributor', d), TTL.ref),
  add:    cache.mutates((data) => api.post('/AddDistributorDetails',    data), 'distributor', 'lookup:distributors'),
  update: cache.mutates((data) => api.post('/UpdateDistributorDetails', data), 'distributor', 'lookup:distributors'),
  remove: cache.mutates((data) => api.delete('/DeleteDistributorDetails', { data }), 'distributor', 'lookup:distributors'),
};

// ── Mohallah ─────────────────────────────────────────────────────────────────
export const mohallahService = {
  LoadMohallaDetails:              cache.cached((data) => api.post('/LoadMohallaDetails',               data), (d) => cache.makeKey('mohallah',       d), TTL.ref),
  AddMohallaDetails:               cache.mutates((data) => api.post('/AddMohallaDetails',               data), 'mohallah'),
  UpdateMohallaDetails:            cache.mutates((data) => api.post('/UpdateMohallaDetails',            data), 'mohallah'),
  DeleteMohallaDetails:            cache.mutates((data) => api.delete('/DeleteMohallaDetails',          { data }), 'mohallah'),
  LoadMohallaCordinatorsDetails:   cache.cached((data) => api.post('/LoadMohallaCordinatorsDetails',    data), (d) => cache.makeKey('mohallah:coord',  d), TTL.ref),
  AddMohallaCordinatorsDetails:    cache.mutates((data) => api.post('/AddMohallaCordinatorsDetails',    data), 'mohallah:coord'),
  UpdateMohallaCordinatorsDetails: cache.mutates((data) => api.post('/UpdateMohallaCordinatorsDetails', data), 'mohallah:coord'),
  DeleteMohallaCordinatorsDetails: cache.mutates((data) => api.delete('/DeleteMohallaCordinatorsDetails',{ data }), 'mohallah:coord'),
};

// ── Bookings ─────────────────────────────────────────────────────────────────
export const bookingService = {
  getAll:             (params)    => api.get('/bookings', { params }),
  create:             (data)      => api.post('/bookings', data),
  update:             (id, data)  => api.put(`/bookings/${id}`, data),
  delete:             (id)        => api.delete(`/bookings/${id}`),
  addEventDetails:    (data)      => api.post('/AddEventDetails',    data),
  loadEventDetails:   (data)      => api.post('/LoadEventDetails',   data),
  updateEventDetails: (data)      => api.post('/UpdateEventDetails', data),
  deleteEventDetails: (data)      => api.delete('/DeleteEventDetails', { data }),
};

// ── Majlis ───────────────────────────────────────────────────────────────────
export const majlisService = {
  load:   cache.cached((data) => api.post('/LoadMajlisRegistrations',  data), (d) => cache.makeKey('majlis', d), TTL.search),
  add:    cache.mutates((data) => api.post('/AddMajlisRegistration',   data), 'majlis'),
  update: cache.mutates((data) => api.post('/UpdateMajlisRegistration', data), 'majlis'),
  delete: cache.mutates((data) => api.delete('/DeleteMajlisRegistration', { data }), 'majlis'),
};

// ── Users (legacy) ───────────────────────────────────────────────────────────
export const userService = {
  getAll:           ()       => api.get('/users'),
  create:           (data)   => api.post('/users', data),
  update:           (id, d)  => api.put(`/users/${id}`, d),
  updatePermissions:(id, d)  => api.put(`/users/${id}/permissions`, d),
  resetPassword:    (id)     => api.post(`/users/${id}/reset-password`),
};

// ── RBAC — Industry-standard access control ──────────────────────────────────
export const rbacService = {
  // Users
  getUsers:         ()           => api.get('/rbac/users'),
  getUser:          (id)         => api.get(`/rbac/users/${id}`),
  createUser:       (data)       => api.post('/rbac/users', data),
  updateUser:       (id, data)   => api.put(`/rbac/users/${id}`, data),
  resetPassword:    (id, data)   => api.post(`/rbac/users/${id}/reset-password`, data),
  assignRole:       (id, data)   => api.put(`/rbac/users/${id}/role`, data),
  assignScopes:     (id, data)   => api.put(`/rbac/users/${id}/scopes`, data),
  // Roles
  getRoles:         ()           => api.get('/rbac/roles'),
  getRole:          (id)         => api.get(`/rbac/roles/${id}`),
  createRole:       (data)       => api.post('/rbac/roles', data),
  updateRole:       (id, data)   => api.put(`/rbac/roles/${id}`, data),
  setRolePermissions:(id, data)  => api.put(`/rbac/roles/${id}/permissions`, data),
  // Permissions
  getPermissions:    ()          => api.get('/rbac/permissions'),
  createPermission:  (data)      => api.post('/rbac/permissions', data),
  updatePermission:  (id, data)  => api.put(`/rbac/permissions/${id}`, data),
  deletePermission:  (id)        => api.delete(`/rbac/permissions/${id}`),
  // Scopes
  getScopes:         ()          => api.get('/rbac/scopes'),
  createScope:       (data)      => api.post('/rbac/scopes', data),
  updateScope:       (id, data)  => api.put(`/rbac/scopes/${id}`, data),
  deleteScope:       (id)        => api.delete(`/rbac/scopes/${id}`),
  // Audit
  getAuditLogs:     (params)     => api.get('/rbac/audit-logs', { params }),
  clearAuditLogs:   ()           => api.delete('/rbac/audit-logs'),
};

// ── FMB Menu ─────────────────────────────────────────────────────────────────
export const fmbMenuService = {
  getAll:        (params)    => api.get('/fmb-menu', { params }),
  create:        (data)      => api.post('/fmb-menu', data),
  update:        (id, data)  => api.put(`/fmb-menu/${id}`, data),
  remove:        (id)        => api.delete(`/fmb-menu/${id}`),
  closeFeedback:  (id)       => api.post(`/fmb-menu/${id}/close-feedback`),
  reopenFeedback: (id)       => api.post(`/fmb-menu/${id}/reopen-feedback`),
};

// ── FMB Menu Feedback ─────────────────────────────────────────────────────────
export const fmbFeedbackService = {
  // Public (token-based — never exposes numeric id)
  getMenuByToken: (token)        => api.get(`/fmb-menu/token/${token}`),
  submitByToken:  (token, data)  => api.post(`/fmb-menu/token/${token}/feedback`, data),
  // Admin (numeric id, auth required)
  getAll:         (menuId)       => api.get(`/fmb-menu/${menuId}/feedback`),
  getSummary:     (menuId)       => api.get(`/fmb-menu/${menuId}/feedback/summary`),
};


// ── Utility ──────────────────────────────────────────────────────────────────
export const utilityService = {
  updateTakhmeenDetails: () => api.post('/utility/update-takhmeen-details'),
  updateMohallahNames:   () => api.post('/utility/update-mohallah-names'),
  countNotes:            (data) => api.post('/utility/count-notes', data),
  recalcDues:            () => api.post('/utility/recalc-dues'),
  clearCache:            async () => { cache.clear(); return api.post('/utility/clear-cache'); },
  backupData:            () => api.post('/utility/backup'),
  generateReport:        (type) => api.post('/utility/generate-report', { type }),
  getSchedules:          () => api.get('/utility/schedules'),
  saveSchedule:          (key, data) => api.put(`/utility/schedules/${key}`, data),
};

// ── System Variables ─────────────────────────────────────────────────────────
export const systemVarsService = {
  getAll:  (data) => api.post('/LoadSystemVariables',   data),
  save:    (data) => api.post('/SaveSystemVariable',    data),
  delete:  (data) => api.delete('/DeleteSystemVariable', { data }),
};

// ── Form Templates (custom print layouts) ────────────────────────────────────
export const formTemplateService = {
  // formData is a FormData object (multipart) containing formType, layoutJson, optional image file
  save:      (formData)  => api.post('/SaveFormTemplate',       formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByType: (type)      => api.get(`/GetFormTemplate/${type}`),
  list:      ()          => api.get('/ListFormTemplates'),
};

// ── Hall Seating Layout ───────────────────────────────────────────────────────
export const hallService = {
  // Halls
  loadLayouts:          cache.cached((data) => api.post('/LoadHallLayouts',   data), (d) => cache.makeKey('hall:layouts',  d), TTL.ref),
  addLayout:            cache.mutates((data) => api.post('/AddHallLayout',    data), 'hall:layouts'),
  updateLayout:         cache.mutates((data) => api.post('/UpdateHallLayout', data), 'hall:layouts'),
  deleteLayout:         cache.mutates((data) => api.delete('/DeleteHallLayout', { data }), 'hall:layouts'),

  // Sections
  loadSections:         cache.cached((data) => api.post('/LoadHallSections',   data), (d) => cache.makeKey('hall:sections', d), TTL.ref),
  addSection:           cache.mutates((data) => api.post('/AddHallSection',    data), 'hall:sections'),
  updateSection:        cache.mutates((data) => api.post('/UpdateHallSection', data), 'hall:sections'),
  deleteSection:        cache.mutates((data) => api.delete('/DeleteHallSection', { data }), 'hall:sections'),

  // Seating
  loadSeatGrid:         cache.cached((data) => api.post('/LoadSeatGrid',           data), (d) => cache.makeKey('hall:grid',    d), TTL.search),
  allocateSeat:         cache.mutates((data) => api.post('/AllocateSeat',          data), 'hall:grid'),
  blockSeat:            cache.mutates((data) => api.post('/BlockSeat',             data), 'hall:grid'),
  clearSeat:            cache.mutates((data) => api.post('/ClearSeat',             data), 'hall:grid'),
  clearAllSeats:        cache.mutates((data) => api.post('/ClearAllSeats',         data), 'hall:grid'),
  autoAssignSeats:      cache.mutates((data) => api.post('/AutoAssignSeats',       data), 'hall:grid'),
  loadMembersForAssign: cache.cached((data) => api.post('/LoadMembersForAssign',   data), (d) => cache.makeKey('hall:members', d), TTL.search),
  blockSeatRange:       cache.mutates((data) => api.post('/BlockSeatRange',        data), 'hall:grid'),
  clearSeatRange:       cache.mutates((data) => api.post('/ClearSeatRange',        data), 'hall:grid'),
};

// ── Void Seats ────────────────────────────────────────────────────────────────
export const voidService = {
  loadVoidGroups: cache.cached((data) => api.post('/LoadVoidGroups',  data), (d) => cache.makeKey('hall:void', d), TTL.ref),
  saveVoidGroups: cache.mutates((data) => api.post('/SaveVoidGroups', data), 'hall:void'),
};

// ── Seating Lookups ───────────────────────────────────────────────────────────
export const seatingLookupService = {
  loadLookups:    cache.cached((data) => api.post('/LoadSeatingLookups', data), (d) => cache.makeKey('seating:lookups', d), TTL.ref),
  addLookupValue: cache.mutates((data) => api.post('/AddLookupValue',    data), 'seating:lookups'),
};

// ── Lookup helpers ────────────────────────────────────────────────────────────
export const lookupService = {
  getMohallahs:    cache.cached(() => api.get('/lookup/mohallahs'),       () => 'lookup:mohallahs',     TTL.lookup),
  getDistributors: cache.cached(() => api.get('/lookup/distributors'),    () => 'lookup:distributors',  TTL.lookup),
  getAreas:        cache.cached(() => api.get('/lookup/areas'),           () => 'lookup:areas',         TTL.lookup),
  getYears:        cache.cached(() => api.get('/lookup/years'),           () => 'lookup:years',         TTL.lookup),
  getGrades:       cache.cached(() => api.get('/lookup/grades'),          () => 'lookup:grades',        TTL.lookup),
  getSabeelTypes:  cache.cached(() => api.get('/lookup/sabeel-types'),    () => 'lookup:sabeel-types',  TTL.lookup),
  getThaliStatuses:cache.cached(() => api.get('/lookup/thali-statuses'),  () => 'lookup:thali-statuses',TTL.lookup),
  getThaliSizes:   cache.cached(() => api.get('/lookup/thali-sizes'),     () => 'lookup:thali-sizes',   TTL.lookup),
  getStayingIn:       cache.cached(() => api.get('/lookup/staying-in'),         () => 'lookup:staying-in',         TTL.lookup),
  getMajlisData:        cache.cached(() => api.get('/lookup/majlis-data'),        () => 'lookup:majlis-data',        TTL.ref),
  getMohallaData:       cache.cached(() => api.get('/lookup/mohalla-data'),       () => 'lookup:mohalla-data',       TTL.ref),
};

// ── WhatsApp ──────────────────────────────────────────────────────────────────
export const whatsappService = {
  getStatus:       ()     => api.get('/WhatsAppStatus'),
  start:           ()     => api.post('/WhatsAppStart'),
  logout:          ()     => api.post('/WhatsAppLogout'),
  clearSession:    ()     => api.post('/WhatsAppClearSession'),
  sendReceipt:     (data) => api.post('/SendReceiptWhatsApp',    data),
  sendDueReminder: (data) => api.post('/SendDueReminderWhatsApp', data),
};

// ── WhatsApp Queue ────────────────────────────────────────────────────────────
export const waQueueService = {
  create:  (data)  => api.post('/WaQueue', data),
  active:  ()      => api.get('/WaQueue/active'),
  recent:  (limit) => api.get('/WaQueue/recent', { params: { limit } }),
  batch:   (id)    => api.get(`/WaQueue/batch/${id}`),
  items:   (id)    => api.get(`/WaQueue/batch/${id}/items`),
  logs:    (id)    => api.get(`/WaQueue/batch/${id}/logs`),
  pause:   (id)    => api.post(`/WaQueue/batch/${id}/pause`),
  resume:  (id)    => api.post(`/WaQueue/batch/${id}/resume`),
  cancel:  (id)    => api.post(`/WaQueue/batch/${id}/cancel`),
  retry:   (id)    => api.post(`/WaQueue/batch/${id}/retry`),
};

// ── WhatsApp Templates ────────────────────────────────────────────────────────
export const waTemplateService = {
  getMeta:        ()            => api.get('/WaTemplateMeta'),
  getAll:         ()            => api.get('/WaTemplates'),
  getByKey:       (key)         => api.get(`/WaTemplates/${key}`),
  save:           (key, data)   => api.post(`/WaTemplates/${key}`, data),
  create:         (data)        => api.post('/WaTemplates', data),
  delete:         (key)         => api.delete(`/WaTemplates/${key}`),
  resetToDefault: (key)         => api.post(`/WaTemplates/${key}/reset`),
};

// ── Event Registration Forms ──────────────────────────────────────────────────
export const regFormService = {
  // Forms
  loadForms:     cache.cached((d) => api.post('/LoadRegForms',   d), (d) => cache.makeKey('regforms', d), TTL.list),
  getFormById:   cache.cached((d) => api.post('/GetRegFormById', d), (d) => cache.makeKey('regform',  d), TTL.search),
  addForm:       cache.mutates((d) => api.post('/AddRegForm',    d), 'regforms'),
  updateForm:    cache.mutates((d) => api.post('/UpdateRegForm', d), 'regforms'),
  deleteForm:    cache.mutates((d) => api.delete('/DeleteRegForm', { data: d }), 'regforms'),
  // Questions + Sections
  loadQuestions: cache.cached((d) => api.post('/LoadFormQuestions', d), (d) => cache.makeKey('regform:q', d), TTL.search),
  saveQuestions: cache.mutates((d) => api.post('/SaveFormQuestions', d), 'regforms', 'regform:q'),
  loadSections:  cache.cached((d) => api.post('/LoadFormSections',  d), (d) => cache.makeKey('regform:s', d), TTL.search),
  saveFormData:  cache.mutates((d) => api.post('/SaveFormData',     d), 'regforms', 'regform:q', 'regform:s'),
  // Question bank
  loadBank:      cache.cached((d) => api.post('/LoadQuestionBank',   d), () => 'regbank', TTL.ref),
  addBank:       cache.mutates((d) => api.post('/AddBankQuestion',    d), 'regbank'),
  updateBank:    cache.mutates((d) => api.post('/UpdateBankQuestion', d), 'regbank'),
  deleteBank:    cache.mutates((d) => api.delete('/DeleteBankQuestion', { data: d }), 'regbank'),
  // Responses (admin)
  loadResponses:  (d) => api.post('/LoadRegResponses',   d),
  getResponse:    (d) => api.post('/GetRegResponseById', d),
  updateResponse: (d) => api.post('/UpdateRegResponse',  d),
  deleteResponse: (d) => api.delete('/DeleteRegResponse',  { data: d }),
  clearResponses: (d) => api.delete('/ClearFormResponses', { data: d }),
};

// ── ITS Data ──────────────────────────────────────────────────────────────────
export const itsService = {
  search:       (filters) => api.post('/SearchITSData', filters),
  importData:   (data)    => api.post('/ImportITSData', data),
  getDistincts: ()        => api.get('/GetITSDistincts'),
};

// Public — no auth (members filling the form)
// Uses publicApi: no token attached, no redirect to /login on errors.
export const regFormPublic = {
  getFormByToken:  (token) => publicApi.get(`/reg-form/token/${token}`),
  getForm:         (d) => publicApi.post('/GetRegFormById/public',    d),
  getQuestions:    (d) => publicApi.post('/LoadFormQuestions/public', d),
  getSections:     (d) => publicApi.post('/LoadFormSections/public',  d),
  checkDup:        (d) => publicApi.post('/CheckRegDuplicate',        d),
  submit:          (d) => publicApi.post('/SubmitRegForm',             d),
  submitFamily:    (d) => publicApi.post('/SubmitFamilyRegistration', d),
  loadForEdit:         (d) => publicApi.post('/LoadRegResponseForEdit',          d),
  loadFamilyResponses: (d) => publicApi.post('/LoadAllFamilyResponses/public',  d),
  updateResponse:      (d) => publicApi.post('/UpdateRegResponse/public',        d),
  deleteResponse:      (d) => publicApi.delete('/DeleteRegResponse/public', { data: d }),
  // Public member lookup — no auth required
  lookupByITS:   (d) => publicApi.post('/reg-form/member/its',   d),
  lookupByAccNo: (d) => publicApi.post('/reg-form/member/accno', d),
};


// testing