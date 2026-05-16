// src/services/index.js
// All API calls. Each function maps to a backend endpoint / stored procedure.

import api from '@/lib/api';

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats:              ()       => api.get('/dashboard/stats'),
  getRecentTransactions: (limit=5)=> api.get(`/dashboard/recent?limit=${limit}`),
};

// ── Receipts ─────────────────────────────────────────────────────────────────
export const receiptService = {
  save:          (data)    => api.post('/receipts', data),
  update:        (id, data)=> api.put(`/receipts/${id}`, data),
  cancel:        (id)      => api.put(`/receipts/${id}/cancel`),
  delete:        (id)      => api.delete(`/receipts/${id}`),
  getDailyReport:(params)  => api.get('/receipts/daily', { params }),
  getDailyTotals:(params)  => api.get('/receipts/daily/totals', { params }),
  getDailyItemTotals:(params)=> api.get('/receipts/daily/item-totals', { params }),
  print:         (id)      => api.get(`/receipts/${id}/print`),
  loadTransactionDetails: (data) => api.post('/LoadTransactionDetails', data),
  addTransaction:         (data) => api.post('/AddTransactionDetails',     data),
  addTransactionItem:     (data) => api.post('/AddTransactionItemDetails', data),
  loadTransactionItemDetails:  (data) => api.post('/LoadTransactionItemDetails',   data),
  updateTransaction:           (data) => api.post('/UpdateTransactionDetails',     data),
  updateTransactionItem:       (data) => api.post('/UpdateTransactionItemsDetails',data),
};

// ── Members ──────────────────────────────────────────────────────────────────
export const memberService = {
  // search:        (params)  => api.post('/members/search', { params }),
  // getByAccno:    (accno)   => api.post(`/members/${accno}`),
  // create:        (data)    => api.post('/members', data),
  // update:        (accno, data) => api.put(`/members/${accno}`, data),
  // resetPassword: (accno)   => api.post(`/members/${accno}/reset-password`),
  // getFamily:     (accno)   => api.post(`/members/${accno}/family`),
  // getItsData:    (accno)   => api.post(`/members/${accno}/its-data`),
  // getOverallDue: (accno)   => api.post(`/members/${accno}/overall-due`),
  // getSabeelDue:  (accno)   => api.post(`/members/${accno}/sabeel-due`),
  loadMuminDetails:          (filters) => api.post('/LoadMuminDetails',          filters),
  loadFamilyMembersDetails:  (data)    => api.post('/LoadFamilyMembersDetails',  data),
  loadFamilyMembersCount:    (data)    => api.post('/LoadFamilyMembersCount',    data),
  updateMuminDetails:        (data)    => api.post('/UpdateMuminDetails',        data),
  addMuminDetails:           (data)    => api.post('/AddMuminDetails',           data),
  updateMuminDetailsFMB:     (data)    => api.post('/UpdateMuminDetailsFMB',     data),
  updateMuminDetailsVaj:     (data)    => api.post('/UpdateMuminDetailsVaj',     data),
  loadMohallaDetails:        (filters) => api.post('/LoadMohallaDetails',        filters),
};

// ── Takhmeen ─────────────────────────────────────────────────────────────────
export const takhmeenService = {
  // SP-based endpoints
  loadDetails:   (params) => api.post('/LoadTakhmeenDetails',   params),
  addDetails:    (data)   => api.post('/AddTakhmeenDetails',    data),
  updateDetails: (data)   => api.post('/UpdateTakhmeenDetails', data),
  deleteDetails: (data)   => api.delete('/DeleteTakhmeenDetails', { data }),

  // Legacy REST endpoints (used by mumin-takhmeen list page)
  getAll:          (params)      => api.get('/takhmeen',           { params }),
  getSummary:      (params)      => api.get('/takhmeen/summary',   { params }),
  create:          (data)        => api.post('/takhmeen',           data),
  update:          (id, data)    => api.put(`/takhmeen/${id}`,      data),
  delete:          (id)          => api.delete(`/takhmeen/${id}`),
  getNotDone:      (params)      => api.get('/takhmeen/not-done',  { params }),
  getMuminTakhmeen:(params)      => api.get('/takhmeen/mumin',     { params }),

  loadTakhmeenNotDoneList:   (data) => api.post('/LoadTakhmeenNotDoneList',   data),
  loadNotContributeList:     (data) => api.post('/LoadNotContributeList',     data),
  loadGradeDetails:          (data) => api.post('/LoadGradeDetails',          data),
  loadHubHeadDetails:        (data) => api.post('/LoadHubHeadDetails',        data),
  updateTakhmeenReceived:    (data) => api.post('/UpdateTakhmeenReceived',    data),
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

  loadRazaDetails:        (data) => api.post('/LoadRazaDetails',        data),
  addRazaDetails:         (data) => api.post('/AddRazaDetails',         data),
  updateRazaDetails:      (data) => api.post('/UpdateRazaDetails',      data),
  deleteRazaDetails:      (data) => api.delete('/DeleteRazaDetails',    { data }),
  loadRazaDropdownDetails:(data) => api.post('/LoadRazaDropdownDetails', data),
};

