import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";
import { describe, it, expect } from "vitest";

describe("NotFound Page", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    
    expect(screen.getByText("404")).toBeDefined();
    expect(screen.getByText("Lost in the Mempool")).toBeDefined();
    expect(screen.getByText(/We couldn't find the transaction/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Return to App" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Return to App" }).getAttribute("href")).toBe("/");
  });
});
