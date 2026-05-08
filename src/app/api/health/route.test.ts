import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

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

describe("Health API", () => {
  it("returns health status", async () => {
    const response = await GET() as any;
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeDefined();
  });
});
