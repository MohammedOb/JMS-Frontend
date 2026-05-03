'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { XIcon } from '@/components/shared/Icons';

// size: 'sm' | 'md' | 'lg' | 'xl'
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    // Intentionally no Escape/backdrop close — use the × button
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: 'max-w-[480px]', md: 'max-w-[620px]', lg: 'max-w-[820px]', xl: 'max-w-[1000px]' }[size];

  return (
    <div
      className="fixed inset-0 bg-navy-900/50 z-[1000] flex items-center justify-center backdrop-blur-[2px] p-4"
      onClick={() => {}}
    >
      <div className={clsx('bg-white rounded-xl w-full shadow-2xl overflow-hidden animate-slideUp', maxW)}>
        {/* Header */}
        <div className="bg-navy-800 px-5 py-4 flex items-center justify-between">
          <span className="font-display text-[14px] font-bold text-white">{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10
                       text-white/70 hover:bg-red-500/20 hover:text-white transition-all"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-border bg-surface flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
