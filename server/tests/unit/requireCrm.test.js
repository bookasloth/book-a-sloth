jest.mock('../../config/supabase', () => ({ supabaseAdmin: {} }));
jest.mock('../../services/planService', () => ({ getPlan: jest.fn() }));

const { requireCrm } = require('../../middleware/planMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireCrm (Studio gate)', () => {
  test('Studio (limits.crm=-1) → next()', async () => {
    const next = jest.fn();
    const res = mockRes();
    await requireCrm({ vendorPlan: 'professional', vendorPlanData: { limits: { crm: -1 } } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('Supreme (limits.crm=-1) → next()', async () => {
    const next = jest.fn();
    await requireCrm({ vendorPlan: 'supreme', vendorPlanData: { limits: { crm: -1 } } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('Starter (limits.crm=0) → 403 upgrade_required', async () => {
    const next = jest.fn();
    const res = mockRes();
    await requireCrm({ vendorPlan: 'starter', vendorPlanData: { limits: { crm: 0 } } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ upgrade_required: true }));
  });

  test('absent limits.crm → blocked (fail closed)', async () => {
    const next = jest.fn();
    const res = mockRes();
    await requireCrm({ vendorPlan: 'creator', vendorPlanData: { limits: {} } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
