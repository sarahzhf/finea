import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const { filePath, bank } = await req.json();

    if (!filePath || !bank) {
      return NextResponse.json(
        { error: "filePath et bank requis" },
        { status: 400 }
      );
    }

    /* 1️⃣ Télécharger le fichier */
    const { data, error } = await supabase.storage
      .from("finea")
      .download(filePath);

    if (error || !data) {
      console.error("DOWNLOAD ERROR:", error);
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    /* 2️⃣ Lire l’Excel */
    const buffer = Buffer.from(await data.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    /* 3️⃣ Trouver le header */
    const headerIndex = rows.findIndex((r) =>
      r?.some((c) => String(c).toLowerCase().includes("date")) &&
      r?.some((c) => String(c).toLowerCase().includes("libell"))
    );

    if (headerIndex === -1) {
      return NextResponse.json(
        { error: "Tableau transactions introuvable" },
        { status: 400 }
      );
    }

    const headerRow = rows[headerIndex].map((c) =>
      String(c ?? "").toLowerCase()
    );

    const dateCol = headerRow.findIndex((c) => c.includes("date"));
    const labelCol = headerRow.findIndex((c) => c.includes("libell"));
    const debitCol = headerRow.findIndex((c) => c.includes("débit") || c.includes("debit"));
    const creditCol = headerRow.findIndex((c) => c.includes("crédit") || c.includes("credit"));

    if ([dateCol, labelCol, debitCol, creditCol].some((i) => i === -1)) {
      return NextResponse.json(
        { error: "Colonnes Date / Libellé / Débit / Crédit introuvables" },
        { status: 400 }
      );
    }

    /* 4️⃣ Parser les transactions */
    console.log("🔍 HEADER COLS:", { dateCol, labelCol, debitCol, creditCol });
    console.log("🔍 HEADER ROW:", rows[headerIndex]);
    console.log("🔍 FIRST DATA ROW:", rows[headerIndex + 1]);
    console.log("🔍 SAMPLE CELLS:", {
      date: rows[headerIndex + 1]?.[dateCol],
      label: rows[headerIndex + 1]?.[labelCol],
      debit: rows[headerIndex + 1]?.[debitCol],
      credit: rows[headerIndex + 1]?.[creditCol],
    });

    const parseEuro = (v: any): number | null => {
      if (v === null || v === undefined || v === "") return null;

      // If it's already a number (Excel often stores as number)
      if (typeof v === "number" && !Number.isNaN(v)) return v;

      // French number formats: "1 568,74", "1 568,74", "2,00", possibly with €
      const s = String(v)
        .replace("€", "")
        .replace(/\u00A0/g, " ") // non‑breaking space
        .replace(/\s/g, "")
        .replace(",", ".")
        .trim();

      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const toIsoDate = (v: any): string | null => {
      if (v === null || v === undefined || v === "") return null;

      // Excel date stored as JS Date
      if (v instanceof Date && !Number.isNaN(v.getTime())) {
        const yyyy = v.getFullYear();
        const mm = String(v.getMonth() + 1).padStart(2, "0");
        const dd = String(v.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }

      const s = String(v).trim();

      // Already ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

      // dd/mm/yyyy (as in your file)
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        const dd = m[1];
        const mm = m[2];
        const yyyy = m[3];
        return `${yyyy}-${mm}-${dd}`;
      }

      // Excel sometimes gives dates as numbers (serial)
      if (typeof v === "number") {
        const d = XLSX.SSF.parse_date_code(v);
        if (d) {
          const yyyy = d.y;
          const mm = String(d.m).padStart(2, "0");
          const dd = String(d.d).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }
      }

      return null;
    };

    const normalizeLabel = (v: any): string => {
      return String(v ?? "")
        .replace(/\r/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const transactions = rows
      .slice(headerIndex + 1)
      .filter((r) => r && r[dateCol] && r[labelCol])
      .map((r) => {
        const dateIso = toIsoDate(r[dateCol]);
        const debit = parseEuro(r[debitCol]);
        const credit = parseEuro(r[creditCol]);

        // skip empty lines
        if (!dateIso) return null;
        if (
          (debit === null || debit === 0) &&
          (credit === null || credit === 0)
        ) {
          return null;
        }

        return {
          date: dateIso,
          label: normalizeLabel(r[labelCol]),
          amount: debit !== null ? -debit : (credit as number),
          bank: String(bank),
        };
      })
      .filter((x): x is { date: string; label: string; amount: number; bank: string } => Boolean(x));

    /* 5️⃣ Insert Supabase */
    console.log("🚨 TRANSACTIONS TO INSERT:", transactions.length);
    console.log("🚨 SAMPLE TRANSACTION:", transactions[0]);
    const { error: insertError } = await supabase
      .from("transactions")
      .insert(transactions);
    console.log("✅ INSERT DONE");

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      return NextResponse.json(
        {
          error: "Erreur insertion Supabase",
          details: insertError.message,
          hint: (insertError as any).hint ?? null,
          code: (insertError as any).code ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: transactions.length,
      bank,
      filePath,
    });
  } catch (err) {
    console.error("IMPORT CRASH:", err);
    return NextResponse.json(
      { error: "Erreur serveur import", details: (err as any)?.message ?? String(err) },
      { status: 500 }
    );
  }
}