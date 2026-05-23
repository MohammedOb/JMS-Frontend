'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { majlisService, memberService, lookupService } from '@/services';
import toast from 'react-hot-toast';
import { SearchIcon, SaveIcon, RefreshIcon, XIcon } from '@/components/shared/Icons';
import { Label, RO, AutocompleteInput, inp, sel } from './ui';
import { blank } from './constants';

export const cleanDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dt.getDate()}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
};

const nn = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ?? '']));

export default function RegistrationModal({ initialData, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!(initialData?.ID);

  const [form, setForm]       = useState(
    initialData
      ? { ...blank(), ...nn(initialData), MajlisDate: cleanDate(initialData.MajlisDate), RegistrationDate: cleanDate(initialData.RegistrationDate) }
      : blank()
  );
  const [accSearch, setAccSearch]     = useState(initialData?.AccNo ? String(initialData.AccNo) : '');
  const [searching, setSearching]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [manualMode, setManualMode]   = useState(false);
  const [suggestions, setSuggestions] = useState({});

  const sf  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sfn = e => sf(e.target.name, e.target.value);

  // Load field suggestions from DB once on modal open
  useEffect(() => {
    lookupService.getMajlisData()
      .then(res => setSuggestions(res?.data?.data || {}))
      .catch(() => {});
  }, []);

  const searchMember = async (val) => {
    const q = val?.trim();
    if (!q) return;
    setSearching(true);
    setMemberNotFound(false);
    setManualMode(false);
    try {
      const res = await memberService.loadMuminDetails({ AccNo: q });
      const list = res?.data?.data ?? res?.data;
      const m = Array.isArray(list) ? list[0] : null;
      if (!m) {
        setMemberNotFound(true);
        setForm(p => ({ ...p, AccNo: q }));
        return;
      }
      setForm(p => ({
        ...p,
        AccNo:              String(m.AccNo        || q),
        FullName:           m.FullName             || '',
        Sector:             m.Sector               || '',
        Mobile:             m.Mobile               || '',
        Mobile1:            m.Mobile1              || '',
        ITSNo:              String(m.ITSNo         || ''),
        LocalHOFITSNo:      String(m.LocalHOFITSNo || m.LocalHOF || ''),
        Subsector:          m.Subsector            || '',
        MohallaDescription: m.MohallaDescription   || '',
        SabeelType:         m.SabeelType           || '',
        StayingIn:          m.StayingIn            || '',
      }));
    } catch { toast.error('Failed to load member'); }
    finally { setSearching(false); }
  };

  const save = async () => {
    if (!form.AccNo) { toast.error('Search or enter a member first'); return; }
    if (!form.FullName && manualMode) { toast.error('Enter Full Name'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await majlisService.update({
          ...form,
          MajlisDate:       cleanDate(form.MajlisDate),
          RegistrationDate: cleanDate(form.RegistrationDate),
        });
        toast.success('Registration updated');
      } else {
        const res   = await majlisService.add({
          ...form,
          MajlisDate: cleanDate(form.MajlisDate),
          CreatedBy:  user?.username,
        });
        const regNo = res?.data?.RegistrationNo || '';
        toast.success(`Saved · Reg No: ${regNo}`);
      }
      onSaved?.();
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const memberLoaded = form.AccNo && (form.FullName || manualMode);

  // Autocomplete handler wrapper (accepts both real events and synthetic)
  const acn = (e) => sfn(e);

  const S = suggestions; // shorthand

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">

        {/* Header */}
        <div className={`rounded-t-xl px-5 py-4 flex items-center justify-between ${
          isEdit ? 'bg-gradient-to-r from-indigo-700 to-indigo-800'
                 : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          <div>
            <h2 className="font-bold text-white text-[16px]">
              {isEdit ? 'Edit Registration' : 'New Registration'}
            </h2>
            {isEdit && (
              <p className="text-blue-200 text-[12px] mt-0.5">
                {form.FullName} · Acc {form.AccNo}
                {form.RegistrationNo && <span className="ml-2 font-mono text-white">#{form.RegistrationNo}</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Reg info banner (edit only) */}
          {isEdit && (form.RegistrationNo || form.RegistrationDate) && (
            <div className="flex flex-wrap gap-6 bg-slate-700 rounded-lg px-5 py-3">
              {form.RegistrationNo && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reg No.</p>
                  <p className="text-[15px] font-bold text-white font-mono">{form.RegistrationNo}</p>
                </div>
              )}
              {form.RegistrationDate && (
                <>
                  <div className="w-px h-8 bg-white/15" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reg Date</p>
                    <p className="text-[13px] font-semibold text-white">{fmtDate(form.RegistrationDate)}</p>
                  </div>
                </>
              )}
              <div className="w-px h-8 bg-white/15" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">For Year</p>
                <p className="text-[13px] font-semibold text-white">{form.ForYear}</p>
              </div>
            </div>
          )}

          {/* Member search (new only) */}
          {!isEdit && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Search Member by Account No.
              </p>
              <div className="flex gap-2">
                <input
                  className={`${inp} flex-1`}
                  placeholder="Enter Account No. and press Enter…"
                  value={accSearch}
                  onChange={e => setAccSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchMember(accSearch); }}
                />
                <button className="btn btn-primary px-5" onClick={() => searchMember(accSearch)} disabled={searching}>
                  {searching
                    ? <RefreshIcon className="w-4 h-4 animate-spin" />
                    : <SearchIcon className="w-4 h-4" />}
                  <span className="ml-1.5">{searching ? 'Searching…' : 'Search'}</span>
                </button>
              </div>

              {/* Member not found — offer manual entry */}
              {memberNotFound && !manualMode && (
                <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-amber-800">Member not found for Acc No: {accSearch}</p>
                    <p className="text-[11.5px] text-amber-600 mt-0.5">You can enter the member details manually to register.</p>
                  </div>
                  <button
                    className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0 ml-4"
                    onClick={() => setManualMode(true)}
                  >
                    Add Manually
                  </button>
                </div>
              )}

              {manualMode && (
                <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <span className="text-[11.5px] font-semibold">Manual entry mode — fill in member details below</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state (new, no member yet) */}
          {!isEdit && !memberLoaded && !memberNotFound && (
            <div className="flex flex-col items-center py-10 text-center text-gray-400">
              <SearchIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[13px]">Search a member by Account No. to continue</p>
            </div>
          )}

          {/* Full form */}
          {memberLoaded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Member Details */}
                <div className={`rounded-lg border overflow-hidden ${manualMode ? 'border-amber-200' : 'border-blue-200'}`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between ${manualMode ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    <span className="text-white text-[11px] font-bold uppercase tracking-widest">Member Details</span>
                    <span className="text-white/70 text-[10px]">
                      {manualMode ? '✏ Manual Entry' : 'Read-only'}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {/* AccNo — always editable in manual mode */}
                    <div>
                      <Label>Acc No</Label>
                      {manualMode
                        ? <input name="AccNo" className={inp} value={form.AccNo} onChange={sfn} />
                        : <RO value={form.AccNo} accent="text-blue-700 font-bold" />}
                    </div>
                    <div>
                      <Label>ITS No</Label>
                      {manualMode
                        ? <input name="ITSNo" className={inp} value={form.ITSNo} onChange={sfn} />
                        : <RO value={form.ITSNo} />}
                    </div>
                    <div className="col-span-2">
                      <Label>Full Name {manualMode && <span className="text-red-400">*</span>}</Label>
                      {manualMode
                        ? <input name="FullName" className={inp} value={form.FullName} onChange={sfn} placeholder="Enter full name" />
                        : <RO value={form.FullName} accent="font-medium text-gray-800" />}
                    </div>
                    <div>
                      <Label>Mobile</Label>
                      {manualMode
                        ? <input name="Mobile" className={inp} value={form.Mobile} onChange={sfn} />
                        : <RO value={form.Mobile} />}
                    </div>
                    <div>
                      <Label>Mobile 2</Label>
                      {manualMode
                        ? <input name="Mobile1" className={inp} value={form.Mobile1} onChange={sfn} />
                        : <RO value={form.Mobile1} />}
                    </div>
                    <div>
                      <Label>Sector (Masjid)</Label>
                      {manualMode
                        ? <input name="Sector" className={inp} value={form.Sector} onChange={sfn} />
                        : <RO value={form.Sector} />}
                    </div>
                    <div>
                      <Label>Sabeel Type</Label>
                      {manualMode
                        ? <input name="SabeelType" className={inp} value={form.SabeelType} onChange={sfn} />
                        : <RO value={form.SabeelType} />}
                    </div>
                    <div>
                      <Label>Subsector</Label>
                      {manualMode
                        ? <input name="Subsector" className={inp} value={form.Subsector} onChange={sfn} />
                        : <RO value={form.Subsector} />}
                    </div>
                    <div>
                      <Label>Mohalla</Label>
                      {manualMode
                        ? <input name="MohallaDescription" className={inp} value={form.MohallaDescription} onChange={sfn} />
                        : <RO value={form.MohallaDescription} />}
                    </div>
                    <div className="col-span-2">
                      <Label>Staying In</Label>
                      {manualMode
                        ? <input name="StayingIn" className={inp} value={form.StayingIn} onChange={sfn} />
                        : <RO value={form.StayingIn} />}
                    </div>
                  </div>
                </div>

                {/* Majlis Details */}
                <div className="rounded-lg border border-indigo-200 overflow-hidden">
                  <div className="bg-indigo-600 px-4 py-2.5">
                    <span className="text-white text-[11px] font-bold uppercase tracking-widest">Majlis Details</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {/* For Year — autocomplete */}
                    <div>
                      <Label>For Year</Label>
                      <AutocompleteInput
                        name="ForYear"
                        value={String(form.ForYear)}
                        onChange={acn}
                        options={S.ForYear || []}
                        placeholder="e.g. 1447"
                        className={inp}
                      />
                    </div>
                    <div>
                      <Label>Majlis Type</Label>
                      <select name="MajlisType" className={sel} value={form.MajlisType} onChange={sfn}>
                        {(S.MajlisType || []).map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Event Type — autocomplete with DB suggestions */}
                    <div className="col-span-2">
                      <Label>Event Type</Label>
                      <AutocompleteInput
                        name="EventType"
                        value={form.EventType}
                        onChange={acn}
                        options={S.EventType || []}
                        placeholder="e.g. Ohbat Majlis"
                        className={inp}
                      />
                    </div>
                    <div>
                      <Label>Majlis Date <span className="text-[9px] text-gray-400 normal-case font-normal">(optional)</span></Label>
                      <input name="MajlisDate" type="date" className={inp} value={form.MajlisDate} onChange={sfn} />
                    </div>
                    <div>
                      <Label>Slot Type</Label>
                      <AutocompleteInput
                        name="SlotType"
                        value={form.SlotType}
                        onChange={acn}
                        options={S.SlotType || []}
                        placeholder="Night / Day"
                        className={inp}
                      />
                    </div>
                    <div>
                      <Label>Majlis Time</Label>
                      <AutocompleteInput
                        name="MajlisTime"
                        value={form.MajlisTime}
                        onChange={acn}
                        options={S.MajlisTime || []}
                        placeholder="e.g. 8:00 PM"
                        className={inp}
                      />
                    </div>
                    <div>
                      <Label>Majlis Raza</Label>
                      <AutocompleteInput
                        name="MajlisRaza"
                        value={form.MajlisRaza}
                        onChange={acn}
                        options={S.MajlisRaza || []}
                        placeholder="Raza status"
                        className={inp}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="rounded-lg border border-purple-200 overflow-hidden">
                <div className="bg-purple-600 px-4 py-2.5">
                  <span className="text-white text-[11px] font-bold uppercase tracking-widest">Assignment Details</span>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Sadar</Label>
                    <AutocompleteInput
                      name="Sadar"
                      value={form.Sadar}
                      onChange={acn}
                      options={S.Sadar || []}
                      placeholder="Sadar name"
                      className={inp}
                    />
                  </div>
                  <div>
                    <Label>Zakereen</Label>
                    <AutocompleteInput
                      name="Zakereen"
                      value={form.Zakereen}
                      onChange={acn}
                      options={S.Zakereen || []}
                      placeholder="Zakereen & Team"
                      className={inp}
                    />
                  </div>
                  <div>
                    <Label>Tazeen</Label>
                    <AutocompleteInput
                      name="Tazeen"
                      value={form.Tazeen}
                      onChange={acn}
                      options={S.Tazeen || []}
                      placeholder="Tazeen"
                      className={inp}
                    />
                  </div>
                  <div>
                    <Label>BGI</Label>
                    <AutocompleteInput
                      name="BGI"
                      value={form.BGI}
                      onChange={acn}
                      options={S.BGI || []}
                      placeholder="BGI"
                      className={inp}
                    />
                  </div>
                  <div>
                    <Label>Care Taker</Label>
                    <AutocompleteInput
                      name="CareTaker"
                      value={form.CareTaker}
                      onChange={acn}
                      options={S.CareTaker || []}
                      placeholder="Care Taker"
                      className={inp}
                    />
                  </div>
                  <div>
                    <Label>Clearance Status</Label>
                    <select name="ClearanceStatus" className={sel} value={form.ClearanceStatus} onChange={sfn}>
                      <option value="">— Select —</option>
                      {(S.ClearanceStatus || []).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Majlis Status</Label>
                    <select name="MajlisStatus" className={sel} value={form.MajlisStatus} onChange={sfn}>
                      {(S.MajlisStatus || []).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Remark</Label>
                    <input name="Remark" className={inp} value={form.Remark} onChange={sfn} placeholder="Optional note" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {memberLoaded && (
            <button className="btn btn-primary px-6" onClick={save} disabled={saving}>
              {saving
                ? <RefreshIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                : <SaveIcon className="w-3.5 h-3.5 mr-1.5" />}
              {isEdit ? 'Update Registration' : 'Save Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
