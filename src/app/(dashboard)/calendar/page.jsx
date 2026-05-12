'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '@/services';
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
        razaStatus:  b.RazaStatus   ?? b.razaStatus,
        serialNo:    b.SerialNo    ?? b.serialNo    ?? b.ID ?? b.id,
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
      await bookingService.updateEventDetails({ ID: booking.id, RazaStatus: 'Approved' });
      toast.success('Raza approved');
      load();
    } catch {
      toast.error('Failed to approve raza');
    }
  };

  const handleRevertRaza = async (booking) => {
    try {
      await bookingService.updateEventDetails({ ID: booking.id, RazaStatus: 'Raza Pending' });
      toast.success('Raza reverted to pending');
      load();
    } catch {
      toast.error('Failed to revert raza');
    }
  };

  const canAdd = !!permissions?.BookingAdd;
  const canEdit = !!permissions?.BookingEdit;
  const canDelete = !!permissions?.BookingDelete;

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
          onDelete={handleDelete}
          onApproveRaza={handleApproveRaza}
          onRevertRaza={handleRevertRaza}
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