// ── Due ──────────────────────────────────────────────────────────────────────
export const dueService = {
  getGeneralDue:         (params) => api.get('/due/general', { params }),
  loadGeneralDueDetails: (data)   => api.post('/LoadGeneralDueDetails', data),
  sendBulkSMS:           (ids)    => api.post('/due/bulk-sms', { ids }),
  export:                (params) => api.get('/due/export', { params, responseType: 'blob' }),
};

// ── Follow Up ────────────────────────────────────────────────────────────────
export const followupService = {
  getAll:  (params)        => api.get('/followup', { params }),
  create:  (data)          => api.post('/followup', data),
  update:  (id, data)      => api.put(`/followup/${id}`, data),
  delete:  (id)            => api.delete(`/followup/${id}`),
};

// ── Expenses ─────────────────────────────────────────────────────────────────
export const expenseService = {
  getAll:     (params)     => api.get('/expenses', { params }),
  create:     (data)       => api.post('/expenses', data),
  update:     (id, data)   => api.put(`/expenses/${id}`, data),
  delete:     (id)         => api.delete(`/expenses/${id}`),
  getReport:  (params)     => api.get('/expenses/report', { params }),
  getCategories:()         => api.get('/expenses/categories'),

  // SP-based endpoints
  loadExpenseDetails:   (data) => api.post('/LoadExpenseDetails',   data),
  addExpenseDetails:    (data) => api.post('/AddExpenseDetails',    data),
  updateExpenseDetails: (data) => api.post('/UpdateExpenseDetails', data),
  deleteExpenseDetails: (data) => api.delete('/DeleteExpenseDetails', { data }),
};

// ── Income Head (Hub Head) ────────────────────────────────────────────────────
export const incomeHeadService = {
  load:   (data)  => api.post('/LoadHubHeadDetails',   data),
  add:    (data)  => api.post('/AddHubHeadDetails',    data),
  update: (data)  => api.post('/UpdateHubHeadDetails', data),
  delete: (data)  => api.delete('/DeleteHubHeadDetails', { data }),
};

// ── Expense Head ──────────────────────────────────────────────────────────────
export const expenseHeadService = {
  load:   (data)  => api.post('/LoadExpenseHeadDetails',   data),
  add:    (data)  => api.post('/AddExpenseHeadDetails',    data),
  update: (data)  => api.post('/UpdateExpenseHeadDetails', data),
  delete: (data)  => api.delete('/DeleteExpenseHeadDetails', { data }),
};

// ── Distribution ─────────────────────────────────────────────────────────────
export const distributionService = {
  getAll:  (params)        => api.get('/distribution', { params }),
  update:  (id, data)      => api.put(`/distribution/${id}`, data),
};

// ── Mohallah ─────────────────────────────────────────────────────────────────
export const mohallahService = {
  LoadMohallaDetails:               (data) => api.post('/LoadMohallaDetails',               data),
  AddMohallaDetails:                (data) => api.post('/AddMohallaDetails',                data),
  UpdateMohallaDetails:             (data) => api.post('/UpdateMohallaDetails',             data),
  DeleteMohallaDetails:             (data) => api.delete('/DeleteMohallaDetails',           { data }),
  LoadMohallaCordinatorsDetails:    (data) => api.post('/LoadMohallaCordinatorsDetails',    data),
  AddMohallaCordinatorsDetails:     (data) => api.post('/AddMohallaCordinatorsDetails',     data),
  UpdateMohallaCordinatorsDetails:  (data) => api.post('/UpdateMohallaCordinatorsDetails',  data),
  DeleteMohallaCordinatorsDetails:  (data) => api.delete('/DeleteMohallaCordinatorsDetails',{ data }),
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
  getAll:  (params)        => api.get('/majlis', { params }),
  create:  (data)          => api.post('/majlis', data),
  update:  (id, data)      => api.put(`/majlis/${id}`, data),
};

