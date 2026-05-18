'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookingService, safaiService } from '@/services';
import AddSafaiChitthiModal from '@/app/(dashboard)/mumin-details/components/modals/AddSafaiChitthiModal';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

import {
  buildCalendar, groupBookingsByDay, toDateKey, toHijriString, EMPTY_EVENT_FORM,
} from './utils/hijri';
import CalendarGrid from './components/CalendarGrid';
import DayEventList from './components/DayEventList';
import AddEventModal from './components/AddEventModal';
import EditEventModal from './components/EditEventModal';

export default function CalendarPage() {
  const { permissions, user } = useAuth();
  const now = new Date();
  const todayKey = toDateKey(now);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);

  // ── Selected day (inline list) ───────────────────────────────────────────────
  const [selectedCell, setSelectedCell] = useState(null);

  // ── Add event modal ──────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_EVENT_FORM);
  const [addSaving, setAddSaving] = useState(false);

  // ── Edit event modal ─────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EVENT_FORM);
  const [editSaving, setEditSaving] = useState(false);

  // ── Add Safai Chitthi modal ───────────────────────────────────────────────────
  const [chitthiOpen,   setChitthiOpen]   = useState(false);
  const [chitthiForm,   setChitthiForm]   = useState({});
  const [chitthiSaving, setChitthiSaving] = useState(false);
  const [razaOpts,      setRazaOpts]      = useState([]);
  const [placeOpts,     setPlaceOpts]     = useState([]);
  const [timeOpts,      setTimeOpts]      = useState([]);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await bookingService.loadEventDetails({
        EventDate: `${year}-${String(month + 1).padStart(2, '0')}`,
      });
      const d = res.data;
      const raw = Array.isArray(d)                 ? d
                : Array.isArray(d?.data)            ? d.data
                : Array.isArray(d?.recordset)       ? d.recordset
                : Array.isArray(d?.recordsets?.[0]) ? d.recordsets[0]
                : [];
      const list = raw.map(b => ({
        id:         b.ID          ?? b.id,
        accNo:      b.AccNo       ?? b.accNo       ?? '',
        date:       (() => {
          const raw = b.EventDate ?? b.date ?? '';
          if (!raw) return '';
          const s = String(raw).trim();
          if (s.length > 10) {
            const d = new Date(s);
            if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          }
          return s.slice(0, 10);
        })(),
        hijriDate:  b.HijriDate   ?? b.hijriDate    ?? '',
        eventName:  b.EventName   ?? b.eventName    ?? '',
        fullName:   b.FullName    ?? b.fullName     ?? '',
        mobile:     b.Mobile      ?? b.mobile       ?? '',
        mobile1:    b.Mobile1     ?? b.mobile1      ?? '',
        itsNo:      b.ITSNo       ?? b.itsNo        ?? '',
        address:    b.Address     ?? b.address      ?? '',
        venue:      b.Place       ?? b.venue        ?? '',
        eventTime:  b.EventTime   ?? b.eventTime    ?? '',
        thaal:      b.Thaal       ?? b.thaal        ?? '',
        requestBy:  b.RequestedBy ?? b.requestBy    ?? '',
        createdBy:  b.CreatedBy   ?? b.createdBy    ?? '',
        remark:     b.Remark      ?? b.remark       ?? '',
        razaStatus:  b.RazaDetailStatus ?? b.RazaStatus ?? b.razaStatus,
        serialNo:    b.SerialNo    ?? b.serialNo    ?? null,
        requestDate: b.RequestDate ?? b.requestDate,
        updateReason:b.UpdateReason?? b.updateReason,
        updatedAt:   b.UpdatedAt   ?? b.updatedAt,
      }));
      setBookings(list);
    } catch {
      toast.error('Failed to load bookings');
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // ── Calendar grid data ───────────────────────────────────────────────────────
  const cells = buildCalendar(year, month);
  const bookingsByDay = groupBookingsByDay(bookings);

  // ── Navigation handlers ──────────────────────────────────────────────────────
  const prev = () => {
    setSelectedCell(null);
    month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  };
  const next = () => {
    setSelectedCell(null);
    month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1);
  };

  // ── Day click → show inline list (toggle off if same day) ───────────────────
  const handleCellClick = (cell) => {
    setSelectedCell(prev => prev?.key === cell.key ? null : cell);
  };

  // ── Open add modal from cell + button or from DayEventList ──────────────────
  const openAdd = (cell) => {
    const dateKey = cell?.key ?? '';
    setAddForm({
      ...EMPTY_EVENT_FORM,
      date: dateKey,
      hijriDate: toHijriString(dateKey),
      createdBy: user?.name || user?.username || '',
    });
    setAddOpen(true);
  };

  const setAddField = (key, val) => setAddForm(f => ({ ...f, [key]: val }));

  const saveAdd = async () => {
    if (!addForm.date || !addForm.eventName) {
      toast.error('Event date and name are required');
      return;
    }
    setAddSaving(true);
    try {
      await bookingService.addEventDetails({
        AccNo:       addForm.accNo,
        FullName:    addForm.fullName,
        Mobile:      addForm.mobile,
        Mobile1:     addForm.mobile1,
        ITSNo:       addForm.itsNo,
        Address:     addForm.address,
        EventName:   addForm.eventName,
        EventDate:   addForm.date,
        HijriDate:   addForm.hijriDate,
        Place:       addForm.venue,
        EventTime:   addForm.eventTime,
        Thaal:       addForm.thaal,
        Remark:      addForm.remark,
        RequestedBy: addForm.requestBy,
        RequestDate: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
        CreatedBy:   addForm.createdBy,
      });
      toast.success('Event saved');
      setAddOpen(false);
      setAddForm(EMPTY_EVENT_FORM);
      load();
    } catch {
      toast.error('Failed to save event');
    } finally {
      setAddSaving(false);
    }
  };

  // ── Open edit modal ──────────────────────────────────────────────────────────
  const openEdit = (booking) => {
    setEditForm({
      id: booking.id,
      accNo: booking.accNo ?? '',
      date: booking.date?.slice(0, 10) ?? '',
      hijriDate: booking.hijriDate ?? toHijriString(booking.date?.slice(0, 10) ?? ''),
      eventName: booking.eventName ?? booking.name ?? '',
      fullName: booking.fullName ?? '',
      mobile: booking.mobile ?? '',
      mobile1: booking.mobile1 ?? '',
      itsNo: booking.itsNo ?? '',
      address: booking.address ?? '',
      venue: booking.venue ?? booking.location ?? '',
      eventTime: booking.eventTime ?? '',
      thaal: booking.thaal ?? '',
      requestBy: booking.requestBy ?? '',
      createdBy: booking.createdBy ?? '',
      remark: booking.remark ?? '',
      serialNo:        String(booking.serialNo ?? booking.id ?? ''),
      requestDate:     booking.requestDate ?? '',
      razaStatus:      booking.razaStatus ?? '',
      updateReason:    booking.updateReason ?? '',
      updatedAt:       booking.updatedAt ?? '',
      reasonForUpdate: '',
    });
    setEditOpen(true);
  };

  const setEditField = (key, val) => setEditForm(f => ({ ...f, [key]: val }));

  const saveEdit = async () => {
    if (!editForm.date || !editForm.eventName) {
      toast.error('Event date and name are required');
      return;
    }
    if (!editForm.reasonForUpdate?.trim()) {
      toast.error('Reason for update is required');
      return;
    }
    setEditSaving(true);
    try {
      const updatedBy = user?.name || user?.username || '';
      await bookingService.updateEventDetails({
        ID:          editForm.id,
        AccNo:       editForm.accNo,
        FullName:    editForm.fullName,
        Mobile:      editForm.mobile,
        Mobile1:     editForm.mobile1,
        ITSNo:       editForm.itsNo,
        Address:     editForm.address,
        EventName:   editForm.eventName,
        EventDate:   editForm.date,
        HijriDate:   editForm.hijriDate,
        Place:       editForm.venue,
        EventTime:   editForm.eventTime,
        Thaal:       editForm.thaal,
        Remark:      editForm.remark,
        UpdateReason:`${editForm.reasonForUpdate.trim()} – Updated by: ${updatedBy}`,
        UpdatedAt:   (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`; })(),
      });
      toast.success('Event updated');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update event');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (booking) => {
    try {
      await bookingService.deleteEventDetails({ ID: booking.id });
      toast.success('Event deleted');
      load();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  // ── Raza status ───────────────────────────────────────────────────────────────
  const handleApproveRaza = async (booking) => {
    try {
      await safaiService.updateRazaDetails({ SerialNo: booking.serialNo, RazaStatus: 'Raza Done' });
      toast.success('Raza approved');
      load();
    } catch {
      toast.error('Failed to approve raza');
    }
  };

  const handleRevertRaza = async (booking) => {
    try {
      await safaiService.updateRazaDetails({ SerialNo: booking.serialNo, RazaStatus: 'Raza Pending' });
      toast.success('Raza reverted to pending');
      load();
    } catch {
      toast.error('Failed to revert raza');
    }
  };

  // ── Load dropdown options for Safai Chitthi modal ───────────────────────────
  useEffect(() => {
    const parseList = (raw) => {
      const payload = raw?.data ?? raw;
      const arr = Array.isArray(payload) ? payload
                : Array.isArray(payload?.data) ? payload.data
                : Array.isArray(payload?.recordset) ? payload.recordset
                : [];
      return arr.map(item => {
        if (typeof item === 'string') return item.trim();
        const val = item?.Razafor ?? item?.Place ?? item?.EventTime
                  ?? Object.values(item).find(v => typeof v === 'string');
        return String(val ?? '').trim();
      }).filter(Boolean);
    };
    Promise.allSettled([
      safaiService.loadRazaDropdownDetails({ Razafor:   'All' }),
      safaiService.loadRazaDropdownDetails({ Place:     'All' }),
      safaiService.loadRazaDropdownDetails({ EventTime: 'All' }),
    ]).then(([rf, pl, tm]) => {
      if (rf.status === 'fulfilled') setRazaOpts(parseList(rf.value.data));
      if (pl.status === 'fulfilled') setPlaceOpts(parseList(pl.value.data));
      if (tm.status === 'fulfilled') setTimeOpts(parseList(tm.value.data));
    });
  }, []);

  // ── Open Add Safai Chitthi modal pre-filled from booking ────────────────────
  const handleOpenAddChitthi = (booking) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    setChitthiForm({
      RequestDate: todayStr,
      AccNo:       booking.accNo       ?? '',
      FullName:    booking.fullName     ?? '',
      Mobile:      booking.mobile       ?? '',
      Mobile1:     booking.mobile1      ?? '',
      ITSNo:       booking.itsNo        ?? '',
      Address:     booking.address      ?? '',
      EventDate:   booking.date         ?? '',
      HijriDate:   booking.hijriDate    ?? '',
      Razafor:     booking.eventName    ?? '',
      Place:       booking.venue        ?? '',
      EventTime:   booking.eventTime    ?? '',
      Thaal:       booking.thaal        ?? '',
      Remark:      booking.remark       ?? '',
      Requestby:   booking.requestBy    ?? '',
      Createdby:   user?.username       ?? '',
      RazaStatus:  'Raza Pending',
      EventID:     booking.id,
    });
    setChitthiOpen(true);
  };

  const handleSaveChitthi = async () => {
    if (!chitthiForm.EventDate) { toast.error('Event Date is required'); return; }
    if (!chitthiForm.Razafor)   { toast.error('Raza For is required');   return; }
    setChitthiSaving(true);
    try {
      await safaiService.addRazaDetails({ ...chitthiForm });
      toast.success('Safai Chitthi added');
      setChitthiOpen(false);
      load();
    } catch { toast.error('Failed to add Safai Chitthi'); }
    finally  { setChitthiSaving(false); }
  };

  const canAdd = !!permissions?.BookingAdd;
  const canEdit = !!permissions?.BookingEdit;
  const canDelete = !!permissions?.BookingDelete;
  const canPrint = !!permissions?.BookingPrint;

  return (
    <div>
      <CalendarGrid
        year={year}
        month={month}
        cells={cells}
        bookingsByDay={bookingsByDay}
        todayKey={todayKey}
        selectedCellKey={selectedCell?.key}
        onPrev={prev}
        onNext={next}
        onCellClick={handleCellClick}
        onAddClick={openAdd}
        canAdd={canAdd}
      />

      {selectedCell && (
        <DayEventList
          cell={selectedCell}
          bookings={bookingsByDay[selectedCell.key] ?? []}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
          onAddEvent={() => openAdd(selectedCell)}
          onEdit={openEdit}
          canPrint={canPrint}
          onDelete={handleDelete}
          onApproveRaza={handleApproveRaza}
          onRevertRaza={handleRevertRaza}
          onAddSafaiChitthi={handleOpenAddChitthi}
          onClose={() => setSelectedCell(null)}
        />
      )}

      <AddEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        form={addForm}
        onChange={setAddField}
        onSave={saveAdd}
        saving={addSaving}
      />

      <AddSafaiChitthiModal
        open={chitthiOpen}
        onClose={() => setChitthiOpen(false)}
        member={{ name: chitthiForm.FullName, FullName: chitthiForm.FullName }}
        accNo={chitthiForm.AccNo}
        form={chitthiForm}
        set={(k, v) => setChitthiForm(p => ({ ...p, [k]: v }))}
        saving={chitthiSaving}
        onSave={handleSaveChitthi}
        razaOpts={razaOpts}
        placeOpts={placeOpts}
        timeOpts={timeOpts}
      />

      <EditEventModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        form={editForm}
        onChange={setEditField}
        onSave={saveEdit}
        saving={editSaving}
      />
    </div>
  );
}
