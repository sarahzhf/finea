import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import path from "path";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("ENV CHECK (seed)", {
  SUPABASE_URL,
  HAS_SERVICE_ROLE: !!SUPABASE_SERVICE_ROLE_KEY,
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});


function normalizeTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return String(raw)
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}


async function main() {
  const xlsxPath = path.join(process.cwd(), "public", "data", "Quizz.xlsx");
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  console.log(`📄 Excel rows read: ${rows.length}`);

  const payload = rows.map((r) => ({
    source_id: String(r.id),
    theme: String(r.theme),
    difficulty_level: (() => {
      const n = Number(r.difficulte_niveau);
      if (!Number.isFinite(n)) return 1;
      return Math.min(5, Math.max(1, n));
    })(),
    question_text: String(r.question),
    explanation: r.explication ? String(r.explication) : null,
    tags: normalizeTags(r.tags),
    // Force active by default (Excel may have empty/0 values)
    active: r.actif === "" ? true : Boolean(r.actif),

    answer_a: String(r.choix_a),
    answer_b: String(r.choix_b),
    answer_c: String(r.choix_c),
    answer_d: String(r.choix_d),
    correct_answer: String(r.bonne_reponse).trim().toUpperCase(),
  }));

  const { error } = await supabase
    .from("quiz_questions")
    .upsert(payload, { onConflict: "source_id" });

  if (error) throw error;

  console.log(`✅ Seeded/updated ${payload.length} questions`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});