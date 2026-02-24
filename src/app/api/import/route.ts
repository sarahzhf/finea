import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import * as xlsx from "xlsx";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const EXPENSE_CATEGORIES = ["Alimentation", "Logement", "Transports", "Loisirs", "Santé", "Abonnements", "Autre"] as const;
const INCOME_CATEGORIES = ["Salaire", "Aides", "Remboursement", "Autre"] as const;
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        await adminAuth.verifyIdToken(token);

        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileName = file.name?.toLowerCase() || "";
        const isCSV = fileName.endsWith(".csv");
        const isXLSX = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

        if (!isCSV && !isXLSX) {
            return NextResponse.json({ error: "Format non supporté. Utilisez .xlsx, .xls ou .csv" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = xlsx.utils.sheet_to_json<any>(sheet);
        const parsedItems: any[] = [];
        const missingCategoriesSet = new Set<string>();

        // Phase 1: Parsing and normalization
        for (const row of rows) {
            const dateRaw = row["Date"] || row["date"] || row["Date opération"] || new Date().toISOString();
            const desc = row["Description"] || row["description"] || row["Libellé"] || "Import Excel";
            const montantRaw = row["Montant"] || row["montant"] || row["Amount"];

            if (montantRaw === undefined || montantRaw === null) continue;

            const amountStr = String(montantRaw).replace(',', '.');
            const amount = parseFloat(amountStr);
            if (isNaN(amount)) continue;

            let cat = row["Catégorie"] || row["categorie"] || row["category"];

            // Normalize dates to ISO string
            let dateIso = new Date().toISOString();
            try {
                const parsedDate = new Date(dateRaw);
                if (!isNaN(parsedDate.getTime())) {
                    dateIso = parsedDate.toISOString();
                }
            } catch (e) {
                // Keep default if parsing fails
            }

            const isStandardCategory = ALL_CATEGORIES.includes(cat);
            if (!isStandardCategory) {
                missingCategoriesSet.add(desc);
                cat = null; // Mark for LLM resolution
            }

            parsedItems.push({
                date: dateIso,
                description: desc,
                amount: amount,
                category: cat
            });
        }

        // Phase 2: LLM Fallback for missing categories
        const missingDescriptions = Array.from(missingCategoriesSet);
        if (missingDescriptions.length > 0) {
            try {
                const { object } = await generateObject({
                    model: openai("gpt-4o-mini"),
                    schema: z.object({
                        mappings: z.record(
                            z.string(),
                            z.enum(["Alimentation", "Logement", "Transports", "Loisirs", "Santé", "Abonnements", "Salaire", "Aides", "Remboursement", "Autre"])
                        )
                    }),
                    prompt: `Tu dois catégoriser ces libellés d'opérations bancaires dans les catégories suivantes : ${ALL_CATEGORIES.join(", ")}.
Voici les libellés à catégoriser :
${missingDescriptions.map(d => `- "${d}"`).join("\n")}
                
Essaie d'être le plus pertinent possible. Si aucune catégorie ne correspond, choisis "Autre".`,
                });

                // Apply mappings
                for (const item of parsedItems) {
                    if (!item.category) {
                        item.category = object.mappings[item.description] || "Autre";
                    }
                }
            } catch (llmError) {
                console.error("LLM categorization failed, using fallback:", llmError);
                for (const item of parsedItems) {
                    if (!item.category) item.category = "Autre";
                }
            }
        }

        return NextResponse.json({
            success: true,
            count: parsedItems.length,
            items: parsedItems
        });
    } catch (error: any) {
        console.error("Import Parse API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
