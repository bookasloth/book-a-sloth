import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CaseStudyGrid from "../CaseStudyGrid";
import { caseStudies } from "../aboutContent";

describe("CaseStudyGrid", () => {
  it("renders all 5 case-study tiles", () => {
    render(<CaseStudyGrid />);
    caseStudies.tiles.forEach((t) => {
      expect(screen.getByRole("heading", { name: t.title })).toBeInTheDocument();
    });
  });
});
