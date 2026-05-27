export const parseJson = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

export const memberKey = (m) => String(m.ITS_ID || m.ITSNo || m.AccNo || '').trim();

export const buildPrefill = (questions, m, lookupMode, lookupVal) => {
  if (!m) return {};
  const map = {};
  questions.forEach(q => {
    const t = q.QuestionText.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (/\b(full\s?name|name)\b/.test(t))                              map[q.ID] = m.FullName || m.Full_Name || '';
    if (/\b(mobile|phone|whatsapp|contact)\b/.test(t))                 map[q.ID] = m.Mobile || '';
    if (/\b(sector|masjid)\b/.test(t))                                 map[q.ID] = m.Sector || '';
    if (/\b(its|itsno|its\s?no|its\s?number)\b/.test(t))              map[q.ID] = String(m.ITSNo || m.ITS_ID || (lookupMode === 'itsno' ? lookupVal : '') || '');
    if (/\b(acc\s?no|accno|account\s?no|account\s?number|sabeel)\b/.test(t)) map[q.ID] = String(m.AccNo || (lookupMode === 'accno' ? lookupVal : '') || '');
    if (/\b(mohallah|mohalla|locality)\b/.test(t))                     map[q.ID] = m.MohallaDescription || '';
    if (/\b(gender|sex)\b/.test(t))                                    map[q.ID] = m.Gender || '';
    if (/\b(age)\b/.test(t))                                           map[q.ID] = m.Age != null ? String(m.Age) : '';
    if (/\b(misaq|mithaq)\b/.test(t))                                  map[q.ID] = m.Misaq || '';
    if (/\b(marital|married)\b/.test(t))                               map[q.ID] = m.MaritalStatus || m.Marital_Status || '';
  });
  return map;
};
