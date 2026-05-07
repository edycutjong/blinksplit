/**
 * POST /api/splits — Create a new split session
 * GET /api/splits — List all split sessions (history)
 */
import { NextRequest, NextResponse } from "next/server";
import { createSplit, getAllSplits, getDemoReceipt } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const receipt = body.receipt || getDemoReceipt();
    const session = await createSplit(receipt);

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[API] Create split error:", err);
    return NextResponse.json(
      { error: "Failed to create split" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const history = await getAllSplits();
  return NextResponse.json({ splits: history, total: history.length });
}
