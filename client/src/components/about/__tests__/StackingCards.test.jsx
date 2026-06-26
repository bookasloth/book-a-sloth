import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import StackingCards from "../StackingCards";
import { stackCards } from "../aboutContent";

describe("StackingCards", () => {
  it("renders the big feature card and all 4 stacking cards", () => {
    render(<StackingCards />, { wrapper: MemoryRouter });
    expect(screen.getByRole("heading", { name: stackCards.feature.title })).toBeInTheDocument();
    stackCards.cards.forEach((c) => {
      expect(screen.getByRole("heading", { name: c.title })).toBeInTheDocument();
    });
  });

  it("each stacking card exposes primary + ghost hover buttons", () => {
    render(<StackingCards />, { wrapper: MemoryRouter });
    expect(screen.getAllByRole("link", { name: /get started/i }).length).toBe(stackCards.cards.length);
    expect(screen.getAllByRole("link", { name: /learn more/i }).length).toBe(stackCards.cards.length);
  });
});
