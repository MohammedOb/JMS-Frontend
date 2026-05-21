'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import toast           from 'react-hot-toast';
import PageHeader      from '@/components/shared/PageHeader';
import { sabeelStatsService } from '@/services';
import { PrintIcon } from '@/components/shared/Icons';

const CY = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CY - i);

export default function SabeelStatisticsPage() {
  const router = useRouter();
  const [year,       setYear]       = useState(CY);
  const [summary,    setSummary]    = useState(null);
  const [mohallah,   setMohallah]   = useState([]);
  const [yearData,   setYearData]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, mohRes, yrRes] = await Promise.all([
        sabeelStatsService.getSummary({ year }),
        sabeelStatsService.getMohallahBreakdown(year),
        sabeelStatsService.getByYear(year),
      ]);
      setSummary(sumRes.data);
      setMohallah(mohRes.data);
      setYearData(yrRes.data);
    } catch { toast.error('Failed to load statistics'); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
  const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%';

  return (
    <div>
      <PageHeader title="Sabeel Statistics" subtitle="SP: SabeelStats — Annual Sabeel collection analysis">
        <select className="form-select text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print</button>
      </PageHeader>

      {loading ? (
        <div className="card p-10 text-center text-gray-400">Loading statistics…</div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Sabeel',      val: fmt(summary.totalSabeel),      sub: 'Members registered',    color: 'text-navy-800' },
                { label: 'Amount Collected',  val: `₹${fmt(summary.collected)}`,  sub: `of ₹${fmt(summary.totalDemand)}`, color: 'text-green-600' },
                { label: 'Collection %',      val: pct(summary.collected, summary.totalDemand), sub: 'Recovery rate', color: 'text-blue-500' },
                { label: 'Pending Amount',    val: `₹${fmt(summary.pending)}`,    sub: `${summary.pendingCount || 0} members`, color: 'text-red-500' },
              ].map(c => (
                <div key={c.label} className="card p-4">
                  <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
                  <div className="text-[11px] font-semibold text-gray-600 mt-1">{c.label}</div>
                  <div className="text-[10.5px] text-gray-400">{c.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly breakdown */}
          {yearData.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">Monthly Collection — {year}</div>
              <div className="card-body">
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                  {yearData.map((m, i) => {
                    const maxVal = Math.max(...yearData.map(x => Number(x.collected || 0)), 1);
                    const h = Math.max(4, Math.round((Number(m.collected || 0) / maxVal) * 80));
                    return (
                      <div key={i} className="text-center">
                        <div className="flex items-end justify-center h-20 mb-1">
                          <div
                            className="w-8 bg-blue-500 rounded-t transition-all"
                            style={{ height: `${h}px` }}
                            title={`₹${fmt(m.collected)}`}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500">{m.monthName || `M${i+1}`}</div>
                        <div className="text-[10.5px] font-semibold text-navy-800">₹{fmt(m.collected)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mohallah Breakdown */}
          <div className="card">
            <div className="card-header">Mohallah-wise Breakdown — {year}</div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    {['Mohallah','Total Members','Sabeel Count','Demand (₹)','Collected (₹)','Pending (₹)','Recovery %'].map(h =>
                      <th key={h} className="th-navy">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {mohallah.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No data</td></tr>
                  ) : mohallah.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-500/[0.025]">
                      <td className="px-3 py-2.5 border-t border-border font-medium">{r.mohallah}</td>
                      <td className="px-3 py-2.5 border-t border-border text-center">{r.totalMembers}</td>
                      <td className="px-3 py-2.5 border-t border-border text-center font-semibold">{r.sabeelCount}</td>
                      <td className="px-3 py-2.5 border-t border-border text-right">₹{fmt(r.demand)}</td>
                      <td className="px-3 py-2.5 border-t border-border text-right text-green-600 font-semibold">₹{fmt(r.collected)}</td>
                      <td className="px-3 py-2.5 border-t border-border text-right text-red-500">₹{fmt(r.pending)}</td>
                      <td className="px-3 py-2.5 border-t border-border text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: pct(Number(r.collected||0), Number(r.demand||1)) }}
                            />
                          </div>
                          <span className="text-[10.5px] font-medium w-10 text-right">{pct(Number(r.collected||0), Number(r.demand||1))}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {mohallah.length > 0 && (() => {
                  const tot = mohallah.reduce((s, r) => ({
                    members:   (s.members   || 0) + Number(r.totalMembers || 0),
                    sabeel:    (s.sabeel    || 0) + Number(r.sabeelCount  || 0),
                    demand:    (s.demand    || 0) + Number(r.demand       || 0),
                    collected: (s.collected || 0) + Number(r.collected    || 0),
                    pending:   (s.pending   || 0) + Number(r.pending      || 0),
                  }), {});
                  return (
                    <tfoot>
                      <tr className="bg-navy-800/[0.04] font-bold text-[12px]">
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20">Total</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center">{tot.members}</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center">{tot.sabeel}</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right">₹{fmt(tot.demand)}</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right text-green-600">₹{fmt(tot.collected)}</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right text-red-500">₹{fmt(tot.pending)}</td>
                        <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-center">{pct(tot.collected, tot.demand)}</td>
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
