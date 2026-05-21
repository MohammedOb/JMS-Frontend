'use client';
import { useState } from 'react';
import { majlisService, memberService } from '@/services';
import toast from 'react-hot-toast';
import { SearchIcon, RefreshIcon, PlusIcon, EditIcon } from '@/components/shared/Icons';
import { Label, RO, CardSection, StatusPill, inp, td, th } from './ui';
import RegistrationModal, { cleanDate, fmtDate } from './RegistrationModal';
import { blank } from './constants';

export default function RegistrationTab() {
  const [accSearch, setAccSearch]     = useState('');
  const [member, setMember]           = useState(null);
  const [searching, setSearching]     = useState(false);
  const [history, setHistory]         = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [modal, setModal]             = useState(null); // null | { data: object|null }

  const searchMember = async (val) => {
    const q = val?.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await memberService.loadMuminDetails({ AccNo: q });
      const list = res?.data?.data ?? res?.data;
      const m = Array.isArray(list) ? list[0] : null;
      if (!m) { toast.error('Member not found'); return; }
      setMember(m);
      loadHistory(String(m.AccNo || q));
    } catch { toast.error('Failed to load member'); }
    finally { setSearching(false); }
  };

  const loadHistory = async (accno) => {
    setHistLoading(true);
    try {
      const res = await majlisService.load({ AccNo: accno });
      const list = res?.data?.data ?? res?.data;
      setHistory(Array.isArray(list) ? list : []);
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  };

  const openNew  = () => setModal({ data: null });
  const openEdit = (r) => setModal({
    data: { ...blank(), ...r, MajlisDate: cleanDate(r.MajlisDate) },
  });
  const closeModal = () => setModal(null);
  const onSaved    = () => { if (member) loadHistory(String(member.AccNo)); };

  return (
    <div className="space-y-4">

      {/* Top action bar */}
      <div className="flex items-center justify-end">
        <button className="btn btn-primary btn-sm px-5" onClick={openNew}>
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />New Registration
        </button>
      </div>

      {/* Member search */}
      <CardSection color="blue" title="Search Member History" subtitle="Enter AccNo to view registrations">
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
      </CardSection>

      {/* Empty state */}
      {!member && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <SearchIcon className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-[14px] font-semibold text-gray-500">Search a member to view their registration history</p>
          <p className="text-[12px] text-gray-400 mt-1">Or click New Registration to add a new record</p>
        </div>
      )}

      {/* Member info + history */}
      {member && (
        <>
          {/* Member card (compact) */}
          <CardSection color="blue" title="Member Details" subtitle="Read-only · from database">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Acc No</Label><RO value={String(member.AccNo || '')} accent="text-blue-700 font-bold" /></div>
              <div><Label>ITS No</Label><RO value={String(member.ITSNo || '')} /></div>
              <div className="col-span-2"><Label>Full Name</Label><RO value={member.FullName} accent="font-medium text-gray-800" /></div>
              <div><Label>Mobile</Label><RO value={member.Mobile} /></div>
              <div><Label>Mobile 2</Label><RO value={member.Mobile1} /></div>
              <div><Label>Sector</Label><RO value={member.Sector} /></div>
              <div><Label>Mohalla</Label><RO value={member.MohallaDescription} /></div>
            </div>
          </CardSection>

          {/* Registration History */}
          <div className="rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-700 px-4 py-2.5 flex items-center justify-between">
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">Registration History</span>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <span className="bg-white/20 text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                    {history.length} record{history.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  className="text-white/60 hover:text-white p-1 rounded transition-colors"
                  title="Refresh history"
                  onClick={() => loadHistory(String(member.AccNo))}
                  disabled={histLoading}
                >
                  <RefreshIcon className={`w-3.5 h-3.5 ${histLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {['Reg No','Year','Event','Reg Date','Majlis Date','Slot','Time','Sadar','Zakereen','Raza','Status',''].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {histLoading ? (
                    <tr><td colSpan={12} className="text-center py-8 text-gray-400">Loading history…</td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={12} className="text-center py-8 text-gray-400">No previous registrations for this member</td></tr>
                  ) : history.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-500/[0.025]">
                      <td className={`${td} font-mono text-[11px] text-blue-600 font-semibold`}>{r.RegistrationNo || '—'}</td>
                      <td className={td}>{r.ForYear}</td>
                      <td className={td}>{r.EventType || '—'}</td>
                      <td className={td}>{fmtDate(r.RegistrationDate)}</td>
                      <td className={td}>{fmtDate(r.MajlisDate)}</td>
                      <td className={td}>{r.SlotType || '—'}</td>
                      <td className={td}>{r.MajlisTime || '—'}</td>
                      <td className={`${td} font-medium`}>{r.Sadar || '—'}</td>
                      <td className={td}>{r.Zakereen || '—'}</td>
                      <td className={td}>{r.MajlisRaza || '—'}</td>
                      <td className={td}><StatusPill status={r.MajlisStatus} /></td>
                      <td className={td}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Edit this registration"
                          onClick={() => openEdit(r)}
                        >
                          <EditIcon className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Registration Modal (New or Edit) */}
      {modal !== null && (
        <RegistrationModal
          initialData={modal.data}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
