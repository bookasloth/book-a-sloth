// Pure-function tests for the Bolt intent layer (no DB, no network).
const { classify } = require('../services/bot/intent');
const { handle, buildClarify, HANDLERS, CLARIFY_PROMPTS } = require('../services/bot/intentHandlers');

describe('classify — precedence & confidence', () => {
  it('plain booking → high, booking', () => {
    expect(classify('How do I book a service?')).toMatchObject({ intent: 'booking', confidence: 'high' });
  });
  it('"cancel my booking" → reschedule beats booking (specific wins)', () => {
    expect(classify('I want to cancel my booking')).toMatchObject({ intent: 'reschedule', confidence: 'high' });
  });
  it('single specific topic → high', () => {
    expect(classify('how does calendar sync work')).toMatchObject({ intent: 'calendar', confidence: 'high' });
    expect(classify('how do reviews work')).toMatchObject({ intent: 'reviews', confidence: 'high' });
    expect(classify('how do i become a host')).toMatchObject({ intent: 'host', confidence: 'high' });
  });
  it('two specific topics → low (clarify), no single intent', () => {
    const r = classify('reschedule my booking and refund me');
    expect(r.confidence).toBe('low');
    expect(r.intent).toBeNull();
    expect(r.candidates).toEqual(expect.arrayContaining(['reschedule', 'payments']));
  });
  it('unmatched → none, null intent', () => {
    expect(classify('what is the meaning of life')).toMatchObject({ intent: null, confidence: 'none' });
  });
  it('empty → none', () => {
    expect(classify('')).toMatchObject({ intent: null, confidence: 'none' });
  });
});

describe('handle', () => {
  it('returns answer + cards for every known intent', () => {
    for (const name of Object.keys(HANDLERS)) {
      const h = handle(name);
      expect(h).toBeTruthy();
      expect(typeof h.answer).toBe('string');
      expect(Array.isArray(h.cards)).toBe(true);
      expect(h.cards.length).toBeGreaterThan(0);
      for (const c of h.cards) {
        expect(c.label).toBeTruthy();
        expect(['route', 'send']).toContain(c.action.type);
        expect(c.action.value).toBeTruthy();
      }
    }
  });
  it('null for unknown intent', () => {
    expect(handle('nope')).toBeNull();
  });
});

describe('buildClarify — loop guard', () => {
  it('each clarify chip re-classifies to a single (high) intent', () => {
    const { cards } = buildClarify(['reschedule', 'payments', 'calendar']);
    expect(cards.length).toBe(3);
    for (const c of cards) {
      expect(c.action.type).toBe('send');
      expect(classify(c.action.value).confidence).toBe('high');
    }
  });
  it('every CLARIFY_PROMPTS value resolves to a single high-confidence intent', () => {
    for (const p of Object.values(CLARIFY_PROMPTS)) {
      expect(classify(p.value).confidence).toBe('high');
    }
  });
});
