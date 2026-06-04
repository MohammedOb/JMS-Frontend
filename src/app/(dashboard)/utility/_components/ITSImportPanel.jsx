'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { itsService } from '@/services';
import { UploadIcon, DatabaseIcon, RefreshIcon, XIcon } from '@/components/shared/Icons';

export default function ITSImportPanel() {
  const fileInputRef = useRef(null);

  const [importRows,   setImportRows]   = useState(null);
  const [importMeta,   setImportMeta]   = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importProg,   setImportProg]   = useState('');
  const [importResult, setImportResult] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);

  const parseFile = async (file) => {
    try {
      const { read, utils } = await import('xlsx');
      const buf  = await file.arrayBuffer();
      const wb   = read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = utils.sheet_to_json(ws, { defval: '' });
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      setImportRows(data);
      setImportMeta({ filename: file.name, total: data.length, headers });
      setImportResult(null);
    } catch {
      toast.error('Failed to parse file. Use Excel (.xlsx/.xls) or CSV.');
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!importRows || importRows.length === 0) return;
    setImporting(true);
    setImportResult(null);

    const CHUNK   = 500;
    const total   = importRows.length;
    const batches = Math.ceil(total / CHUNK);
    let imported  = 0;
    let errors    = 0;

    for (let i = 0; i < batches; i++) {
      const chunk = importRows.slice(i * CHUNK, (i + 1) * CHUNK);
      setImportProg(`Importing batch ${i + 1} of ${batches}…`);
      try {
        const res = await itsService.importData({ rows: chunk, truncate: i === 0 });
        imported += res.data?.imported ?? chunk.length;
        errors   += res.data?.errors   ?? 0;
      } catch {
        errors += chunk.length;
      }
    }

    setImportProg('');
    setImportResult({ imported, errors, total });
    setImporting(false);

    if (errors === 0) toast.success(`Imported ${imported.toLocaleString()} records`);
    else toast(`Imported ${imported.toLocaleString()}, ${errors} failed`, { icon: '⚠️' });
  };

  const clearFile = () => {
    setImportRows(null);
    setImportMeta(null);
    setImportResult(null);
  };

  return (
    <>
      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-[13px] text-gray-500">
          Drag &amp; drop an Excel or CSV file, or <span className="text-blue-600 underline">click to browse</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">Supports .xlsx, .xls, .csv — First sheet is used. ITS_ID must be present.</p>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Preview */}
      {importMeta && importRows && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-[12px] font-medium text-navy-800">{importMeta.filename}</span>
            <span className="text-[11.5px] text-gray-500">{importMeta.total.toLocaleString()} rows · {importMeta.headers.length} columns</span>
            <span className="text-[11px] text-blue-600">Column mapping will match by name automatically</span>
          </div>

          <div className="overflow-x-auto rounded border border-border">
            <table className="text-[11px] border-collapse w-full">
              <thead>
                <tr>
                  {importMeta.headers.slice(0, 12).map(h => (
                    <th key={h} className="th-navy px-2 py-1.5 whitespace-nowrap">{h}</th>
                  ))}
                  {importMeta.headers.length > 12 && <th className="th-navy px-2 py-1.5">+{importMeta.headers.length - 12} more</th>}
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    {importMeta.headers.slice(0, 12).map(h => (
                      <td key={h} className="px-2 py-1 border-t border-border truncate max-w-[120px]">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                    {importMeta.headers.length > 12 && <td className="px-2 py-1 border-t border-border text-gray-400">…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importMeta.total > 5 && (
            <p className="text-[11px] text-gray-400 mt-1">Showing first 5 of {importMeta.total.toLocaleString()} rows</p>
          )}

          <div className="flex items-center gap-2 mt-3 mb-1 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-[11.5px] text-amber-800">
            <span className="font-bold">⚠</span>
            <span>Importing will <strong>erase all existing ITS records</strong> before inserting the new data.</span>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleImport}
              disabled={importing}
            >
              {importing
                ? <><RefreshIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />{importProg}</>
                : <><DatabaseIcon className="w-3.5 h-3.5 mr-1.5" />Import {importMeta.total.toLocaleString()} Records</>
              }
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={clearFile}
              disabled={importing}
            >
              <XIcon className="w-3.5 h-3.5 mr-1" />Clear
            </button>

            {importResult && (
              <span className={`text-[12px] font-medium px-3 py-1 rounded-md border
                ${importResult.errors === 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                ✓ {importResult.imported.toLocaleString()} imported
                {importResult.errors > 0 && ` · ${importResult.errors} failed`}
                {' '}/ {importResult.total.toLocaleString()} total
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
