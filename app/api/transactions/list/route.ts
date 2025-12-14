import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseserver";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bank = searchParams.get("bank");
  const month = searchParams.get("month"); // format YYYY-MM

  if (!bank) {
    return NextResponse.json({ transactions: [] });
  }

  let query = supabase
    .from("transactions")
    .select("date,label,amount,bank")
    .eq("bank", bank)
    .order("date", { ascending: false });

  if (month && month !== "all") {
    const [year, m] = month.split("-");
    const start = `${year}-${m}-01`;
    const end = `${year}-${m}-31`;
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("LIST ERROR:", error);
    return NextResponse.json({ transactions: [] }, { status: 500 });
  }

  return NextResponse.json({
    transactions: data ?? []
  });
}