'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookingService }  from '@/services';
import toast               from 'react-hot-toast';
import clsx                from 'clsx';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { useAuth }         from '@/context/AuthContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

export default function CalendarPage() {
  const { permissions } = useAuth();
  const now   = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth());
  const [bookings, setBookings] = useState([]);
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({ date: '', eventName: '', venue: 'Masjid Hall', notes: '' });

  const load = useCallback(async () => {
    try {
      const res = await bookingService.getAll({ year, month: month + 1 });
      setBookings(res.data);
    } catch { toast.error('Failed to load bookings'); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const cells = buildCalendar(year, month);
  const eventDays = new Set(bookings.map(b => new Date(b.date).getDate()));
  const upcoming  = bookings.filter(b => new Date(b.date) >= now).slice(0, 5);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const save = async () => {
    if (!form.date || !form.eventName) { toast.error('Fill required fields'); return; }
    try {
      await bookingService.create(form);
      toast.success('Booking saved');
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="Bookings & Calendar" subtitle={`Manage venue bookings — ${MONTHS[month]} ${year}`}>
        <button className="btn btn-secondary btn-sm" onClick={prev}>← Previous</button>
        <button className="btn btn-secondary btn-sm" onClick={next}>Next →</button>
        {permissions.BookingAdd && (
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Booking</button>
        )}
      </PageHeader>

      <div className="grid grid-cols-[1fr_260px] gap-3">
        {/* Calendar */}
        <div className="card">
          <div className="card-header">{MONTHS[month]} {year}</div>
          <div className="card-body">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map(d => <div key={d} className="text-[9px] font-semibold text-gray-400 uppercase text-center py-1.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const hasEvent = day && eventDays.has(day);
                return (
                  <div
                    key={i}
                    className={clsx(
                      'text-[12px] text-center py-1.5 rounded-md relative cursor-pointer transition-colors',
                      !day ? '' : isToday ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-surface-2 text-gray-700'
                    )}
                  >
                    {day}
                    {hasEvent && !isToday && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Has booking</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Today</span>
            </div>
          </div>
        </div>

        {/* Upcoming + Add form */}
        <div className="space-y-3">
          <div className="card">
            <div className="card-header text-[12px]">Upcoming Bookings</div>
            <div className="card-body space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-[12px] text-gray-400">No upcoming bookings</p>
              ) : upcoming.map((b, i) => (
                <div key={i} className="border-l-[3px] border-blue-500 pl-3">
                  <div className="text-[12px] font-semibold text-navy-900">{b.eventName}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{b.date} · {b.venue}</div>
                </div>
              ))}
            </div>
          </div>

          {permissions.BookingAdd && (
            <div className="card">
              <div className="card-header text-[12px]">Add New Booking</div>
              <div className="card-body space-y-2.5">
                <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label className="form-label">Event Name</label><input className="form-input" placeholder="e.g. Majlis Qurbani" value={form.eventName} onChange={e => setForm(p => ({ ...p, eventName: e.target.value }))} /></div>
                <div>
                  <label className="form-label">Venue</label>
                  <select className="form-select" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}>
                    {['Masjid Hall','Community Hall','Distribution Point','Other'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary w-full justify-center" onClick={save}>Save Booking</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
