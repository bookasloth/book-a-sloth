import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatStrip from "../StatStrip";

describe("StatStrip", () => {
  it("renders every stat label and its final value", () => {
    render(<StatStrip />);
    expect(screen.getByText(/commission, ever/i)).toBeInTheDocument();
    expect(screen.getByText(/uptime/i)).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("<24h")).toBeInTheDocument();
  });
});
