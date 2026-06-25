import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import About from "../About";

describe("About page", () => {
  it("renders all major sections without crashing", () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );
    const h1 = screen.getByRole("heading", { level: 1 }).textContent.replace(/\s+/g, " ");
    expect(h1).toMatch(/worth protecting/i);
    expect(screen.getByText(/what we believe/i)).toBeInTheDocument();
    expect(screen.getByText(/how we build/i)).toBeInTheDocument();
    expect(screen.getByText(/questions, answered/i)).toBeInTheDocument();
    expect(screen.getByText(/calmer booking business/i)).toBeInTheDocument();
  });
});
