import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConsentBanner from "../../components/common/ConsentBanner";

let decided = false;

vi.mock("../../services/analytics", () => ({
  analytics: {
    hasDecided: () => decided,
    setConsent: vi.fn(),
  },
}));

beforeEach(() => {
  decided = false;
});

describe("ConsentBanner", () => {
  it("slim variant renders no cookie image", () => {
    const { container } = render(<ConsentBanner variant="slim" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: /agree/i })).toBeTruthy();
  });

  it("full variant (default) renders the cookie image", () => {
    const { container } = render(<ConsentBanner />);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders nothing once decided", () => {
    decided = true;
    const { container } = render(<ConsentBanner variant="slim" />);
    expect(container.firstChild).toBeNull();
  });
});
