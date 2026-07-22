import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PricingCards from "../PricingCards";

const setup = () => render(<MemoryRouter><PricingCards /></MemoryRouter>);

describe("PricingCards", () => {
  it("renders all four plan names", () => {
    const { container } = setup();
    const text = container.textContent;
    for (const name of ["Starter", "Host+", "Studio", "Enterprise"])
      expect(text).toContain(name);
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
