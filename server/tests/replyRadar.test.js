const { redditQuery, toRedditPost, quoraQuestionUrl, toMarkdown } = require('../scripts/replyRadar');

describe('replyRadar helpers', () => {
  test('redditQuery ORs quoted phrases', () => {
    expect(redditQuery(['booking link', 'topmate'])).toBe('("booking link" OR "topmate")');
  });

  test('toRedditPost keeps fresh open posts, drops stale/locked/busy ones', () => {
    const since = 1_000;
    const base = { id: 'abc', subreddit: 'freelance', title: 'T', selftext: 'B', permalink: '/r/freelance/comments/abc/t/', num_comments: 3, created_utc: 2_000 };
    expect(toRedditPost({ data: base }, since)).toMatchObject({ id: 'reddit:abc', where: 'r/freelance', url: 'https://www.reddit.com/r/freelance/comments/abc/t/' });
    expect(toRedditPost({ data: { ...base, created_utc: 500 } }, since)).toBeNull();
    expect(toRedditPost({ data: { ...base, locked: true } }, since)).toBeNull();
    expect(toRedditPost({ data: { ...base, num_comments: 500 } }, since)).toBeNull();
  });

  test('quoraQuestionUrl canonicalises questions and rejects non-questions', () => {
    expect(quoraQuestionUrl('https://www.quora.com/What-is-X/answer/Someone?ch=1')).toBe('https://www.quora.com/What-is-X');
    expect(quoraQuestionUrl('https://hi.quora.com/Kya-hai')).toBe('https://www.quora.com/Kya-hai');
    expect(quoraQuestionUrl('https://www.quora.com/profile/Someone')).toBeNull();
    expect(quoraQuestionUrl('https://evilquora.com/x')).toBeNull();
    expect(quoraQuestionUrl('not a url')).toBeNull();
  });

  test('toMarkdown groups by route, sorts by score, counts skips', () => {
    const row = { where: 'r/x', created: '2026-10-10', comments: 1, url: 'u', why: 'w', reply: 'r' };
    const md = toMarkdown([
      { ...row, route: 'lead', score: 4, title: 'low' },
      { ...row, route: 'lead', score: 9, title: 'high' },
      { ...row, route: 'skip', score: 1, title: 'nope' },
    ], '2026-10-10');
    expect(md).toContain('## Leads (2)');
    expect(md.indexOf('high')).toBeLessThan(md.indexOf('low'));
    expect(md).not.toContain('nope');
    expect(md).toContain('1 posts skipped');
  });
});
