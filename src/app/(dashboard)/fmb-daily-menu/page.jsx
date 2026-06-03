'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fmbMenuService } from '@/services';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';

import { FIELDS, blank, defaultItems, firstOfMonth, lastOfMonth, toDateInput } from './_components/constants';
import FilterBar            from './_components/FilterBar';
import MenuTable            from './_components/MenuTable';
import PublicMenuView       from './_components/PublicMenuView';
import MenuFormModal        from './_components/MenuFormModal';
import FeedbackSummaryModal from './_components/FeedbackSummaryModal';

const MEAL_TYPE_SEEDS = ['Thali', 'Lunch', 'Dinner'];

export default function FMBDailyMenuPage() {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(blank());
  const [rowOrders, setRowOrders] = useState({});
  const [fromDate,    setFromDate]    = useState(firstOfMonth);
  const [toDate,      setToDate]      = useState(lastOfMonth);
  const [filterType,  setFilterType]  = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [feedbackRow,  setFeedbackRow]  = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fmbMenuService.getAll(); setRows(res.data.data ?? res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── suggestions ──
  const suggestions = useMemo(() => {
    const map = {};
    FIELDS.forEach(f => {
      map[f.key] = [...new Set(rows.map(r => r[f.key]).filter(v => v && v.trim()))];
    });
    return map;
  }, [rows]);

  const mealTypeSuggestions = useMemo(() => {
    const fromDB = rows.map(r => r.meal_type).filter(v => v && v.trim());
    return [...new Set([...MEAL_TYPE_SEEDS, ...fromDB])];
  }, [rows]);

  const eventSuggestions = useMemo(() =>
    [...new Set(rows.map(r => r.event).filter(v => v && v.trim()))],
  [rows]);

  // ── filtering ──
  const filtered = useMemo(() => rows.filter(r => {
    const d = r.menu_date?.slice(0, 10) ?? '';
    if (fromDate    && d < fromDate)                                                    return false;
    if (toDate      && d > toDate)                                                      return false;
    if (filterType  && !r.meal_type?.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (filterEvent && !r.event?.toLowerCase().includes(filterEvent.toLowerCase()))     return false;
    return true;
  }), [rows, fromDate, toDate, filterType, filterEvent]);

  // ── form handlers ──
  const openAdd  = () => { setEditing(null); setForm(blank()); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    const sanitized = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v === null || v === undefined ? '' : v])
    );
    setForm({ ...blank(), ...sanitized, menu_date: toDateInput(r.menu_date), feedback_close_date: toDateInput(r.feedback_close_date) });
    setModal(true);
  };
  const onChange = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.menu_date || !form.meal_type) { toast.error('Date and meal type are required'); return; }
    try {
      if (editing) {
        await fmbMenuService.update(editing.id, form);
        setRowOrders(p => { const n = { ...p }; delete n[editing.id]; return n; });
        toast.success('Updated');
      } else {
        await fmbMenuService.create(form);
        toast.success('Menu added');
      }
      setModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const remove = async (r) => {
    if (!confirm(`Delete ${r.meal_type} entry for ${r.menu_date}?`)) return;
    try { await fmbMenuService.remove(r.id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  // ── public view ──
  const getItems = (r) => rowOrders[r.id] ?? defaultItems(r);

  const moveItem = (r, idx, dir) => {
    const items = [...getItems(r)];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    setRowOrders(p => ({ ...p, [r.id]: items }));
  };

  const copyLine = (line) =>
    navigator.clipboard.writeText(line).then(() => toast.success('Copied to clipboard'));

  const sendWA = (line) =>
    window.open('https://wa.me/?text=' + encodeURIComponent(line), '_blank');

  const openFeedback = (r) => { setFeedbackRow(r); setFeedbackOpen(true); };

  const forceClose = async (r) => {
    try {
      await fmbMenuService.closeFeedback(r.id);
      toast.success('Feedback closed');
      load();
    } catch { toast.error('Failed to close feedback'); }
  };

  const revertClose = async (r) => {
    try {
      await fmbMenuService.reopenFeedback(r.id);
      toast.success('Feedback reopened (+4 days)');
      load();
    } catch { toast.error('Failed to reopen feedback'); }
  };

  return (
    <div>
      <PageHeader title="FMB Daily Menu" subtitle="Daily meal plan and food items management">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Menu</button>
      </PageHeader>

      <FilterBar
        fromDate={fromDate}
        toDate={toDate}
        filterType={filterType}
        filterEvent={filterEvent}
        mealTypeSuggestions={mealTypeSuggestions}
        eventSuggestions={eventSuggestions}
        onFromDate={setFromDate}
        onToDate={setToDate}
        onTypeChange={setFilterType}
        onEventChange={setFilterEvent}
        onClear={() => { setFromDate(firstOfMonth()); setToDate(lastOfMonth()); setFilterType(''); setFilterEvent(''); }}
      />

      <MenuTable
        rows={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={remove}
        onViewFeedback={openFeedback}
        onForceClose={forceClose}
        onRevertClose={revertClose}
      />

      <PublicMenuView
        rows={filtered}
        getItems={getItems}
        onMove={moveItem}
        onCopy={copyLine}
        onSendWA={sendWA}
      />

      <FeedbackSummaryModal
        open={feedbackOpen}
        menuRow={feedbackRow}
        onClose={() => setFeedbackOpen(false)}
      />

      <MenuFormModal
        open={modal}
        editing={editing}
        form={form}
        suggestions={suggestions}
        mealTypeSuggestions={mealTypeSuggestions}
        eventSuggestions={eventSuggestions}
        onChange={onChange}
        onSave={save}
        onClose={() => setModal(false)}
      />
    </div>
  );
}
