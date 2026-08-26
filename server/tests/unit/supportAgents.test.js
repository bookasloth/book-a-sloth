// Persona map + intro copy — pure, no DB.

const { personaFor, introMessage, FALLBACK } = require('../../config/supportAgents');

test('maps a known admin email to its persona (case/space-insensitive)', () => {
  expect(personaFor('tithi@bookasloth.in')).toBe('Tithi');
  expect(personaFor('  Tithi@BookASloth.in ')).toBe('Tithi');
});

test('unmapped or empty email falls back to a safe generic name (never leaks the email)', () => {
  expect(personaFor('stranger@example.com')).toBe(FALLBACK);
  expect(personaFor('')).toBe(FALLBACK);
  expect(personaFor(undefined)).toBe(FALLBACK);
  expect(personaFor('stranger@example.com')).not.toContain('@');
});

test('intro greets by first name when known, generically otherwise', () => {
  expect(introMessage('Tithi', 'Rahul')).toMatch(/^Hi Rahul — I'm Tithi from the Book A Sloth support team\./);
  expect(introMessage('Tithi', null)).toMatch(/^Hi — I'm Tithi from the Book A Sloth support team\./);
});
