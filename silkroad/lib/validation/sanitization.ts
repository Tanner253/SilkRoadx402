/**
 * User text handling.
 *
 * React escapes text when rendering and nothing in the app renders user
 * input as HTML, so text is stored as the user typed it. Escaping it on the
 * way in only ever showed up later as literal "&#x27;" in titles.
 */

import validator from 'validator';

/** Strip control characters (keeping tab and newline) and trim. */
export function plainText(input: string): string {
  if (!input) return '';
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/** Decode text that older code stored HTML-escaped, for display. */
export function decodeEscaped(input: string | undefined | null): string {
  return input ? validator.unescape(input) : '';
}
