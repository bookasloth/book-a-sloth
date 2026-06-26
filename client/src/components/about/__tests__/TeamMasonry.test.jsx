import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import TeamMasonry from "../TeamMasonry";
import { team } from "../aboutContent";

const setup = () => render(<TeamMasonry />, { wrapper: MemoryRouter });

describe("TeamMasonry", () => {
  it("opens a modal with both buttons linking to the member page", () => {
    setup();
    const m = team.members[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(m.name, "i") }));
    const dialog = screen.getByRole("dialog");
    const book = within(dialog).getByRole("link", { name: /book a session/i });
    const visit = within(dialog).getByRole("link", { name: /visit their page/i });
    expect(book.getAttribute("href")).toBe(`/${m.username}`);
    expect(visit.getAttribute("href")).toBe(`/${m.username}`);
  });

  it("closes the modal on Escape", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(team.members[0].name, "i") }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
