/**
 * POST /api/parse-receipt
 * Accepts a receipt image (base64 or file upload) and returns structured data.
 */
import { NextRequest, NextResponse } from "next/server";
import { parseReceipt } from "@/lib/receipt-parser";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let imageBase64: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.image; // base64 string

      if (!imageBase64) {
        return NextResponse.json(
          { error: "Missing 'image' field (base64 encoded)" },
          { status: 400 }
        );
      }

      // Strip data URL prefix if present
      if (imageBase64.startsWith("data:")) {
        imageBase64 = imageBase64.split(",")[1];
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("receipt") as File;

      if (!file) {
        return NextResponse.json(
          { error: "Missing 'receipt' file in form data" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
    } else {
      // No image — return demo data
      imageBase64 = "";
    }

    const result = await parseReceipt(imageBase64);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API] Parse receipt error:", err);
    return NextResponse.json(
      { error: "Failed to parse receipt" },
      { status: 500 }
    );
  }
}
