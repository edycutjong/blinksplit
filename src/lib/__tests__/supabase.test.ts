import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("supabase client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("initializes with environment variables", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://custom.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "custom-anon-key";

    const { supabase } = await import("../supabase");
    
    // We can't easily inspect the internal URL/key of the client, but we can verify it exports an object
    expect(supabase).toBeDefined();
    // Assuming createClient returns an object with certain methods like `from`
    expect(typeof supabase.from).toBe("function");
  });

  it("initializes with fallback values when environment variables are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { supabase } = await import("../supabase");

    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });
});
