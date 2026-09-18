import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Live "N online" count: heartbeats this browser's session every 2 minutes
 * (and on navigation) and polls the total every 30 seconds while visible.
 */
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState(0);
  const session = useRef<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!session.current) {
      try {
        session.current = localStorage.getItem('session_id') ?? crypto.randomUUID();
        localStorage.setItem('session_id', session.current);
      } catch {
        session.current = crypto.randomUUID();
      }
    }
    const sessionId = session.current;
    const beat = () =>
      fetch('/api/active-users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, page: pathname }),
      }).catch(() => {});
    beat();
    const timer = setInterval(beat, 120_000);
    return () => clearInterval(timer);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      fetch('/api/active-users', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => alive && d.success && setActiveUsers(d.activeUsers || 0))
        .catch(() => {});
    };
    const first = setTimeout(poll, 1000);
    const timer = setInterval(poll, 30_000);
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  return activeUsers;
}
