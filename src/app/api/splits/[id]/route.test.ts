import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { getSplit, updateAssignments } from "@/lib/store";

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
  getSplit: vi.fn(),
  updateAssignments: vi.fn(),
}));

describe("splits/[id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body?: any) => {
    return {
      json: async () => body,
    } as any;
  };

  describe("GET", () => {
    it("returns 404 if split not found", async () => {
      vi.mocked(getSplit).mockResolvedValue(undefined as any);

      const res = await GET(createMockRequest(), { params: Promise.resolve({ id: "missing" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Split not found");
    });

    it("returns session if split found", async () => {
      const mockSession = { id: "found" };
      vi.mocked(getSplit).mockResolvedValue(mockSession as any);

      const res = await GET(createMockRequest(), { params: Promise.resolve({ id: "found" }) });
      const data = await res.json();

      expect(getSplit).toHaveBeenCalledWith("found");
      expect(res.status).toBe(200);
      expect(data).toEqual(mockSession);
    });
  });

  describe("PUT", () => {
    it("updates assignments and returns session", async () => {
      const mockSession = { id: "test-id" };
      const body = { assignments: { "1": ["p1"] }, people: [{ id: "p1" }] };
      vi.mocked(updateAssignments).mockResolvedValue(mockSession as any);

      const req = createMockRequest(body);
      const res = await PUT(req, { params: Promise.resolve({ id: "test-id" }) });
      const data = await res.json();

      expect(updateAssignments).toHaveBeenCalledWith("test-id", body.assignments, body.people);
      expect(res.status).toBe(200);
      expect(data).toEqual(mockSession);
    });

    it("returns 404 if update returns null", async () => {
      vi.mocked(updateAssignments).mockResolvedValue(null as any);
      
      const req = createMockRequest({});
      const res = await PUT(req, { params: Promise.resolve({ id: "test-id" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Split not found");
    });

    it("returns 500 on store error", async () => {
      vi.mocked(updateAssignments).mockRejectedValue(new Error("fail"));
      
      const req = createMockRequest({});
      const res = await PUT(req, { params: Promise.resolve({ id: "test-id" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update split");
    });
  });
});
