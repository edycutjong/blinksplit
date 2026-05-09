import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "./page";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock getBoundingClientRect for framer-motion interactions
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

describe("Home Page", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders the landing page correctly", () => {
    render(<Home />);
    expect(screen.getByText(/Split bills\./i)).toBeInTheDocument();
  });

  it("handles file upload and error", async () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Parse error" }),
    });

    render(<Home />);
    
    // Find the file input (it's hidden, so we need to select it)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(["dummy content"], "receipt.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Failed to parse receipt. Please try again or use the demo flow if API keys are missing.");
    });
    
    alertMock.mockRestore();
  });

  it("handles successful file upload and redirection", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: { items: [] } }), // parseRes
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "test-id" }), // splitRes
      });

    render(<Home />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy content"], "receipt.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/split/test-id");
    });
  });

  it("handles demo receipt button click", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "demo-id" }),
    });

    render(<Home />);
    
    const demoButton = screen.getAllByText(/Try Demo Receipt/i)[0];
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/split/demo-id");
    });
  });

  it("handles interaction on FeatureCard and TiltCard (mouse move)", () => {
    render(<Home />);
    
    const scanCard = screen.getByText("AI Receipt Scanning").closest('.group');
    expect(scanCard).toBeTruthy();
    if (scanCard) {
      fireEvent.mouseMove(scanCard, { clientX: 10, clientY: 10 });
    }

    const tiltCards = document.querySelectorAll('[style*="transform-style: preserve-3d"]');
    expect(tiltCards.length).toBeGreaterThan(0);
    fireEvent.mouseMove(tiltCards[0], { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(tiltCards[0]);
  });

  it("triggers file input when clicking Launch App or Scan a Receipt Now", () => {
    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    const scanButton = screen.getByText("Scan a Receipt Now");
    fireEvent.click(scanButton);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const launchAppButtons = screen.getAllByText("Launch App");
    fireEvent.click(launchAppButtons[0]);
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
  it("handles FileReader error", async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Home />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy content"], "receipt.jpg", { type: "image/jpeg" });

    // Mock FileReader to throw an error or trigger onerror
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader) {
        // @ts-expect-error: ProgressEvent doesn't strictly match FileReader type in vitest mock
        if (this.onerror) this.onerror(new ProgressEvent("error"));
      }),
      result: "mock-result",
    };
    vi.stubGlobal('FileReader', vi.fn(() => mockFileReader));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it("handles demo receipt fetch error", async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));

    render(<Home />);
    
    const demoButton = screen.getAllByText(/Try Demo Receipt/i)[0];
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Failed to load demo receipt.");
    });

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});
