import { NextRequest, NextResponse } from "next/server";
import { adminFirestore, adminAuth } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const body = await req.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        let count = 0;

        // Chunk processing for Firestore batch limits (max 500, we use 450)
        const CHUNK_SIZE = 450;
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const batch = adminFirestore.batch();

            for (const item of chunk) {
                // Generate stable hash (anti-duplication)
                const hashStr = `${item.date}-${item.description}-${item.amount}`;
                const originalId = crypto.createHash('sha256').update(hashStr).digest('hex');

                const docRef = adminFirestore.collection(`users/${uid}/operations`).doc(originalId);

                batch.set(docRef, {
                    date: item.date,
                    description: item.description,
                    amount: item.amount,
                    category: item.category,
                    imported: true,
                    originalId
                }, { merge: true });

                count++;
            }

            await batch.commit();
        }

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error("Import Confirm API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
