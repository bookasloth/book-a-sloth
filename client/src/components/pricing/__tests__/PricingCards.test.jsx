import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PricingCards from "../PricingCards";

// Control the interim fee-only flag. Default false = full plan display (incl. Starter).
const mockFeeOnly = vi.fn(() => false);
vi.mock("../../../hooks/useFeeOnly", () => ({ default: () => mockFeeOnly() }));

const setup = () => render(<MemoryRouter><PricingCards /></MemoryRouter>);

describe("PricingCards", () => {
  it("renders all four plan names", () => {
    const { container } = setup();
    const text = container.textContent;
    for (const name of ["Starter", "Host+", "Studio", "Enterprise"])
      expect(text).toContain(name);
  });
  it("hides the free Starter plan in fee-only mode", () => {
    mockFeeOnly.mockReturnValueOnce(true);
    const { container } = setup();
    expect(container.textContent).not.toContain("Starter");
    expect(container.textContent).toContain("Host+");
  });
  it("Enterprise CTA links to /enterprise", () => {
    const { container } = setup();
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(links).toContain("/enterprise");
  });
  it("shows persona titles", () => {
    const { container } = setup();
    expect(container.textContent).toContain("Solo Creator");
    expect(container.textContent).toContain("Teams & Agencies");
  });
});
