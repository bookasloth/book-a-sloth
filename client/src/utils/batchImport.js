// Batch a large lead-import into fixed-size POSTs and sum the results.
//
// A single ~1000-row import POST trips the server's JSON body limit (500
// "request entity too large"), which silently failed the import modals. Chunking
// the request keeps every payload small and scales to any list size. Pure — the
// caller injects `post`, so this is unit-testable without axios.
//
// @param {(body:{rows:Array,listId:?string})=>Promise<{data:{created,merged,skipped,listId?}}>} post
// @param {Array} rows
// @param {?string} listId
// @param {number} chunk  rows per request (default 200 ≈ 33KB, well under the body cap)
// @returns {Promise<{data:{created:number,merged:number,skipped:number,listId:?string}}>}
export async function batchedImport(post, rows, listId, chunk = 200) {
  const list = Array.isArray(rows) ? rows : [];
  const total = { created: 0, merged: 0, skipped: 0, listId: listId || null };
  for (let i = 0; i < list.length; i += chunk) {
    const { data } = await post({ rows: list.slice(i, i + chunk), listId: total.listId });
    total.created += data?.created || 0;
    total.merged += data?.merged || 0;
    total.skipped += data?.skipped || 0;
    // If the list was created inline by the first batch, reuse its id for the rest.
    if (!total.listId && data?.listId) total.listId = data.listId;
  }
  return { data: total };
}
