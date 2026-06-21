jest.mock('../../config/supabase', () => require('./helpers').makeSbMock());
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, _res, next) => { req.user = { id: 'vendor-uuid' }; next(); },
}));
jest.mock('../../middleware/planMiddleware', () => ({
  attachPlan:        (_r, _s, n) => n(),
  checkServiceLimit: (_r, _s, n) => n(),
}));
jest.mock('../../middleware/requireFeature', () => ({
  requireFeature: () => (_r, _s, n) => n(),
}));

const request  = require('supertest');
const express  = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const serviceRoutes = require('../../routes/serviceRoutes');

const app = express();
app.use(express.json());
app.use('/api/services', serviceRoutes);

// chainable stub whose terminal (single/maybeSingle) resolves `resolved`
const chain = (resolved) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  neq:    jest.fn().mockReturnThis(),
  order:  jest.fn().mockReturnThis(),
  single:      jest.fn().mockResolvedValue(resolved),
  maybeSingle: jest.fn().mockResolvedValue(resolved),
});

afterEach(() => jest.clearAllMocks());

describe('POST /api/services — category validation', () => {
  test('201 — persists a category the host owns', async () => {
    supabaseAdmin.from
      .mockReturnValueOnce(chain({ data: { categories: ['career-coach'], primary_category: 'career-coach' }, error: null })) // profiles load
      .mockReturnValueOnce(chain({ data: null, error: null })) // uniqueSlug check (slug free)
      .mockReturnValueOnce(chain({ data: { id: 'svc-9', category: 'career-coach' }, error: null })); // insert
    const res = await request(app).post('/api/services')
      .send({ title: 'Resume Review', category: 'career-coach', price: 500, duration: 30 });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('career-coach');
  });

  test('400 — category the host does not own', async () => {
    supabaseAdmin.from
      .mockReturnValueOnce(chain({ data: { categories: ['career-coach'], primary_category: 'career-coach' }, error: null }));
    const res = await request(app).post('/api/services')
      .send({ title: 'Tattoo', category: 'tattoo-artist', price: 500, duration: 30 });
    expect(res.status).toBe(400);
  });
});
