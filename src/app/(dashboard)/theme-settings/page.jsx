'use client';
// src/app/(dashboard)/theme-settings/page.jsx

import { useTheme } from '@/context/ThemeContext';
import { RefreshIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';

/* ── Reusable control rows ───────────────────────────────────────────────── */

function Section({ title, subtitle, children }) {
  return (
    <div className="card mb-5">
      <div className="card-header flex-col items-start gap-0.5">
        <span>{title}</span>
        {subtitle && <span className="text-[11px] font-normal text-gray-400">{subtitle}</span>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function ColorRow({ label, varKey, description }) {
  const { theme, update } = useTheme();
  const val = theme[varKey] || '#000000';
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-navy-900">{label}</div>
        {description && <div className="text-[11px] text-gray-400 mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Colour swatch — clicking it opens the native colour picker */}
        <label
          className="w-9 h-9 rounded-md border-2 border-border shadow-sm cursor-pointer block relative overflow-hidden flex-shrink-0"
          style={{ backgroundColor: val }}
          title="Click to pick colour"
        >
          <input
            type="color"
            value={val}
            onChange={e => update(varKey, e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        {/* Hex text input */}
        <input
          type="text"
          value={val.toUpperCase()}
          maxLength={7}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update(varKey, v);
          }}
          className="w-[92px] h-8 px-2 border border-border rounded-md font-mono
                     text-[12px] text-gray-800 bg-white outline-none uppercase
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>
    </div>
  );
}

function SizeRow({ label, varKey, min = 8, max = 32, description }) {
  const { theme, update } = useTheme();
  const val = parseInt(theme[varKey]) || min;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-navy-900">{label}</div>
        {description && <div className="text-[11px] text-gray-400 mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <input
          type="range"
          min={min}
          max={max}
          value={val}
          onChange={e => update(varKey, e.target.value)}
          className="w-28 accent-blue-500 cursor-pointer"
        />
        <span className="w-12 text-center text-[12px] font-mono font-semibold text-navy-900
                         bg-surface border border-border rounded-md px-1.5 py-0.5 tabular-nums">
          {val}px
        </span>
      </div>
    </div>
  );
}

/* ── Live preview ────────────────────────────────────────────────────────── */

function LivePreview() {
  return (
    <div className="card mb-5">
      <div className="card-header">
        <span>Live Preview</span>
        <span className="text-[11px] font-normal text-gray-400">Updates as you change settings above</span>
      </div>
      <div className="card-body space-y-5">

        {/* Buttons */}
        <div>
          <p className="text-label text-gray-400 mb-2">Buttons</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary">Primary</button>
            <button className="btn-secondary">Secondary</button>
            <button className="btn-success">Success</button>
            <button className="btn-danger">Delete</button>
            <button className="btn-primary btn-sm">Small</button>
          </div>
        </div>

        {/* Table */}
        <div>
          <p className="text-label text-gray-400 mb-2">Table Header &amp; Row</p>
          <div className="rounded-lg overflow-hidden border border-border">
            <table className="w-full">
              <thead>
                <tr>
                  {['Member Name', 'Mohallah', 'Status', 'Amount'].map(h => (
                    <th key={h} className="th-navy">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-blue-500/[0.025]">
                  {['Mohammed Ali', 'Sagwara', 'Active', '₹ 5,000'].map((v, i) => (
                    <td key={i} className="px-3 py-2.5 border-t border-border text-list text-gray-700">{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Typography */}
        <div>
          <p className="text-label text-gray-400 mb-2">Typography</p>
          <div className="space-y-1.5">
            <div className="text-title  text-navy-900">Page Title</div>
            <div className="text-header text-navy-800">Section Header</div>
            <div className="text-list   text-gray-700">List row — Member details and body content</div>
            <div className="text-label  text-gray-500">Form Label</div>
          </div>
        </div>

        {/* Form */}
        <div>
          <p className="text-label text-gray-400 mb-2">Form Input</p>
          <div className="max-w-xs space-y-1">
            <label className="form-label">Email Address</label>
            <input className="form-input" placeholder="example@mail.com" readOnly />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ThemeSettingsPage() {
  const { reset } = useTheme();

  function handleReset() {
    if (!confirm('Reset all theme settings to defaults?')) return;
    reset();
    toast.success('Theme reset to defaults');
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-title text-navy-900">Theme Settings</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Changes apply instantly across the entire app and are saved automatically.
          </p>
        </div>
        <button onClick={handleReset} className="btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0 mt-1">
          <RefreshIcon className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>

      {/* ── Brand Colours ── */}
      <Section title="Brand Colours" subtitle="Primary action colour used on buttons, active nav, and links">
        <ColorRow varKey="--color-primary"       label="Primary"       description="Buttons, active nav highlight, links" />
        <ColorRow varKey="--color-primary-hover"  label="Primary Hover" description="Button and link hover state" />
      </Section>

      {/* ── Layout Colours ── */}
      <Section title="Layout Colours" subtitle="Structural backgrounds used throughout the shell">
        <ColorRow varKey="--color-bg-header" label="Header / Sidebar"  description="Sidebar background, topbar, table column headers" />
        <ColorRow varKey="--color-bg-page"   label="Page Background"   description="Main content area background" />
        <ColorRow varKey="--color-bg-card"   label="Card Background"   description="Cards, modals, and panels" />
        <ColorRow varKey="--color-border"    label="Border"            description="All borders and dividers" />
      </Section>

      {/* ── Text Colours ── */}
      <Section title="Text Colours">
        <ColorRow varKey="--color-text-primary"   label="Primary Text"  description="Headings and key content" />
        <ColorRow varKey="--color-text-secondary"  label="Muted Text"    description="Sub-text, placeholders, metadata" />
        <ColorRow varKey="--color-text-on-dark"    label="Text on Dark"  description="Text over dark backgrounds — sidebar, toast notifications" />
      </Section>

      {/* ── Font Sizes ── */}
      <Section title="Font Sizes" subtitle="Drag sliders to adjust — all text updates live">
        <SizeRow varKey="--fs-label"  label="Label"          min={9}  max={16} description="Form labels, table column headers" />
        <SizeRow varKey="--fs-body"   label="Body / Input"   min={11} max={18} description="Body text, input fields, toast notifications" />
        <SizeRow varKey="--fs-list"   label="List Row"       min={11} max={18} description="Text inside list and table rows" />
        <SizeRow varKey="--fs-header" label="Section Header" min={12} max={24} description="Card and section headings" />
        <SizeRow varKey="--fs-title"  label="Page Title"     min={14} max={32} description="Main h1 page titles" />
      </Section>

      {/* ── Button Style ── */}
      <Section title="Button Style">
        <SizeRow varKey="--btn-radius" label="Corner Radius" min={0} max={20} description="Border radius for all buttons" />
        <SizeRow varKey="--btn-fs"     label="Font Size"     min={10} max={16} description="Text size inside buttons" />
      </Section>

      {/* ── Icon Sizes ── */}
      <Section title="Icon Sizes" subtitle="Controls the size of all icons across the app">
        <SizeRow varKey="--icon-sm"   label="Small"      min={10} max={24} description="Compact icon usage (logout, chevrons)" />
        <SizeRow varKey="--icon-base" label="Base"       min={12} max={28} description="Default — nav icons, button icons" />
        <SizeRow varKey="--icon-md"   label="Medium"     min={14} max={30} description="Medium emphasis icons" />
        <SizeRow varKey="--icon-lg"   label="Large"      min={16} max={32} description="Feature / action icons" />
        <SizeRow varKey="--icon-xl"   label="Extra Large" min={18} max={40} description="Display / hero icons" />
      </Section>

      {/* Live preview */}
      <LivePreview />

    </div>
  );
}
