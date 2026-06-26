import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LogoMarquee from "../LogoMarquee";
import { logos } from "../aboutContent";

describe("LogoMarquee", () => {
  it("renders both rows of logos (duplicated track)", () => {
    render(<LogoMarquee />);
    expect(screen.getAllByText(logos.row1[0].name).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(logos.row2[0].name).length).toBeGreaterThanOrEqual(2);
  });
});
