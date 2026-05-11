'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { fmt, fmtDate, toInputDate } from '../../utils';

export default function TakhmeenTab({
  takhmeen, permissions,
  takYear, setTakYear,
  takMainHead, setTakMainHead,
  takSubHead, setTakSubHead,
  onAdd, onEdit, onDelete,
}) {
  const parseYear = y => Number(String(y).split('-')[0]) || 0;
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);

  useEffect(() => { setCurrentPage(1); }, [takYear, takMainHead, takSubHead]);

  const filteredTakhmeen = takhmeen
    .filter(t =>
      (!takYear     || String(t.forYear)  === String(takYear)) &&
      (!takMainHead || t.mainHead === takMainHead) &&
      (!takSubHead  || t.subHead  === takSubHead)
    )
    .sort((a, b) => {
      const aRem = Number(a.remaining) || 0;
      const bRem = Number(b.remaining) || 0;
      if ((bRem > 0) !== (aRem > 0)) return (bRem > 0) - (aRem > 0);
      return parseYear(b.forYear) - parseYear(a.forYear);
    });

  const takYearOptions     = [...new Set(takhmeen.map(t => t.forYear).filter(Boolean))].sort((a, b) => parseYear(b) - parseYear(a));
  const takMainHeadOptions = [...new Set(takhmeen.map(t => t.mainHead).filter(Boolean))].sort();
  const takSubHeadOptions  = [...new Set(
    takhmeen.filter(t => !takMainHead || t.mainHead === takMainHead).map(t => t.subHead).filter(Boolean)
  )].sort();

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(filteredTakhmeen.length / pageSize);
  const paginatedTakhmeen = pageSize === 'All'
    ? filteredTakhmeen
    : filteredTakhmeen.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totTak = filteredTakhmeen.reduce((s, t) => s + (Number(t.takhmeen) || 0), 0);
  const totRec = filteredTakhmeen.reduce((s, t) => s + (Number(t.received) || 0), 0);
  const totRem = filteredTakhmeen.reduce((s, t) => s + (Number(t.remaining) || 0), 0);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="form-select w-[110px] h-[32px] text-[12px]"
            value={takYear}
            onChange={e => setTakYear(e.target.value)}
          >
            <option value="">All Years</option>
            {takYearOptions.map(y => <option key={y}>{y}</option>)}
          </select>
          <select
            className="form-select w-[130px] h-[32px] text-[12px]"
            value={takMainHead}
            onChange={e => { setTakMainHead(e.target.value); setTakSubHead(''); }}
          >
            <option value="">All Hub Types</option>
            {takMainHeadOptions.map(h => <option key={h}>{h}</option>)}
          </select>
          <select
            className="form-select w-[160px] h-[32px] text-[12px]"
            value={takSubHead}
            onChange={e => setTakSubHead(e.target.value)}
          >
            <option value="">All Sub Types</option>
            {takSubHeadOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          <span className="text-[12px] font-medium text-navy-800 ml-2 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
            {filteredTakhmeen.length} record{filteredTakhmeen.length !== 1 ? 's' : ''}
          </span>
          <select
            className="form-select h-[32px] text-[12px] w-[80px]"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
          >
            {[20, 50, 100, 200, 500, 1000, 'All'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap ml-1">
            <input
              type="checkbox"
              checked={showUpdateInfo}
              onChange={e => setShowUpdateInfo(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            <span className="text-[11px] text-gray-600">Update info</span>
          </label>
        </div>
        {permissions.MDNewInsert && (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add Takhmeen</button>
        )}
      </div>

      <div className={`rounded-lg border border-border ${showUpdateInfo ? 'overflow-x-auto' : 'overflow-hidden'}`}>
        <table className={`border-collapse text-[12px] ${showUpdateInfo ? 'min-w-max w-full' : 'w-full'}`}>
          <thead>
            <tr>
              {['Actions','For Year','Hub Type','Sub Type','Grade','Takhmeen','Received','Remaining','Date','Remark'].map(h => (
                <th key={h} className="th-navy text-center">{h}</th>
              ))}
              {showUpdateInfo && <>
                <th className="th-navy text-center">Update Reason</th>
                <th className="th-navy text-center">Update Date</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {filteredTakhmeen.length === 0 ? (
              <tr><td colSpan={showUpdateInfo ? 12 : 10} className="text-center py-8 text-gray-400">No takhmeen records</td></tr>
            ) : paginatedTakhmeen.map(t => {
              const rem = Number(t.remaining) || 0;
              return (
                <tr key={t.id} className="hover:bg-blue-500/[0.025]">
                  <td className="px-2 py-2.5 border-t border-border text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {permissions.MDEditTakhmeen && (
                        <button
                          title="Edit"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                          onClick={() => onEdit({ ...t, date: toInputDate(t.date) })}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      {permissions.MDDeleteTakhmeen && (
                        <button
                          title="Delete"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                          onClick={() => onDelete(t.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 border-t border-border text-center font-semibold">{t.forYear}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center">{t.mainHead}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center">{t.subHead || '—'}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center">{t.grade || '—'}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center font-medium">{fmt(t.takhmeen)}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center text-green-600 font-medium">{fmt(t.received)}</td>
                  <td className={clsx('px-2 py-2.5 border-t border-border text-center font-bold',
                    rem > 0 ? 'bg-red-500 text-white' : 'text-green-600'
                  )}>{fmt(t.remaining)}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center whitespace-nowrap text-gray-500">{fmtDate(t.date)}</td>
                  <td className="px-2 py-2.5 border-t border-border text-center text-gray-500">{t.remark || '—'}</td>
                  {showUpdateInfo && <>
                    <td className="px-2 py-2.5 border-t border-border text-center text-gray-500 max-w-[180px] truncate" title={t.recordUpdateReason || ''}>
                      {t.recordUpdateReason || '—'}
                    </td>
                    <td className="px-2 py-2.5 border-t border-border text-center text-gray-500 whitespace-nowrap">
                      {t.recordUpdateDate ? fmtDate(t.recordUpdateDate) : '—'}
                    </td>
                  </>}
                </tr>
              );
            })}
          </tbody>
          {filteredTakhmeen.length > 0 && (
            <tfoot>
              <tr className="bg-navy-800/[0.04] font-bold text-[11.5px]">
                <td colSpan={5} className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center">
                  Total ({filteredTakhmeen.length})
                </td>
                <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center">{fmt(totTak)}</td>
                <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center text-green-600">{fmt(totRec)}</td>
                <td className={clsx('px-3 py-2.5 border-t-2 border-navy-800/20 text-center font-bold',
                  totRem > 0 ? 'bg-red-500 text-white' : 'text-green-600'
                )}>{fmt(totRem)}</td>
                <td colSpan={showUpdateInfo ? 4 : 2} className="px-3 py-2.5 border-t-2 border-navy-800/20" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredTakhmeen.length)} of {filteredTakhmeen.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
            <span className="text-[11px] text-gray-500 px-2">Page {currentPage} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
