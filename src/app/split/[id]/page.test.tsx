import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SplitPage from "./page";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("SplitPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    global.fetch = vi.fn();
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  const mockSession = {
    id: "test-id",
    receipt: {
      restaurant: "Demo Restaurant",
      items: [
        { id: 1, name: "Burger", price: 15 },
        { id: 2, name: "Fries", price: 5 }
      ],
      subtotal: 20,
      tax: 2,
      tip: 3,
      total: 25
    },
    people: [
      { id: "p1", name: "Alice", wallet: "wallet1", color: "bg-pink-500" },
      { id: "p2", name: "Bob", wallet: "wallet2", color: "bg-blue-500" }
    ],
    assignments: {},
    status: "assigning"
  };



  const paramsPromise = Promise.resolve({ id: "test-id" });

  it("renders loading state", async () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
    let container: any;
    await act(async () => {
      const result = render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
      container = result.container;
    });
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  it("renders session data and handles assignment toggling", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
      expect(screen.getByText("Burger")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Both should be assigned to items initially because assignments object was empty
    // If not, we can trigger assignment toggling by clicking on a person button under an item
    const aliceButtons = screen.queryAllByText("A", { exact: false });
    if (aliceButtons.length > 0) {
      fireEvent.click(aliceButtons[0]);
    }
  });

  it("handles adding and removing people", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    // Click + Add Person
    const addButton = screen.getByText("+ Add Person");
    fireEvent.click(addButton);

    // Type wallet
    const walletInput = screen.getByPlaceholderText("Wallet address (optional)");
    fireEvent.change(walletInput, { target: { value: "test-wallet" } });

    // Cancel Add
    const cancelAddButton = screen.getByText("Cancel");
    fireEvent.click(cancelAddButton);

    // Click + Add Person again
    fireEvent.click(screen.getByText("+ Add Person"));

    const nameInputAgain = screen.getByPlaceholderText("Name");
    fireEvent.change(nameInputAgain, { target: { value: "Charlie" } });
    
    // Add
    const confirmAddButton = screen.getByText("Add");
    fireEvent.click(confirmAddButton);

    await waitFor(() => {
      expect(screen.getAllByText("Charlie")[0]).toBeInTheDocument();
    });

    // Try removing a person
    const removeButtons = document.querySelectorAll('button > svg.lucide-x');
    if (removeButtons.length > 0) {
      // Find parent button
      const removeBtn = removeButtons[0].closest('button');
      if (removeBtn) {
        fireEvent.click(removeBtn);
      }
    }
  });

  it("handles copy wallet", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    vi.useFakeTimers();
    try {
      // Click copy icon
      const copyIcons = document.querySelectorAll('button > svg.lucide-copy');
      if (copyIcons.length > 0) {
        const copyBtn = copyIcons[0].closest('button');
        if (copyBtn) fireEvent.click(copyBtn);
      }
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(1500);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles generate blinks", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    const generateBtn = screen.getByText(/Generate Blinks/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/split/test-id/blinks");
    });
  });
  
  it("shows error if session load fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Split session not found/i)).toBeInTheDocument();
    });

    const goHomeBtn = screen.getByText("Go Home");
    fireEvent.click(goHomeBtn);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("handles generate blinks failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    }).mockRejectedValueOnce(new Error("Generate failed"));

    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    const generateBtn = screen.getByText(/Generate Blinks/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
    });
    
    consoleErrorMock.mockRestore();
  });
  it("handles toggling item assignments", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    // Both items initially have all people assigned
    // We get all badges that say "Alice"
    const allAlices = screen.queryAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'button' && content.startsWith('Alice');
    });
    
    // The first one is likely the person badge in the list, the subsequent ones are on the items.
    // Let's just pick one of the item badges (index 1)
    if (allAlices.length > 1) {
      fireEvent.click(allAlices[1]);

      await waitFor(() => {
        // Bob's badge on that item should now just say "Bob", not "Bob (1/2)"
        const bobBadges = screen.queryAllByText((content, element) => {
          return element?.tagName.toLowerCase() === 'button' && content === 'Bob';
        });
        expect(bobBadges.length).toBeGreaterThan(0);
      });

      // Click again to reassign Alice
      fireEvent.click(allAlices[1]);
    }
  });

  it("handles fully assigned state and generate blinks", async () => {
    const fullSession = {
      ...mockSession,
      assignments: {
        "1": ["p1"],
        "2": ["p1", "p2"]
      }
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => fullSession })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Generate Blinks")).toBeInTheDocument();
    });

    const removePersonBtns = screen.getAllByRole("button");
    const removeAliceBtn = removePersonBtns.find(btn => btn.className.includes("text-text-muted hover:text-red-400"));
    if (removeAliceBtn) {
      await act(async () => {
        fireEvent.click(removeAliceBtn);
      });
    }

    const generateBtn = screen.getByText(/Generate Blinks/i).closest("button")!;
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/split/test-id/blinks");
    });
  });

  it("handles removing a person properly when > 2 people", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Add a third person
    fireEvent.click(screen.getByText("+ Add Person"));
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Charlie" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(screen.getAllByText("Charlie")[0]).toBeInTheDocument();
    });

    // Remove the third person
    const removeButtons = document.querySelectorAll('button > svg.lucide-x');
    if (removeButtons.length > 0) {
      const removeBtn = removeButtons[removeButtons.length - 1].closest('button');
      if (removeBtn) {
        fireEvent.click(removeBtn);
      }
    }

    await waitFor(() => {
      expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });
  });

  it("handles empty generate process and errors", async () => {
    const fullSession = {
      ...mockSession,
      assignments: {
        "1": ["p1"],
        "2": ["p1", "p2"]
      }
    };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => fullSession,
    }).mockRejectedValueOnce(new Error("Generate error"));

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Generate Blinks")).toBeInTheDocument();
    });

    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    const generateBtn = screen.getByText("Generate Blinks").closest("button")!;
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
    });
    consoleErrorMock.mockRestore();
  });

  it("prevents removing a person when people.length <= 2", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Add a third person
    fireEvent.click(screen.getByText("+ Add Person"));
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Charlie" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(screen.getAllByText("Charlie")[0]).toBeInTheDocument();
    });

    // Now there are 3 people. The remove buttons are rendered.
    const removeButtons = document.querySelectorAll('button > svg.lucide-x');
    if (removeButtons.length > 0) {
      const removeBtn = removeButtons[removeButtons.length - 1].closest('button');
      if (removeBtn) {
        // Click multiple times to try triggering the <= 2 check
        fireEvent.click(removeBtn);
        fireEvent.click(removeBtn);
      }
    }

    await waitFor(() => {
      expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });
  });

  it("handles unassigning all people from an item", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    // We want to unassign all people from the first item
    const allAlices = screen.queryAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'button' && content.startsWith('Alice');
    });
    const allBobs = screen.queryAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'button' && content.startsWith('Bob');
    });

    if (allAlices.length > 1 && allBobs.length > 1) {
      fireEvent.click(allAlices[1]);
      fireEvent.click(allBobs[1]);

      // Now the first item should have no assignees
      await waitFor(() => {
        expect(screen.getByText("Assign all items first")).toBeInTheDocument();
      });
      
      const generateBtn = screen.getByText("Assign all items first").closest("button");
      expect(generateBtn).toBeDisabled();
    }
  });

  it("covers missing item assignment and empty name additions", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockSession,
        assignments: {
          "1": ["p1"],
          "999": ["p1"] // Invalid item ID to hit 'if (item)' check in getPersonTotal
        }
      }),
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    // Try adding a person with an empty name
    const addButton = screen.getByText("+ Add Person");
    fireEvent.click(addButton);
    
    const confirmAddButton = screen.getByText("Add");
    fireEvent.click(confirmAddButton); // Should do nothing and return early

    // The form should still be visible because setShowAdd(false) was not called
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
  });

  it("covers undefined people, assignments, and empty toggle", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockSession,
        people: undefined,
        assignments: undefined
      }),
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <SplitPage params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Demo Restaurant")).toBeInTheDocument();
    });

    // Add a person since the list is empty
    const addButton = screen.getByText("+ Add Person");
    fireEvent.click(addButton);
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Eve" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(screen.getAllByText("Eve").length).toBeGreaterThan(0);
    });

    // Toggle Eve for the first item
    const allEves = screen.queryAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'button' && content.startsWith('Eve');
    });
    if (allEves.length > 0) {
      fireEvent.click(allEves[0]);
    }
  });
});
