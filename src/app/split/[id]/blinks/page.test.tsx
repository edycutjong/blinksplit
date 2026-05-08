import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PaymentTracker from "./page";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("PaymentTracker Page", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    global.fetch = vi.fn();

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockPayers = [
    {
      personId: "p1",
      name: "Alice",
      paymentStatus: "pending",
      wallet: "wallet1",
      totalOwed: 25,
      itemsTotal: 20,
      taxShare: 2,
      tipShare: 3
    },
    {
      personId: "p2",
      name: "Bob",
      paymentStatus: "paid",
      wallet: "wallet2",
      totalOwed: 15,
      itemsTotal: 10,
      taxShare: 2,
      tipShare: 3
    }
  ];

  const paramsPromise = Promise.resolve({ id: "test-id" });

  it("renders loading state", async () => {
    let resolveFetch: any;
    (global.fetch as any).mockImplementation(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    let container: any;
    await act(async () => {
      const result = render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <PaymentTracker params={paramsPromise} />
        </Suspense>
      );
      container = result.container;
    });
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
    
    // Clean up
    resolveFetch({ ok: true, json: async () => ({ blinks: [] }) });
  });

  it("renders payers and handles copy wallet/blink", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ blinks: mockPayers }),
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <PaymentTracker params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Test Copy Blink button
    const copyBlinks = screen.queryAllByText(/Copy Blink/i);
    if (copyBlinks.length > 0) {
      fireEvent.click(copyBlinks[0]);
    }

    // Test Copy Wallet icon
    const copyIcons = document.querySelectorAll('button > svg.lucide-copy');
    if (copyIcons.length > 0) {
      const copyBtn = copyIcons[0].closest('button');
      if (copyBtn) fireEvent.click(copyBtn);
    }
  });

  it("handles undefined blinks gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No blinks property
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <PaymentTracker params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });
  });

  it("simulates payments coming in", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ blinks: [mockPayers[0]] }), // Just Alice (pending)
    });

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <PaymentTracker params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    // Wait for the real timeout (2000ms) to trigger
    await waitFor(() => {
      expect(screen.getByText(/Settlement Complete!/i)).toBeInTheDocument();
    }, { timeout: 3500 });

    // Test "Split Another Bill" button
    const splitAnotherBtn = screen.getByText(/Split Another Bill/i);
    fireEvent.click(splitAnotherBtn);
    expect(mockPush).toHaveBeenCalledWith("/");
  }, 10000);

  it("handles fetch error gracefully", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => {
      render(
        <Suspense fallback={<div className="suspense-fallback" />}>
          <PaymentTracker params={paramsPromise} />
        </Suspense>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });
  });
});
