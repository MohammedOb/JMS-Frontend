// Reusable page header: title + subtitle + right-side actions
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
      <div>
        <h1 className="font-display text-[16px] sm:text-[18px] font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{children}</div>}
    </div>
  );
}
