'use client';

import { PrintIcon } from '@/components/shared/Icons';

export default function PrintOptionsBar({ printOpts, setPrintOpts, onPrint, disabled }) {
  return (
    <div className="card mb-3">
      <div className="card-body flex items-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5"
            checked={printOpts.showThaliStatus}
            onChange={(e) =>
              setPrintOpts((prev) => ({ ...prev, showThaliStatus: e.target.checked }))
            }
          />
          Show Thali Status
        </label>
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5"
            checked={printOpts.showThaliSize}
            onChange={(e) =>
              setPrintOpts((prev) => ({ ...prev, showThaliSize: e.target.checked }))
            }
          />
          Show Thali Size
        </label>
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5"
            checked={printOpts.showAmount}
            onChange={(e) =>
              setPrintOpts((prev) => ({ ...prev, showAmount: e.target.checked }))
            }
          />
          Show Amount
        </label>
        <button className="btn btn-primary btn-sm ml-2" onClick={onPrint} disabled={disabled}>
          <PrintIcon className="w-3.5 h-3.5 mr-1.5" />
          Print
        </button>
      </div>
    </div>
  );
}
