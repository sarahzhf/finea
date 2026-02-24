import * as admin from "firebase-admin";
import * as xlsx from "xlsx";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credential = serviceAccountPath
    ? admin.credential.cert(require(path.resolve(process.cwd(), serviceAccountPath)))
    : admin.credential.applicationDefault();

if (!admin.apps.length) {
    admin.initializeApp({ credential });
}

const db = admin.firestore();

async function seed() {
    console.log("Reading Quizz.xlsx...");
    const wb = xlsx.readFile(path.join(process.cwd(), "Quizz.xlsx"));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} questions. Seeding to Firestore...`);
    const colRef = db.collection("quiz_questions");

    const chunkSize = 400;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const batch = db.batch();
        for (const row of chunk as any[]) {
            if (!row.id) continue;
            const docId = `q_${String(row.id).padStart(3, '0')}`;
            const docRef = colRef.doc(docId);
            batch.set(docRef, {
                ...row,
                id: docId
            }, { merge: true });
        }
        await batch.commit();
        console.log(`Committed chunk ${i / chunkSize + 1} (${chunk.length} questions)`);
    }

    console.log("Seeding complete!");
}

seed().catch(console.error);
