import { describe, test, expect, vi } from 'vitest';
import { batchedImport } from '../utils/batchImport';

const rows = (n) => Array.from({ length: n }, (_, i) => ({ email: `u${i}@x.com` }));

describe('batchedImport', () => {
  test('splits into fixed-size POSTs and sums results', async () => {
    const post = vi.fn(async ({ rows }) => ({ data: { created: rows.length, merged: 0, skipped: 0 } }));
    const { data } = await batchedImport(post, rows(987), 'LID', 200);
    expect(post).toHaveBeenCalledTimes(5);                       // 200*4 + 187
    expect(post.mock.calls.map((c) => c[0].rows.length)).toEqual([200, 200, 200, 200, 187]);
    expect(data.created).toBe(987);                              // aggregated across batches
    expect(post.mock.calls.every((c) => c[0].listId === 'LID')).toBe(true);
  });

  test('aggregates created/merged/skipped separately', async () => {
    const post = vi.fn(async () => ({ data: { created: 2, merged: 3, skipped: 1 } }));
    const { data } = await batchedImport(post, rows(6), null, 2); // 3 batches
    expect(data).toEqual({ created: 6, merged: 9, skipped: 3, listId: null });
  });

  test('reuses an inline-created listId from the first batch for later batches', async () => {
    const post = vi.fn(async ({ listId }) => ({ data: { created: 1, merged: 0, skipped: 0, listId: listId || 'NEW' } }));
    await batchedImport(post, rows(5), null, 2);                 // 3 batches, no listId given
    expect(post.mock.calls[0][0].listId).toBe(null);            // first batch creates the list
    expect(post.mock.calls[1][0].listId).toBe('NEW');           // later batches reuse it
    expect(post.mock.calls[2][0].listId).toBe('NEW');
  });

  test('empty input makes no request and returns zeros', async () => {
    const post = vi.fn();
    const { data } = await batchedImport(post, [], 'LID');
    expect(post).not.toHaveBeenCalled();
    expect(data).toEqual({ created: 0, merged: 0, skipped: 0, listId: 'LID' });
  });
});