// ── Musaida ──────────────────────────────────────────────────────────────────
export const musaidaService = {
  getAll:  (params)        => api.get('/musaida', { params }),
  create:  (data)          => api.post('/musaida', data),
  update:  (id, data)      => api.put(`/musaida/${id}`, data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userService = {
  getAll:         ()       => api.get('/users'),
  create:         (data)   => api.post('/users', data),
  update:         (id, d)  => api.put(`/users/${id}`, d),
  updatePermissions:(id, d)=> api.put(`/users/${id}/permissions`, d),
  resetPassword:  (id)     => api.post(`/users/${id}/reset-password`),
};

// ── FMB Menu ─────────────────────────────────────────────────────────────────
export const fmbMenuService = {
  getAll:  (params)        => api.get('/fmb-menu', { params }),
  create:  (data)          => api.post('/fmb-menu', data),
  update:  (id, data)      => api.put(`/fmb-menu/${id}`, data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll:      ()          => api.get('/notifications'),
  create:      (data)      => api.post('/notifications', data),
  update:      (id, data)  => api.put(`/notifications/${id}`, data),
  markRead:    (id)        => api.patch(`/notifications/${id}/read`),
  markAllRead: ()          => api.patch('/notifications/read-all'),
  delete:      (id)        => api.delete(`/notifications/${id}`),
};

// ── Sabeel Statistics ─────────────────────────────────────────────────────────
export const sabeelStatsService = {
  getSummary:          (params) => api.get('/sabeel/statistics/summary',           { params }),
  getByYear:           (year)   => api.get(`/sabeel/statistics/${year}`),
  getMohallahBreakdown:(year)   => api.get(`/sabeel/statistics/${year}/mohallah`),
};

// ── FMB Statistics ────────────────────────────────────────────────────────────
export const fmbStatsService = {
  getSummary:  (params) => api.get('/fmb/statistics/summary',         { params }),
  getMonthly:  (year)   => api.get(`/fmb/statistics/${year}/monthly`),
  getMohallah: (year)   => api.get(`/fmb/statistics/${year}/mohallah`),
  getThaali:   (params) => api.get('/fmb/statistics/thaali',          { params }),
};

// ── Ohbat Majlis ─────────────────────────────────────────────────────────────
export const ohbatService = {
  getAll:    (params)    => api.get('/ohbat-majlis',                   { params }),
  create:    (data)      => api.post('/ohbat-majlis', data),
  update:    (id, data)  => api.put(`/ohbat-majlis/${id}`, data),
  delete:    (id)        => api.delete(`/ohbat-majlis/${id}`),
  addMember: (id, data)  => api.post(`/ohbat-majlis/${id}/members`, data),
};

// ── Utility ──────────────────────────────────────────────────────────────────
export const utilityService = {
  updateTakhmeenDetails: ()      => api.post('/utility/update-takhmeen-details'),
  updateMohallahNames:   ()      => api.post('/utility/update-mohallah-names'),
  countNotes:            (data)  => api.post('/utility/count-notes', data),
  recalcDues:            ()      => api.post('/utility/recalc-dues'),
  clearCache:            ()      => api.post('/utility/clear-cache'),
  backupData:            ()      => api.post('/utility/backup'),
  generateReport:        (type)  => api.post('/utility/generate-report', { type }),
};

// ── Lookup helpers ────────────────────────────────────────────────────────────
export const lookupService = {
  getMohallahs:   ()       => api.get('/lookup/mohallahs'),
  getDistributors:()       => api.get('/lookup/distributors'),
  getAreas:       ()       => api.get('/lookup/areas'),
  getYears:       ()       => api.get('/lookup/years'),
};
