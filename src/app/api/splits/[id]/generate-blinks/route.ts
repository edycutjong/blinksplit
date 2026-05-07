/**
 * POST /api/splits/[id]/generate-blinks — Generate Blink payment URLs for each person
 */
import { NextRequest, NextResponse } from "next/server";
import { generateBlinks } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Build base URL from request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const session = await generateBlinks(id, baseUrl);

  if (!session) {
    return NextResponse.json({ error: "Split not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
