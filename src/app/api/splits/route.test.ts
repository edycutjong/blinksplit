import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { createSplit, getAllSplits, getDemoReceipt } from "@/lib/store";

vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: vi.fn((data, options) => ({
        status: options?.status || 200,
        json: async () => data,
      })),
    },
  };
});

vi.mock("@/lib/store", () => ({
  createSplit: vi.fn(),
  getAllSplits: vi.fn(),
  getDemoReceipt: vi.fn(),
}));

describe("splits API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body?: any) => {
    return {
      json: async () => body,
    } as any;
  };

  describe("POST", () => {
    it("creates a split with provided receipt", async () => {
      const mockSession = { id: "test-id" };
      const mockReceipt = { restaurant: "Provided" };
      vi.mocked(createSplit).mockResolvedValue(mockSession as any);

      const req = createMockRequest({ receipt: mockReceipt });
      const res = await POST(req);
      const data = await res.json();

      expect(createSplit).toHaveBeenCalledWith(mockReceipt);
      expect(res.status).toBe(201);
      expect(data).toEqual(mockSession);
    });

    it("creates a split with demo receipt if none provided", async () => {
      const mockSession = { id: "test-id" };
      const mockDemoReceipt = { restaurant: "Demo" };
      vi.mocked(getDemoReceipt).mockReturnValue(mockDemoReceipt as any);
      vi.mocked(createSplit).mockResolvedValue(mockSession as any);

      const req = createMockRequest({});
      const res = await POST(req);
      const data = await res.json();

      expect(getDemoReceipt).toHaveBeenCalled();
      expect(createSplit).toHaveBeenCalledWith(mockDemoReceipt);
      expect(res.status).toBe(201);
      expect(data).toEqual(mockSession);
    });

    it("returns 500 if store throws error", async () => {
      vi.mocked(createSplit).mockRejectedValue(new Error("DB error"));

      const req = createMockRequest({});
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to create split");
    });
  });

  describe("GET", () => {
    it("returns all splits", async () => {
      const mockHistory = [{ id: "1" }, { id: "2" }];
      vi.mocked(getAllSplits).mockResolvedValue(mockHistory as any);

      const res = await GET();
      const data = await res.json();

      expect(getAllSplits).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(data).toEqual({ splits: mockHistory, total: 2 });
    });
  });
});
