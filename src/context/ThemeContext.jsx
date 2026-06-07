'use client';
// src/context/ThemeContext.jsx
// Reads/writes the app theme from localStorage and applies CSS variables to :root.

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'jms-theme';

// All theme variables and their default values.
// Size vars are stored as bare numbers (px is appended when applied to the DOM).
// Mirror changes here in src/app/globals.css :root.
export const THEME_DEFAULTS = {
  // Colors
  '--color-primary':        '#1d6bf3',
  '--color-primary-hover':  '#1558d6',
  '--color-bg-page':        '#f0f4f9',
  '--color-bg-card':        '#ffffff',
  '--color-bg-header':      '#0f2548',
  '--color-bg-footer':      '#0f2548',
  '--color-text-primary':   '#0b1d38',
  '--color-text-secondary': '#6b7280',
  '--color-text-on-dark':   '#ffffff',
  '--color-border':         '#dce4ef',
  // Font sizes (stored without 'px')
  '--fs-label':    '11',
  '--fs-body':     '13',
  '--fs-list':     '13',
  '--fs-header':   '16',
  '--fs-title':    '20',
  // Icon sizes (stored without 'px')
  '--icon-sm':     '14',
  '--icon-base':   '16',
  '--icon-md':     '18',
  '--icon-lg':     '20',
  '--icon-xl':     '24',
  // Button
  '--btn-radius':  '6',
  '--btn-fs':      '13',
};

// These vars need 'px' appended when written to the DOM
const PX_VARS = new Set([
  '--fs-label', '--fs-body', '--fs-list', '--fs-header', '--fs-title',
  '--icon-sm', '--icon-base', '--icon-md', '--icon-lg', '--icon-xl',
  '--btn-radius', '--btn-fs',
]);

function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(key, PX_VARS.has(key) ? `${val}px` : val);
  });
}

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEME_DEFAULTS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const merged = { ...THEME_DEFAULTS, ...saved };
      setTheme(merged);
      applyTheme(merged);
    } catch {
      applyTheme(THEME_DEFAULTS);
    }
  }, []);

  function update(key, value) {
    setTheme(prev => {
      const next = { ...prev, [key]: value };
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function reset() {
    setTheme(THEME_DEFAULTS);
    applyTheme(THEME_DEFAULTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <ThemeCtx.Provider value={{ theme, update, reset }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
