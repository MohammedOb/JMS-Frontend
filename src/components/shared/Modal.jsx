'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { XIcon } from '@/components/shared/Icons';

// size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    // Intentionally no Escape/backdrop close — use the × button
  }, [open, onClose]);

  if (!open) return null;

  const isFull = size === 'full';
  const maxW   = { sm: 'max-w-[480px]', md: 'max-w-[620px]', lg: 'max-w-[820px]', xl: 'max-w-[1000px]' }[size];

  return (
    <div
      className={clsx(
        'fixed z-[1000] bg-navy-900/50 backdrop-blur-[2px] flex items-center justify-center',
        isFull ? 'inset-0 p-3' : 'inset-0 p-4'
      )}
      onClick={() => {}}
    >
      <div className={clsx(
        'bg-white rounded-xl w-full shadow-2xl overflow-hidden animate-slideUp flex flex-col',
        isFull ? 'h-full' : maxW
      )}>
        {/* Header */}
        <div className="bg-navy-800 px-5 py-4 flex items-center justify-between flex-shrink-0">
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
        <div className={clsx('p-3 sm:p-5 overflow-y-auto', isFull ? 'flex-1' : 'max-h-[70vh]')}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-border bg-surface flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
