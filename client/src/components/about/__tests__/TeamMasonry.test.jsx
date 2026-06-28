import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import TeamMasonry from "../TeamMasonry";
import { team } from "../aboutContent";

const setup = () => render(<TeamMasonry />, { wrapper: MemoryRouter });

describe("TeamMasonry", () => {
  it("renders every member with name, role and bio", () => {
    setup();
    team.members.forEach((m) => {
      expect(screen.getByText(m.name)).toBeInTheDocument();
      expect(screen.getByText(m.bio)).toBeInTheDocument();
    });
  });

  it("shows social icon links (linkedin, facebook, sloth) per member, no CTA buttons", () => {
    setup();
    const first = team.members[0];
    const card = screen.getByText(first.name).closest("article");
    const socials = within(card).getAllByRole("link");
    expect(socials.length).toBe(first.socials.length);
    expect(within(card).queryByRole("button")).toBeNull();
  });
});
