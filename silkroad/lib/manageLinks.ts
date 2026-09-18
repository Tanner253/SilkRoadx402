/**
 * Browser-side memory of manage links.
 *
 * Manage links are the creator's only credential, so they live in the URL
 * fragment (/fundraisers/<id>#manage=<token>): fragments are never sent to
 * servers, never logged, and never leak through the Referer header. When a
 * manage link is opened we copy the token here and strip it from the address
 * bar.
 *
 * All of this is a convenience: clearing site data loses it, and the only
 * durable copy of a manage link is the one the creator saves.
 */

const MANAGE_KEY = 'openfund.manage.v1';

export interface ManagedCampaign {
  token: string;
  title: string;
  savedAt: string;
}

function read<T>(key: string): Record<string, T> {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write<T>(key: string, value: Record<string, T>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the manage link itself still works */
  }
}

export function manageUrl(id: string, token: string): string {
  return `${window.location.origin}/fundraisers/${id}#manage=${token}`;
}

export function saveManaged(id: string, token: string, title: string) {
  const all = read<ManagedCampaign>(MANAGE_KEY);
  all[id] = { token, title, savedAt: new Date().toISOString() };
  write(MANAGE_KEY, all);
}

export function getManageToken(id: string): string | null {
  return read<ManagedCampaign>(MANAGE_KEY)[id]?.token ?? null;
}

export function allManaged(): Record<string, ManagedCampaign> {
  return read<ManagedCampaign>(MANAGE_KEY);
}

export function forgetManaged(id: string) {
  const all = read<ManagedCampaign>(MANAGE_KEY);
  delete all[id];
  write(MANAGE_KEY, all);
}

/**
 * If the current URL carries #manage=<token>, return it and remove it from
 * the address bar (so it isn't left sitting in history or screenshots).
 */
export function takeManageTokenFromUrl(): string | null {
  const match = window.location.hash.match(/(?:^#|&)manage=([A-Za-z0-9_-]{20,})/);
  if (!match) return null;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return match[1];
}

/** Parse a pasted manage link → { id, token }, or null if it isn't one. */
export function parseManageLink(input: string): { id: string; token: string } | null {
  const m = input.trim().match(/fundraisers\/([a-f0-9]{24})[^#]*#(?:.*&)?manage=([A-Za-z0-9_-]{20,})/i);
  return m ? { id: m[1], token: m[2] } : null;
}
