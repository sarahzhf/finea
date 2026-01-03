import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const bank = searchParams.get("bank");
    const month = searchParams.get("month"); // YYYY-MM | all

    if (!bank) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
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
      console.error("TRANSACTIONS LIST ERROR", error);
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    return NextResponse.json({
      transactions: data ?? [],
    });
  } catch (e) {
    console.error("TRANSACTIONS LIST UNCAUGHT", e);
    return NextResponse.json({ transactions: [] }, { status: 200 });
  }
}