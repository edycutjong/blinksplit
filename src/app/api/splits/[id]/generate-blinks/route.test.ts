import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { generateBlinks } from "@/lib/store";

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
  generateBlinks: vi.fn(),
}));

describe("generate-blinks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url: string = "http://localhost:3000/api") => {
    return {
      url,
      json: async () => ({}),
    } as any;
  };

  it("returns 404 if split not found", async () => {
    vi.mocked(generateBlinks).mockResolvedValue(null as any);

    const req = createMockRequest();
    const res = await POST(req, { params: Promise.resolve({ id: "missing" }) });
    const data = await res.json();

    expect(generateBlinks).toHaveBeenCalledWith("missing", "http://localhost:3000");
    expect(res.status).toBe(404);
    expect(data.error).toBe("Split not found");
  });

  it("generates blinks and returns session", async () => {
    const mockSession = { id: "test-id" };
    vi.mocked(generateBlinks).mockResolvedValue(mockSession as any);

    const req = createMockRequest("https://my-domain.com/api/test");
    const res = await POST(req, { params: Promise.resolve({ id: "test-id" }) });
    const data = await res.json();

    expect(generateBlinks).toHaveBeenCalledWith("test-id", "https://my-domain.com");
    expect(res.status).toBe(200);
    expect(data).toEqual(mockSession);
  });
});
