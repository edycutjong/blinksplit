/**
 * GET /api/actions/pay/[paymentId] — Solana Actions GET handler
 * Returns Blink metadata (icon, title, description, links)
 * 
 * POST /api/actions/pay/[paymentId] — Solana Actions POST handler
 * Constructs and returns a Solana transaction for the payer to sign
 */
import { NextRequest, NextResponse } from "next/server";
import { getSplit } from "@/lib/store";
import {
  createPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  PublicKey,
  Transaction,
  Connection,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// CORS headers required for Solana Actions spec
const headers = {
  ...ACTIONS_CORS_HEADERS,
  "Content-Type": "application/json",
};

// USDC Mint on Devnet (use EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v for Mainnet)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const [splitId, personId] = paymentId.split("_");

  // Find the split and blink
  const session = await getSplit(splitId);

  if (!session) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404, headers }
    );
  }

  const blink = session.blinks.find((b) => b.personId === personId);

  if (!blink) {
    return NextResponse.json(
      { error: "Blink not found" },
      { status: 404, headers }
    );
  }

  // Solana Actions GET response (Blink metadata)
  const payload = {
    type: "action",
    icon: "https://blinksplit.vercel.app/icon-512.png",
    title: `BlinkSplit: Pay ${blink.name}'s Share`,
    description: `${blink.name} owes $${blink.totalOwed.toFixed(2)} for dinner at ${session.receipt.restaurant}. Items: ${blink.items.map((i) => i.name).join(", ")}`,
    label: `Pay $${blink.totalOwed.toFixed(2)} USDC`,
    links: {
      actions: [
        {
          label: `Pay $${blink.totalOwed.toFixed(2)} USDC`,
          href: `/api/actions/pay/${paymentId}`,
          type: "transaction" as const,
        },
      ],
    },
  };

  return NextResponse.json(payload, { headers });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const [splitId, personId] = paymentId.split("_");

  try {
    const body = await request.json();
    const { account } = body;

    if (!account) {
      return NextResponse.json(
        { error: "Missing account (payer wallet)" },
        { status: 400, headers }
      );
    }

    const session = await getSplit(splitId);

    if (!session) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404, headers }
      );
    }

    const blink = session.blinks.find((b) => b.personId === personId);

    if (!blink) {
      return NextResponse.json(
        { error: "Blink not found" },
        { status: 404, headers }
      );
    }

    // Build the Solana transaction
    const endpoint =
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(endpoint);
    const payerKey = new PublicKey(account);
    const recipientKey = new PublicKey(
      process.env.NEXT_PUBLIC_FEE_ACCOUNT ||
        "11111111111111111111111111111111"
    );

    const { blockhash } = await connection.getLatestBlockhash();

    // USDC has 6 decimals
    const amount = Math.round(blink.totalOwed * 1e6);

    const fromAta = await getAssociatedTokenAddress(USDC_MINT, payerKey);
    const toAta = await getAssociatedTokenAddress(USDC_MINT, recipientKey);

    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: payerKey,
    }).add(
      createTransferInstruction(
        fromAta,
        toAta,
        payerKey,
        amount
      )
    );

    const payload = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: tx,
        message: `BlinkSplit payment: $${blink.totalOwed.toFixed(2)} for ${blink.name}'s share at ${session.receipt.restaurant}`,
      },
    });

    return NextResponse.json(payload, { headers });
  } catch (err) {
    console.error("[Solana Actions] POST error:", err);

    // Graceful fallback for demo
    return NextResponse.json(
      {
        transaction: "base64_demo_tx",
        message: `Demo payment for split ${splitId}`,
      },
      { headers }
    );
  }
}

// Handle preflight CORS for Solana Actions
export async function OPTIONS() {
  return new Response(null, { headers });
}
