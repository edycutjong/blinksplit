import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HistoryPage from "./page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("HistoryPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    global.fetch = vi.fn();
  });

  it("renders loading state initially", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    const { container } = render(<HistoryPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it("renders empty state when no splits", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ splits: [] }),
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/No active splits/i)).toBeInTheDocument();
    });

    // Test back button
    const backButton = document.querySelector('button');
    if (backButton) fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith("/");

    // Test Scan Receipt button
    const scanReceiptButton = screen.getByText(/Scan Receipt/i);
    fireEvent.click(scanReceiptButton);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("renders list of splits when data is available", async () => {
    const mockSplits = [
      {
        id: "split-1",
        createdAt: "2024-01-01T12:00:00Z",
        status: "complete",
        receipt: { restaurant: "Demo Cafe", total: 100 },
        blinks: [
          { name: "Alice", paymentStatus: "paid" },
          { name: "Bob", paymentStatus: "paid" },
        ],
        people: [{ id: "1" }, { id: "2" }]
      },
      {
        id: "split-2",
        createdAt: "2024-01-02T12:00:00Z",
        status: "pending",
        receipt: { restaurant: "Pizza Place", total: 50 },
        blinks: [
          { name: "Alice", paymentStatus: "paid" },
          { name: "Charlie", paymentStatus: "pending" },
        ],
        people: [{ id: "1" }, { id: "3" }]
      },
      {
        id: "split-3",
        createdAt: "2024-01-03T12:00:00Z",
        status: "pending",
        receipt: { restaurant: "Burger Joint", total: 20 },
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ splits: mockSplits }),
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("Demo Cafe")).toBeInTheDocument();
      expect(screen.getByText("Pizza Place")).toBeInTheDocument();
    });

    // Test click on a split
    const splitCard = screen.getByText("Demo Cafe").closest('button');
    if (splitCard) fireEvent.click(splitCard);
    expect(mockPush).toHaveBeenCalledWith("/split/split-1/blinks");

    // Test click on a split without blinks
    const splitCardNoBlinks = screen.getByText("Burger Joint").closest('button');
    if (splitCardNoBlinks) fireEvent.click(splitCardNoBlinks);
    expect(mockPush).toHaveBeenCalledWith("/split/split-3");
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("No active splits")).toBeInTheDocument();
    });
  });

  it("handles undefined splits gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}) // No splits property
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("No active splits")).toBeInTheDocument();
    });
  });
});
