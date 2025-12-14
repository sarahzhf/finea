import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // important côté serveur
);

export async function POST(req: Request) {
  try {
    const { filePath, bank } = await req.json();
    // ex: filePath = "CA20251213_174509.xlsx"
    // bank = "CA"

    /* 1️⃣ Télécharger le fichier depuis Supabase Storage */
    const { data, error } = await supabase.storage
      .from("finea")
      .download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    /* 2️⃣ Lire le fichier Excel */
    const buffer = Buffer.from(await data.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
    });

    /* 3️⃣ Trouver le solde */
    let balance: number | null = null;
    for (const row of rows) {
      if (row[0]?.toString().includes("Solde")) {
        balance = parseFloat(
          row.find((c: any) => typeof c === "string" && c.includes("€"))
            ?.replace("€", "")
            .replace(",", ".")
        );
        break;
      }
    }

    /* 4️⃣ Trouver l’index du tableau des transactions */
    const headerIndex = rows.findIndex(
      (r) =>
        String(r[0]).toLowerCase().includes("date") &&
        String(r[1]).toLowerCase().includes("libell")
    );

    /* 5️⃣ Parser toutes les transactions (CB, prélèvements, virements, crédits) */
    const transactions = rows
      .slice(headerIndex + 1)
      .filter((r) => r[0] && r[1])
      .map((r) => {
        const date = String(r[0]).trim();
        const label = String(r[1]).replace(/\s+/g, " ").trim();

        const parseEuro = (v: any): number | null => {
          if (!v) return null;
          if (typeof v === "number") return v;
          return parseFloat(
            String(v)
              .replace("€", "")
              .replace(/\s/g, "")
              .replace(",", ".")
          );
        };

        const debit = parseEuro(r[2]);
        const credit = parseEuro(r[3]);

        if (!debit && !credit) return null;

        let amount = 0;
        let type: "debit" | "credit";

        if (debit && debit > 0) {
          amount = -debit;
          type = "debit";
        } else {
          amount = credit!;
          type = "credit";
        }

        return {
          date,
          label,
          amount,
          type,
          bank,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      bank,
      balance,
      transactions,
      count: transactions.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erreur parsing Excel" },
      { status: 500 }
    );
  }
}