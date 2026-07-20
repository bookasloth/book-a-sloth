'use strict';

// Mocks — keep it simple. anthropicClient unconfigured so no real Haiku calls.
jest.mock('../services/ai/anthropicClient', () => ({
  MODELS: { generate: 'claude-haiku-4-5-20251001' },
  isConfigured: () => false,
  getClient: () => null,
}));
jest.mock('../lib/botBudget', () => ({
  tryConsume: jest.fn(async () => ({ allowed: true, reason: null })),
  _reset: () => {},
}));
jest.mock('../lib/botIpBlock', () => ({
  isBlocked: jest.fn(async () => false),
  block: jest.fn(async () => {}),
}), { virtual: true });

jest.mock('../config/supabase', () => ({ supabaseAdmin: {} }));

const guard = require('../services/bot/abuseGuard');
// countStrikes reads supabaseAdmin; stub it by spying on the module fn is not
// exported, so drive strike-count via a supabase query mock instead.
const { supabaseAdmin } = require('../config/supabase');

function stubStrikeRows(rows) {
  supabaseAdmin.from = () => ({
    select: () => ({
      eq: () => ({
        in: async () => ({ data: rows, error: null }),
      }),
    }),
  });
}

describe('normalizeForMatch', () => {
  const N = (s) => guard.normalizeForMatch(s);

  it('glues spaced-out letters so "f u c k" is catchable', () => {
    expect(N('f u c k').glued.split(' ')).toContain('fuck');
  });
  it('collapses 3+ repeats: chuuutiya -> chutiya', () => {
    expect(N('chuuutiya').spaced).toBe('chutiya');
  });
  it('keeps double letters: pass stays pass', () => {
    expect(N('pass').spaced).toBe('pass');
  });
  it('glues punctuation-separated single chars: m.a.d.a.r.c.h.o.d', () => {
    expect(N('m.a.d.a.r.c.h.o.d').glued.split(' ')).toContain('madarchod');
  });
  it('applies leetmap: fvck-style 5h1t -> shit', () => {
    expect(N('5h1t').spaced).toBe('shit');
  });
});

describe('checkListed token safety', () => {
  it('does not substring-match: assess / class / cocktail are clean', () => {
    expect(guard.checkListed('assess my class cocktail')).toBeNull();
  });
  it('flags hard english whole-token: fuck', () => {
    const r = guard.checkListed('this is fuck');
    expect(r && r.tier).toBe('hard');
  });
  it('flags hard hindi whole-token: chutiya', () => {
    const r = guard.checkListed('tu chutiya');
    expect(r && r.tier).toBe('hard');
  });
  it('flags directed phrase: you are useless', () => {
    const r = guard.checkListed('you are useless bot');
    expect(r && r.tier).toBe('directed');
  });
  it('flags threat: kill yourself', () => {
    const r = guard.checkListed('just kill yourself');
    expect(r && r.tier).toBe('threat');
  });
});

describe('checkListed precedence threat > hard > directed > mild', () => {
  it('threat beats hard', () => {
    expect(guard.checkListed('fuck you, kill yourself').tier).toBe('threat');
  });
  it('hard beats directed/mild', () => {
    // "you are stupid" is directed; adding a hard word promotes to hard
    expect(guard.checkListed('you are stupid fuck').tier).toBe('hard');
  });
  it('mild alone is mild', () => {
    expect(guard.checkListed('this is stupid').tier).toBe('mild');
  });
});

describe('evaluate', () => {
  const OLD = process.env;
  beforeEach(() => {
    process.env = { ...OLD };
    stubStrikeRows([]);
  });
  afterEach(() => { process.env = OLD; });

  it('returns null when BOT_ROAST_ENABLED unset (feature off)', async () => {
    delete process.env.BOT_ROAST_ENABLED;
    expect(await guard.evaluate({ q: 'fuck you', conversationId: 'c1' })).toBeNull();
  });

  it('returns a canned roast obj for a HARD word when flag on + Haiku unconfigured', async () => {
    process.env.BOT_ROAST_ENABLED = 'true';
    const r = await guard.evaluate({ q: 'you fuck', conversationId: 'c1' });
    expect(r.source).toBe('roast');
    expect(r.locked).toBe(false);
    expect(typeof r.answer).toBe('string');
    expect(r.answer.length).toBeGreaterThan(0);
  });

  it('returns cool-off when strikes already high (4+)', async () => {
    process.env.BOT_ROAST_ENABLED = 'true';
    stubStrikeRows([{ source: 'roast' }, { source: 'roast' }, { source: 'threat' }]); // 1+1+2 = 4
    const r = await guard.evaluate({ q: 'you fuck', conversationId: 'c1' });
    expect(r.source).toBe('abuse_lock');
    expect(r.locked).toBe(true);
    expect(r.answer).toBe(guard.COOLOFF_MSG);
  });

  it('threat path returns threat shutdown, not a roast', async () => {
    process.env.BOT_ROAST_ENABLED = 'true';
    const r = await guard.evaluate({ q: 'kill yourself', conversationId: 'c1' });
    expect(r.source).toBe('threat');
    expect(r.answer).toBe(guard.THREAT_MSG);
  });
});
