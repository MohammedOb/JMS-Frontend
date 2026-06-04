'use client';

export default function PaginationBar({ currentPage, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  const base = 'min-w-[30px] h-[30px] px-1.5 rounded text-[11.5px] font-medium border transition-colors';
  return (
    <div className="flex items-center justify-center gap-1 py-3 flex-wrap">
      <button className={`${base} bg-white text-gray-500 border-border hover:bg-blue-50 disabled:opacity-30`} onClick={() => onPage(1)} disabled={currentPage === 1}>«</button>
      <button className={`${base} bg-white text-gray-500 border-border hover:bg-blue-50 disabled:opacity-30`} onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} className="px-1 text-gray-400 text-[12px]">…</span>
        : <button key={p} className={`${base} ${p === currentPage ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-600 border-border hover:bg-blue-50'}`} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className={`${base} bg-white text-gray-500 border-border hover:bg-blue-50 disabled:opacity-30`} onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
      <button className={`${base} bg-white text-gray-500 border-border hover:bg-blue-50 disabled:opacity-30`} onClick={() => onPage(totalPages)} disabled={currentPage === totalPages}>»</button>
    </div>
  );
}
