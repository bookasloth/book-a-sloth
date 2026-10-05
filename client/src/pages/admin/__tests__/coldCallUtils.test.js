import { test, expect } from 'vitest';
import { parseCsv } from '../../../utils/parseCsv';
import { guessFields, mapRows, callbackPresets, countdown, formatPhone, fmtTimer, isTypingTarget, OUTCOMES } from '../sales/coldCallUtils';

const CSV = 'Day,Priority,Business,Category,Locality,Phone,WhatsApp,Email,Fit,Website,Talking Point\n'
  + '"Day 1","1","Test Clinic","Dental clinic","Area","08888700000","https://wa.me/918888700000","a@b.co","99","https://x.in","Pitch, with comma"\n'
  + '"Day 1","2","No Phone","Spa","Area","","","","90","",""\n';

test('maps the calling-list headers and drops rows without a phone', () => {
  const grid = parseCsv(CSV);
  const fields = guessFields(grid[0]);
  expect(fields).toEqual(['day', 'priority', 'business', 'category', 'locality', 'phone', 'whatsapp', 'email', 'fit', 'website', 'pitch']);
  const rows = mapRows(grid, fields);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ day: 'Day 1', business: 'Test Clinic', phone: '08888700000', pitch: 'Pitch, with comma' });
});

test('unknown headers map to null and can be overridden', () => {
  const grid = [['Shop', 'Mobile No'], ['A', '9999900000']];
  expect(guessFields(grid[0])).toEqual([null, 'phone']);
  expect(mapRows(grid, ['business', 'phone'])[0]).toEqual({ business: 'A', phone: '9999900000' });
});

test('callback presets skip times already past', () => {
  const now = new Date(2026, 9, 6, 18, 0); // Tue 18:00 local
  const labels = callbackPresets(now).map((p) => p.label);
  expect(labels).toEqual(['In 1 hr', 'Tomorrow 11am', 'Mon 11am']);
  const morning = callbackPresets(new Date(2026, 9, 6, 9, 0)).map((p) => p.label);
  expect(morning).toContain('Today 5pm');
});

test('formatting helpers', () => {
  const now = new Date('2026-10-06T06:00:00Z');
  expect(countdown('2026-10-06T06:12:00Z', now)).toBe('due in 12 min');
  expect(countdown('2026-10-06T05:55:00Z', now)).toBe('overdue 5 min');
  expect(countdown('2026-10-06T08:30:00Z', now)).toBe('due in 2h 30m');
  expect(formatPhone('918888705552')).toBe('+91 88887 05552');
  expect(fmtTimer(95)).toBe('1:35');
  expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
  expect(isTypingTarget({ tagName: 'DIV', isContentEditable: false })).toBe(false);
  expect(OUTCOMES.map((o) => o.hotkey)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
});
