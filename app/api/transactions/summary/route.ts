import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service role on server. Fallback to anon key (useful to detect RLS issues).
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bank = searchParams.get("bank"); // CA | SG | null

  // 1) Quick debug: do we see ANY rows at all?
  // Using head:true gives exact count without returning all rows.
  let countQuery = supabase
    .from("transactions")
    .select("id", { count: "exact", head: true });

  if (bank) countQuery = countQuery.eq("bank", bank);

  const { count, error: countError } = await countQuery;

  if (countError) {
    return NextResponse.json(
      {
        error: "Supabase count error",
        details: countError,
        bank,
      },
      { status: 500 }
    );
  }

  // If count is 0, return extra hints (common: RLS or wrong project/env).
  if (!count || count === 0) {
    // Try fetching a tiny sample (may still be blocked by RLS).
    let sampleQuery = supabase
      .from("transactions")
      .select("id, bank, amount, date, label")
      .order("created_at", { ascending: false })
      .limit(3);

    if (bank) sampleQuery = sampleQuery.eq("bank", bank);

    const { data: sample, error: sampleError } = await sampleQuery;

    return NextResponse.json({
      bank,
      expenses: 0,
      income: 0,
      balance: 0,
      count: 0,
      debug: {
        supabaseUrlHost: (() => {
          try {
            return new URL(String(SUPABASE_URL)).host;
          } catch {
            return "invalid-url";
          }
        })(),
        usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        sample,
        sampleError,
        hint:
          "If count is 0 but you already imported rows, it's almost always: (1) you are connected to a different Supabase project/env, or (2) you are using ANON key and RLS blocks reads. In dev, restart `npm run dev` after editing .env.local.",
      },
    });
  }

  // 2) Compute sums. For now, we fetch amounts (OK for a few thousand rows).
  let query = supabase.from("transactions").select("amount");
  if (bank) query = query.eq("bank", bank);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Supabase select error", details: error, bank },
      { status: 500 }
    );
  }

  const expenses = (data ?? [])
    .filter((t) => typeof t.amount === "number" && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const income = (data ?? [])
    .filter((t) => typeof t.amount === "number" && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const balance = income - expenses;

  return NextResponse.json({
    bank,
    expenses,
    income,
    balance,
    count,
  });
}