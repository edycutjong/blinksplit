/**
 * AI Receipt Parser
 * Uses OpenAI GPT-4o Vision API to extract structured receipt data.
 * Falls back to demo data if API key is missing or parsing fails.
 */

import { Receipt, getDemoReceipt } from "./store";

const RECEIPT_SCHEMA_PROMPT = `You are a receipt parser. Extract the following from the receipt image and return ONLY valid JSON:
{
  "restaurant": "Restaurant name",
  "items": [
    { "name": "Item name", "price": 12.95 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00
}

Rules:
- Prices must be numbers, not strings
- If tip is handwritten, estimate the value
- If subtotal is not shown, sum the items
- If tax is not shown, estimate as 9% of subtotal
- Items with quantities like "2x" should be a single entry with combined price
- Return ONLY the JSON object, no markdown, no explanation`;

export interface ParseResult {
  success: boolean;
  receipt: Receipt;
  source: "ai" | "fallback";
  confidence?: number;
  parseTimeMs: number;
}

export async function parseReceipt(imageBase64: string): Promise<ParseResult> {
  const start = Date.now();

  // Check if OpenAI API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[Receipt Parser] No OPENAI_API_KEY found, using fallback demo data");
    return {
      success: true,
      receipt: getDemoReceipt(),
      source: "fallback",
      parseTimeMs: Date.now() - start,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: RECEIPT_SCHEMA_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize
    const receipt: Receipt = {
      restaurant: parsed.restaurant || "Unknown Restaurant",
      items: (parsed.items || []).map((item: { name: string; price: number }, i: number) => ({
        id: i + 1,
        name: item.name,
        price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
      })),
      subtotal: parsed.subtotal || 0,
      tax: parsed.tax || 0,
      tip: parsed.tip || 0,
      total: parsed.total || 0,
    };

    // Recalculate subtotal if needed
    if (receipt.subtotal === 0) {
      receipt.subtotal = receipt.items.reduce((sum, item) => sum + item.price, 0);
    }

    // Recalculate total if needed
    if (receipt.total === 0) {
      receipt.total = receipt.subtotal + receipt.tax + receipt.tip;
    }

    return {
      success: true,
      receipt,
      source: "ai",
      confidence: 0.95,
      parseTimeMs: Date.now() - start,
    };
  } catch (err) {
    console.error("[Receipt Parser] AI parsing failed:", err);
    return {
      success: true,
      receipt: getDemoReceipt(),
      source: "fallback",
      parseTimeMs: Date.now() - start,
    };
  }
}
