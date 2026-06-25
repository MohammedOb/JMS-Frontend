'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { takhmeenService } from '@/services';

export default function AlertBanners({ takhmeen = [], member, onAddTakhmeen }) {
  const { user } = useAuth();
  const sabeelType = member?.sabeelType || '';

  const [rules, setRules] = useState(null); // null = loading

  useEffect(() => {
    takhmeenService.loadRequiredTakhmeenRules()
      .then(res => setRules(res.data?.data || []))
      .catch(() => setRules([]));
  }, []);

  // Same allowedSubHeadSet pattern as mumin-takhmeen report and TakhmeenTab.
  const allowedSubHeadSet = useMemo(() => {
    if (!user) return null;
    if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return null;
    if (!user.scopes) return null;
    const skip = new Set(['sector', 'Sector', 'ForYear', 'createdBy', 'HubMainHead']);
    const allowed = [];
    Object.entries(user.scopes).forEach(([type, arr]) => {
      if (!skip.has(type) && Array.isArray(arr) && arr.length > 0)
        allowed.push(...arr.map(v => v.toLowerCase()));
    });
    return allowed.length > 0 ? new Set(allowed) : null;
  }, [user]);

  if (!user?.ForYearAll || !sabeelType) return null;
  if (rules === null) return null; // still loading

  // Match by includes() so 'Regular' matches 'Sabeel Regular', 'Mutaveteen' matches 'Sabeel Mutaveteen', etc.
  const typeRules = rules.filter(r => sabeelType.toLowerCase().includes(r.sabeel_type.toLowerCase()));

  // Resolve the year for a rule: year_override > year_key from user > ForYearAll
  const resolveYear = (rule) =>
    rule.year_override
      ? String(rule.year_override)
      : String(user[rule.year_key] || user.ForYearAll || '');

  const hasEntry = (rule) => {
    const yr = resolveYear(rule);
    return takhmeen.some(r =>
      String(r.forYear) === yr &&
      (rule.check_by === 'mainHead' ? r.mainHead === rule.main_head : r.subHead === rule.sub_head)
    );
  };

  const sabeelSubHead = sabeelType; // member's actual SabeelType matches the takhmeen subHead
  const parseYear = (yr) => parseInt(String(yr), 10) || 0;

  const sabeelExistsForYear = (yr) =>
    takhmeen.some(r => r.subHead === sabeelSubHead && parseYear(r.forYear) <= parseYear(yr));

  const shouldShow = (rule) => {
    if (rule.year_override || rule.year_key) return sabeelExistsForYear(resolveYear(rule));
    return true;
  };

  const alerts = typeRules
    .filter(r => !allowedSubHeadSet || allowedSubHeadSet.has(r.sub_head.toLowerCase()))
    .filter(r => shouldShow(r) && !hasEntry(r));

  return (
    <div className="flex flex-col gap-2 h-full">
      {alerts.map((a) => {
        const yr = resolveYear(a);
        return (
          <div
            key={a.sub_head}
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[12px] bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 text-amber-900"
          >
            <span className="flex-1">⚠ {a.label} for <strong>{yr}</strong></span>
            <button
              className="btn btn-sm bg-amber-500 text-white border-amber-500 shrink-0"
              onClick={() => onAddTakhmeen?.(a.main_head, a.sub_head, yr)}
            >
              {a.btn_label}
            </button>
          </div>
        );
      })}

      {alerts.length === 0 && (
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[12px] bg-green-50 border border-green-200 border-l-4 border-l-green-500 text-green-800">
          <span>✓ All takhmeen entries are complete for {sabeelType}</span>
        </div>
      )}
    </div>
  );
}
