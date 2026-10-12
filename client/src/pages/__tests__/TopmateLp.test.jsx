import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopmateVsBookASloth from "../compare/TopmateVsBookASloth";

vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ startVendorGoogleAuth: vi.fn() }) }));
vi.mock("../../hooks/useUtm", () => ({ default: () => ({}) }));
vi.mock("../../hooks/useDocumentMeta", () => ({ default: () => {} }));
vi.mock("../../services/analytics", () => ({
  analytics: { page: vi.fn(), track: vi.fn() },
  EVENTS: { LP_VIEWED: "LP_VIEWED", LEAD_CAPTURED: "LEAD_CAPTURED", LP_CTA_CLICKED: "LP_CTA_CLICKED" },
}));

const renderPage = () => render(<MemoryRouter><TopmateVsBookASloth /></MemoryRouter>);

describe("TopmateVsBookASloth (Topmate-style rebuild)", () => {
  it("renders the Creator Storefront hero", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText(/Storefront/i)).toBeTruthy();
  });

  it("uses single-button CTAs to /be-a-sloth and no email field", () => {
    renderPage();
    expect(screen.queryByPlaceholderText("you@email.com")).toBeNull();
    const ctas = screen.getAllByRole("link", { name: /start my page/i });
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    expect(ctas.every((a) => a.getAttribute("href") === "/be-a-sloth")).toBe(true);
  });

  it("renders the creators showcase block", () => {
    renderPage();
    expect(screen.getByText(/See what the best creators build/i)).toBeTruthy();
  });
});
