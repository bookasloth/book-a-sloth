import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopmateVsBookASloth from "../lp/TopmateVsBookASloth";

vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ startVendorGoogleAuth: vi.fn() }) }));
vi.mock("../../hooks/useUtm", () => ({ default: () => ({}) }));
vi.mock("../../hooks/useDocumentMeta", () => ({ default: () => {} }));
vi.mock("../../services/analytics", () => ({
  analytics: { page: vi.fn(), track: vi.fn() },
  EVENTS: { LP_VIEWED: "LP_VIEWED", LEAD_CAPTURED: "LEAD_CAPTURED", LP_CTA_CLICKED: "LP_CTA_CLICKED" },
}));
vi.mock("../../components/home/images", () => ({ HERO_FACES: [] }));

const renderPage = () => render(<MemoryRouter><TopmateVsBookASloth /></MemoryRouter>);

describe("TopmateVsBookASloth", () => {
  it("renders the anti-Topmate hero and comparison", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText(/Without the 30% tax/i)).toBeTruthy();
    expect(screen.getByText(/Book A Sloth vs Topmate/i)).toBeTruthy();
  });
  it("uses one-click Google CTAs and no email field", () => {
    renderPage();
    expect(screen.queryByPlaceholderText("you@email.com")).toBeNull();
    expect(screen.getAllByRole("button", { name: /continue with google/i }).length).toBeGreaterThanOrEqual(1);
  });
  it("keeps the date-stamped commission disclaimer", () => {
    renderPage();
    expect(screen.getByText(/as of/i)).toBeTruthy();
  });
});
