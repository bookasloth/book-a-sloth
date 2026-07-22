import { describe, it, expect } from "vitest";
import { ALL_PLANS, ENTERPRISE_PLAN, PLAN_COLUMNS, PLAN_MATRIX, STARTER_PLAN, PAID_PLANS } from "../plans";

describe("plans data — redesign fields", () => {
  it("every display plan has accent + icon + persona", () => {
    for (const p of [STARTER_PLAN, ...PAID_PLANS, ENTERPRISE_PLAN]) {
      expect(p.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof p.icon).toBe("string");
      expect(p.persona.title.length).toBeGreaterThan(0);
      expect(p.persona.blurb.length).toBeGreaterThan(0);
    }
  });
  it("ENTERPRISE_PLAN links to /enterprise with custom price", () => {
    expect(ENTERPRISE_PLAN.price).toBe("Custom");
    expect(ENTERPRISE_PLAN.cta.to).toBe("/enterprise");
    expect(ENTERPRISE_PLAN.features.length).toBeGreaterThan(0);
  });
  it("PLAN_COLUMNS has an enterprise column and every matrix row fills it", () => {
    expect(PLAN_COLUMNS.map((c) => c.key)).toContain("enterprise");
    for (const section of PLAN_MATRIX)
      for (const row of section.rows)
        expect(row).toHaveProperty("enterprise");
  });
  it("ALL_PLANS keeps 3 signup tiers (Enterprise is separate)", () => {
    expect(ALL_PLANS.map((p) => p.slug)).toEqual(["starter", "creator", "professional"]);
  });
});
