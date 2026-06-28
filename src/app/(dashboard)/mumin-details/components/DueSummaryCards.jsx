'use client';

import { ClipboardListIcon, SendIcon, BellIcon } from '@/components/shared/Icons';
import { fmt } from '../utils';

export default function DueSummaryCards({ takhmeen = [], onOverallDue, onSendReminder, onSendAppNotif }) {
  const byHead = takhmeen.reduce((acc, row) => {
    if (!row.subHead || !(Number(row.remaining) > 0)) return acc;
    if (!acc[row.subHead]) acc[row.subHead] = { rem: 0, years: [] };
    acc[row.subHead].rem += Number(row.remaining);
    if (row.forYear) acc[row.subHead].years.push(String(row.forYear));
    return acc;
  }, {});

  const dueRows = Object.entries(byHead)
    .sort(([a], [b]) => a.localeCompare(b));

  const total = dueRows.reduce((s, [, { rem }]) => s + rem, 0);

  const yearRange = (years) => {
    if (!years.length) return '';
    const sorted = [...new Set(years)].sort();
    return sorted.length === 1 ? sorted[0] : `${sorted[0]} – ${sorted[sorted.length - 1]}`;
  };

  const handleRowSend = (head, rem, years) => {
    if (!onSendReminder) return;
    onSendReminder({
      rows: [{ head, rem, yearRange: yearRange(years) }],
      total: rem,
      isOverall: false,
    });
  };

  const handleOverallSend = () => {
    if (!onSendReminder) return;
    onSendReminder({
      rows: dueRows.map(([head, { rem, years }]) => ({ head, rem, yearRange: yearRange(years) })),
      total,
      isOverall: true,
    });
  };

  const handleRowAppNotif = (head, rem, years) => {
    if (!onSendAppNotif) return;
    onSendAppNotif({
      rows: [{ head, rem, yearRange: yearRange(years) }],
      total: rem,
      isOverall: false,
    });
  };

  const handleOverallAppNotif = () => {
    if (!onSendAppNotif) return;
    onSendAppNotif({
      rows: dueRows.map(([head, { rem, years }]) => ({ head, rem, yearRange: yearRange(years) })),
      total,
      isOverall: true,
    });
  };

  if (dueRows.length === 0) {
    return (
      <div className="w-full bg-white border border-border rounded-lg px-4 py-3 shadow-sm flex items-center justify-center gap-2 text-green-600">
        <span className="text-sm font-semibold">No Dues</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-border rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-navy-900 text-white">
            <th className="px-3 py-1.5 text-left font-semibold">Type</th>
            <th className="px-3 py-1.5 text-center font-semibold">Years</th>
            <th className="px-3 py-1.5 text-right font-semibold">Remaining</th>
            {(onSendReminder || onSendAppNotif) && <th className="px-2 py-1.5" />}
          </tr>
        </thead>
        <tbody>
          {dueRows.map(([head, { rem, years }]) => (
            <tr key={head} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-1 font-extrabold text-gray-950">{head}</td>
              <td className="px-3 py-1 text-center font-extrabold text-gray-850">{yearRange(years)}</td>
              <td className="px-3 py-1 text-right font-extrabold text-red-700">{fmt(rem)}</td>
              {(onSendReminder || onSendAppNotif) && (
                <td className="px-2 py-1 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {onSendReminder && (
                      <button
                        title={`Send WhatsApp reminder for ${head}`}
                        onClick={() => handleRowSend(head, rem, years)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <SendIcon className="w-3 h-3" />
                      </button>
                    )}
                    {onSendAppNotif && (
                      <button
                        title={`Send app notification for ${head}`}
                        onClick={() => handleRowAppNotif(head, rem, years)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <BellIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-yellow-400">
            <td className="px-3 py-1.5 font-extrabold text-gray-900" colSpan={2}>Total Remaining</td>
            <td className="px-3 py-1.5 text-right font-extrabold text-gray-900">{fmt(total)}</td>
            {(onSendReminder || onSendAppNotif) && <td />}
          </tr>
        </tfoot>
      </table>

      <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
        {onOverallDue && (
          <button
            className="btn btn-sm flex-1 justify-center bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
            onClick={onOverallDue}
          >
            <ClipboardListIcon className="w-3.5 h-3.5 mr-1.5" />Overall Due
          </button>
        )}
        {onSendReminder && (
          <button
            className="btn btn-sm flex-1 justify-center bg-green-600 text-white border-green-600 hover:bg-green-700"
            onClick={handleOverallSend}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />Send WA Reminder
          </button>
        )}
        {onSendAppNotif && (
          <button
            className="btn btn-sm flex-1 justify-center bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            onClick={handleOverallAppNotif}
          >
            <BellIcon className="w-3.5 h-3.5 mr-1.5" />Send App Notif
          </button>
        )}
      </div>
    </div>
  );
}
