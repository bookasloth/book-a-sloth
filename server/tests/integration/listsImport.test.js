// server/tests/integration/listsImport.test.js
const upserts = [];
jest.mock('../../config/supabase', () => require('./helpers').makeSbMock());
jest.mock('../../services/crm/leadService', () => ({
  upsertLead: (patch, opts) => { upserts.push({ patch, opts }); return Promise.resolve({ lead: { id: 'x' }, created: true }); },
}));
jest.mock('../../services/crm/listService', () => ({
  createList: () => Promise.resolve({ id: 'LID', name: 'X' }),
  getList: () => Promise.resolve({ id: 'LID' }),
  listLists: () => Promise.resolve([]),
}));
const c = require('../../controllers/adminCrmController');
const mockRes = () => { const r = {}; r.status = (s) => { r._s = s; return r; }; r.json = (j) => { r._j = j; return r; }; return r; };

test('importCommit into a list sets status=list, list_id, skipMetaLead', async () => {
  upserts.length = 0;
  const req = { body: { listId: 'LID', rows: [{ name: 'A', email: 'a@b.com', website: 'https://a.io', twitter: 'https://x.com/a' }] }, admin: { id: 'adm' } };
  await c.importCommit(req, mockRes());
  expect(upserts[0].patch.status).toBe('list');
  expect(upserts[0].patch.list_id).toBe('LID');
  expect(upserts[0].patch.website).toBe('https://a.io');
  expect(upserts[0].patch.attributes.twitter).toBe('https://x.com/a'); // unknown social stashed
  expect(upserts[0].opts.skipMetaLead).toBe(true);
});
