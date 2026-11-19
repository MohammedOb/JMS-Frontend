'use client';
// The Help icon and panel from the shared help service (AppHelpCenter).
//
// The panel is that service's own script, in its own shadow DOM, so it shares no React and
// no CSS with JMS. It is absent unless NEXT_PUBLIC_HELP_URL was set at build time, and the
// API only issues a help pass once HELP_SECRET is set there. If either is missing, or the
// help service is down, there is simply no icon and JMS works as before.
//
// kind="staff" uses the office login (jms_token); kind="member" uses the member portal
// login (jms_mumin_token). Each gets only the articles for what that login can do.

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { resolveApiBaseUrl } from '@/lib/api';

const HELP_URL = (process.env.NEXT_PUBLIC_HELP_URL || '').replace(/\/$/, '');

const SOURCES = {
  staff:  { tokenKey: 'jms_token',       path: 'help/token' },
  member: { tokenKey: 'jms_mumin_token', path: 'mumin/help/token' },
};

/**
 * Asks the JMS API for a short-lived help pass. Plain fetch rather than the app's axios
 * clients, so a refusal here never triggers their sign-out-on-401 handling.
 * Returns null when there is no login or Help isn't connected, which shows no icon.
 */
export async function fetchHelpPass(kind) {
  const source = SOURCES[kind];
  const login = source && localStorage.getItem(source.tokenKey);
  if (!login) return null;
  const base = resolveApiBaseUrl();
  const url = new URL(source.path, base.endsWith('/') ? base : `${base}/`);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${login}` }, cache: 'no-store' });
  if ([401, 403, 404].includes(res.status)) return null;
  if (!res.ok) throw new Error(`Help pass failed (${res.status})`);
  return (await res.json()).token || null;
}

export default function HelpWidget({ kind = 'staff' }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!HELP_URL || !SOURCES[kind]) return undefined;
    const help = () => window.AppHelp;
    const start = () => help()?.init({
      getToken: () => fetchHelpPass(kind),
      // JMS addresses have no per-organisation part, so an article's screen is used as is.
      onNavigate: (path) => routerRef.current.push(path),
    });

    if (help()) start();
    else {
      const script = document.createElement('script');
      script.src = `${HELP_URL}/widget.js`;
      script.async = true;
      script.onload = start;
      document.body.append(script);
    }
    // Signing out unmounts this, which removes the panel and its saved conversation.
    return () => help()?.destroy();
  }, [kind]);

  return null;
}
