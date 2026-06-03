'use client';

import { useState, useEffect, use } from 'react';
import { fmbFeedbackService } from '@/services';
import { fmtDate } from '@/utils/dateUtils';

const FIELDS = [
  { key: 'mithas',     label: 'Mithas' },
  { key: 'kharas',     label: 'Kharas' },
  { key: 'tarkari',    label: 'Tarkari' },
  { key: 'roti_nan',   label: 'Roti / Nan' },
  { key: 'jaman',      label: 'Jaman' },
  { key: 'soup_curry', label: 'Soup / Curry' },
  { key: 'cold_drink', label: 'Cold Drinks' },
  { key: 'fruit',      label: 'Fruit' },
  { key: 'sounf',      label: 'Sounf' },
  { key: 'salad',      label: 'Salad' },
  { key: 'others',     label: 'Others' },
];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors focus:outline-none"
          style={{ color: n <= (hovered || value) ? '#f59e0b' : '#d1d5db' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 'text-lg' }) {
  return (
    <span className={size}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= Math.round(value || 0) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

const blankForm = () => ({ acc_no: '', full_name: '', overall_rating: 0 });

export default function FeedbackPage({ params }) {
  const { id: menuId } = use(params);

  const [menu,      setMenu]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [closed,    setClosed]    = useState(false);
  const [form,      setForm]      = useState(blankForm());
  const [itemRatings, setItemRatings] = useState({});   // { key: { rating, remark } }
  const [eventRemark, setEventRemark] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted,  setSubmitted]    = useState(false);
  const [error,      setError]        = useState('');

  useEffect(() => {
    fmbFeedbackService.getMenuByToken(menuId)
      .then(res => {
        if (res.data?.closed) {
          setMenu({ feedback_close_date: res.data.feedback_close_date });
          setClosed(true);
          return;
        }
        const m = res.data?.data;
        if (!m) { setNotFound(true); return; }
        setMenu(m);
        const init = {};
        FIELDS.forEach(f => { if (m[f.key]?.trim()) init[f.key] = { rating: 0, remark: '' }; });
        setItemRatings(init);
      })
      .catch((err) => {
        // 410 = old backend code still running (pre-restart); treat same as closed
        if (err?.response?.status === 410 || err?.response?.data?.closed) {
          setClosed(true);
          return;
        }
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [menuId]);

  const filledFields = menu ? FIELDS.filter(f => menu[f.key]?.trim()) : [];

  const setItemField = (key, field, val) =>
    setItemRatings(p => ({ ...p, [key]: { ...p[key], [field]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.overall_rating) { setError('Please give an overall rating before submitting.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        acc_no:         form.acc_no   || null,
        full_name:      form.full_name || null,
        overall_rating: form.overall_rating,
        event_remark:   eventRemark   || null,
      };
      filledFields.forEach(f => {
        const it = itemRatings[f.key] || {};
        payload[`${f.key}_rating`] = it.rating || null;
        payload[`${f.key}_remark`] = it.remark || null;
      });
      await fmbFeedbackService.submitByToken(menuId, payload);
      setSubmitted(true);
    } catch (err) {
      if (err?.response?.data?.closed) { setClosed(true); return; }
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">Loading…</p>
    </div>
  );

  if (closed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-10 text-center max-w-sm mx-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Feedback Closed</h2>
        <p className="text-gray-500 text-sm">Feedback for this menu has been closed.</p>
        {menu?.feedback_close_date && (
          <p className="text-[12px] text-orange-500 mt-2">
            Closed on {new Date(menu.feedback_close_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-2xl text-gray-300 mb-2">404</p>
        <p className="text-gray-500 text-sm">Menu not found.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm mx-4">
        <div className="text-5xl mb-4">🤲</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Shukran!</h2>
        <p className="text-gray-500 text-sm">Your feedback has been recorded. Jazakallah Khair.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold tracking-widest text-blue-600 uppercase mb-1">FMB Daily Menu</p>
          <h1 className="text-2xl font-bold text-gray-800">Menu Feedback</h1>
        </div>

        {/* Menu info card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold rounded-full px-3 py-1">
            {menu.meal_type}
          </span>
          <span className="text-sm font-medium text-gray-700">{fmtDate(menu.menu_date)}</span>
          {menu.event?.trim() && (
            <span className="text-[11px] bg-amber-100 text-amber-700 rounded-full px-3 py-1">
              {menu.event}
            </span>
          )}
          {menu.feedback_close_date && (
            <span className="ml-auto text-[11px] text-orange-500 shrink-0">
              Open until {new Date(menu.feedback_close_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Identity (optional) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Details (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Acc No</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. 12345"
                  value={form.acc_no}
                  onChange={e => setForm(p => ({ ...p, acc_no: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Your name"
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Overall rating */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Overall Rating <span className="text-red-400">*</span>
            </p>
            <div className="flex items-center gap-3">
              <StarPicker value={form.overall_rating} onChange={v => setForm(p => ({ ...p, overall_rating: v }))} />
              {form.overall_rating > 0 && (
                <span className="text-sm text-gray-500">
                  {['','Poor','Fair','Good','Very Good','Excellent'][form.overall_rating]}
                </span>
              )}
            </div>
          </div>

          {/* Event remark if event present */}
          {menu.event?.trim() && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Event Remark</p>
              <p className="text-xs text-gray-500 mb-2">{menu.event}</p>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                placeholder="Your remarks on the event…"
                value={eventRemark}
                onChange={e => setEventRemark(e.target.value)}
              />
            </div>
          )}

          {/* Per-item ratings */}
          {filledFields.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Rate Each Item</p>
              <div className="space-y-5">
                {filledFields.map(f => (
                  <div key={f.key}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-xs font-medium text-gray-500">{f.label}</span>
                        <span className="ml-2 text-sm text-gray-800">{menu[f.key]}</span>
                      </div>
                      <StarPicker
                        value={itemRatings[f.key]?.rating || 0}
                        onChange={v => setItemField(f.key, 'rating', v)}
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder={`Remark on ${f.label.toLowerCase()}…`}
                      value={itemRatings[f.key]?.remark || ''}
                      onChange={e => setItemField(f.key, 'remark', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>

        </form>

        <p className="text-center text-[11px] text-gray-300 mt-6">JMS — Jamaat Management System</p>
      </div>
    </div>
  );
}
