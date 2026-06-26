import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LeadForm from "../lp/_shared/LeadForm";

const startVendorGoogleAuth = vi.fn();
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ startVendorGoogleAuth }),
}));
vi.mock("../../hooks/useUtm", () => ({ default: () => ({}) }));
vi.mock("../../services/analytics", () => ({
  analytics: { track: vi.fn() },
  EVENTS: { LEAD_CAPTURED: "LEAD_CAPTURED", LP_CTA_CLICKED: "LP_CTA_CLICKED" },
}));

import { analytics } from "../../services/analytics";

beforeEach(() => {
  startVendorGoogleAuth.mockReset();
  vi.mocked(analytics.track).mockReset();
});

describe("LeadForm google-only mode", () => {
  it("renders no email field and a single Google CTA", () => {
    render(<LeadForm slug="topmate-vs-bookasloth" slot="hero" mode="google-only" ctaLabel="Continue with Google" />);
    expect(screen.queryByPlaceholderText("you@email.com")).toBeNull();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeTruthy();
  });

  it("clicking the CTA fires LP_CTA_CLICKED with_email:false and starts Google signup", () => {
    render(<LeadForm slug="topmate-vs-bookasloth" slot="hero" mode="google-only" ctaLabel="Continue with Google" />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(analytics.track).toHaveBeenCalledWith("LP_CTA_CLICKED", expect.objectContaining({ slug: "topmate-vs-bookasloth", slot: "hero", with_email: false }));
    expect(startVendorGoogleAuth).toHaveBeenCalledWith("signup");
  });

  it("default (email) mode still renders the email field", () => {
    render(<LeadForm slug="x" slot="hero" />);
    expect(screen.getByPlaceholderText("you@email.com")).toBeTruthy();
  });
});
