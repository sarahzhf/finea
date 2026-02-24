require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    let credential;
    if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath.replace('./', '')))) {
        credential = admin.credential.cert(require(path.resolve(serviceAccountPath.replace('./', ''))));
    } else {
        credential = admin.credential.applicationDefault();
    }
    admin.initializeApp({ credential });
}

const db = admin.firestore();

async function seed() {
    const filePath = path.join(__dirname, "..", "Quizz.xlsx");
    let questions = [];

    if (fs.existsSync(filePath)) {
        console.log("Reading Quizz.xlsx...");
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        questions = rows.map((row) => {
            // Create a stable hash ID if 'id' column is missing or empty
            const questionText = row["question"] || row["Question"] || "";
            const stableId = row["id"] ? String(row["id"]) : crypto.createHash("md5").update(questionText).digest("hex");

            return {
                id: stableId,
                question: questionText,
                choix_a: row["choix_a"] || row["A"] || "",
                choix_b: row["choix_b"] || row["B"] || "",
                choix_c: row["choix_c"] || row["C"] || "",
                choix_d: row["choix_d"] || row["D"] || "",
                bonne_reponse: String(row["bonne_reponse"] || row["Correct"] || "A").trim().toUpperCase(),
                explication: row["explication"] || row["Explication"] || "",
                difficulte_score: parseInt(row["difficulte_score"]) || 1,
                difficulte_niveau: row["difficulte_niveau"] || "Facile",
                tags: row["tags"] || "",
                version: row["version"] || 1,
                actif: true,
            };
        }).filter(q => q.question.length > 0);
    } else {
        console.log("Quizz.xlsx not found. Using 5 hardcoded fallback questions.");
        questions = [
            { id: "fallback_1", question: "Qu'est-ce qu'un budget ?", choix_a: "Un plan de dépenses", choix_b: "Une dette", choix_c: "Un revenu", choix_d: "Une banque", bonne_reponse: "A", explication: "Un budget aide à planifier ses dépenses par rapport à ses revenus.", difficulte_score: 1, actif: true },
            { id: "fallback_2", question: "Qu'est-ce qu'une épargne de précaution ?", choix_a: "Pour les vacances", choix_b: "Pour la retraite", choix_c: "Pour les imprévus", choix_d: "Pour investir", bonne_reponse: "C", explication: "L'épargne de précaution sert à faire face aux coups durs (panne, santé...).", difficulte_score: 1, actif: true },
            { id: "fallback_3", question: "Que signifie Taux d'Intérêt ?", choix_a: "Une taxe d'état", choix_b: "Le coût de l'argent emprunté", choix_c: "Une assurance", choix_d: "Le prix d'un bien", bonne_reponse: "B", explication: "Le taux d'intérêt est le pourcentage payé pour emprunter de l'argent ou gagné en en prêtant.", difficulte_score: 2, actif: true },
            { id: "fallback_4", question: "Qu'est-ce que l'inflation ?", choix_a: "La baisse des prix", choix_b: "La perte de valeur de la monnaie", choix_c: "Un impôt", choix_d: "Une prime", bonne_reponse: "B", explication: "L'inflation est la hausse générale des prix qui diminue le pouvoir d'achat.", difficulte_score: 2, actif: true },
            { id: "fallback_5", question: "Qu'est-ce qu'un actif ?", choix_a: "Ce qu'on doit", choix_b: "Ce qu'on possède", choix_c: "Une dépense", choix_d: "Un loyer", bonne_reponse: "B", explication: "Un actif est un élément du patrimoine (immobilier, actions, liquidités).", difficulte_score: 3, actif: true },
        ];
    }

    console.log(`Preparing to seed ${questions.length} questions...`);

    const batch = db.batch();
    for (const q of questions) {
        const docRef = db.collection("quiz_questions").doc(q.id);
        batch.set(docRef, q, { merge: true });
    }

    await batch.commit();
    console.log("Seed complete. Firestore updated.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
