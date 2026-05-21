'use client';

import { createPortal } from 'react-dom';
import { SearchIcon, XIcon, PlusIcon, RefreshIcon } from '@/components/shared/Icons';

export default function MuminSearchBar({
  searchVal, setSearchVal,
  searching, onSearch, onClear, onNewMember,
  showSuggestions, suggestLoading, suggestions, dropdownStyle,
  onSelectSuggestion,
  searchInputRef,
}) {
  return (
    <>
      <div className="bg-white border border-border rounded-lg px-4 py-3 mb-4 flex items-center gap-3 shadow-sm">
        <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={searchInputRef}
          className="flex-1 border-none outline-none text-[14px] text-navy-900 placeholder:text-gray-400"
          placeholder="Search by Name, Account No., ITS No., Mobile, HOF ITS No…"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSearch(searchVal);
            if (e.key === 'Escape') onClear();
          }}
          autoComplete="off"
        />
        <button className="btn btn-primary p-2" title="Search" onClick={() => onSearch(searchVal)} disabled={searching}>
          {searching ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
        </button>
        <button className="btn btn-secondary p-2" title="Clear" onClick={onClear}>
          <XIcon className="w-4 h-4" />
        </button>
        {onNewMember && (
          <button className="btn btn-secondary p-2" title="New Member" onClick={onNewMember}>
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        showSuggestions && (
          <div style={{
            ...dropdownStyle,
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '0.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}>
            {suggestLoading ? (
              <div className="px-4 py-3 text-[12.5px] text-gray-400">Searching…</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px] text-gray-400">No members found</div>
            ) : suggestions.map((m, i) => (
              <div
                key={i}
                onMouseDown={() => onSelectSuggestion(m)}
                style={{ cursor: 'pointer', borderTop: i > 0 ? '1px solid var(--border, #e2e8f0)' : 'none' }}
                className="px-4 py-2.5 hover:bg-blue-500/[0.08] flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-semibold text-[13px]">{m.name}</span>
                  {m.mohallah && <span className="text-[11px] text-gray-400 ml-2">{m.mohallah}</span>}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-blue-500 font-medium block">{m.accno}</span>
                  {m.itsNo && <span className="text-[10px] text-gray-400">{m.itsNo}</span>}
                </div>
              </div>
            ))}
          </div>
        ),
        document.body
      )}
    </>
  );
}
