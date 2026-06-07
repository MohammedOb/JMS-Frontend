/**
 * Theme configuration — single source of truth for all visual properties.
 * Change values here and they cascade through the whole app via CSS variables.
 *
 * After editing, also update the matching CSS variables in src/app/globals.css :root
 * (both files must stay in sync — JS values are used in runtime code, CSS vars drive styling).
 */
const theme = {
  fonts: {
    body:    '"DM Sans", system-ui, sans-serif',
    display: '"Sora", system-ui, sans-serif',
    arabic:  '"AL-Kanz", sans-serif',
  },

  fontSizes: {
    label:    '11px',   // form labels, table column headers
    body:     '13px',   // default body text, inputs, table cells
    list:     '13px',   // list/table row text
    header:   '16px',   // card/section headings
    pageTitle:'20px',   // page h1 titles
  },

  colors: {
    primary:        '#1d6bf3',   // buttons, active nav, links
    primaryHover:   '#1558d6',
    bgPage:         '#f0f4f9',   // page background
    bgCard:         '#ffffff',   // card / modal background
    bgHeader:       '#0f2548',   // sidebar + topbar + table headers
    bgFooter:       '#0f2548',   // footer background
    textPrimary:    '#0b1d38',   // headings
    textSecondary:  '#6b7280',   // muted text
    textOnDark:     '#ffffff',   // text on dark backgrounds
    border:         '#dce4ef',
  },

  icon: {
    sm:   '14px',
    base: '16px',   // default — most nav/button icons
    md:   '18px',
    lg:   '20px',
    xl:   '24px',
  },

  button: {
    radius:   '6px',
    fontSize: '13px',
  },
}

module.exports = theme
