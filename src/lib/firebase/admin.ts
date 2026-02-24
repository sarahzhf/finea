import "server-only";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount(): admin.ServiceAccount {
    const rawPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!rawPath) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set in .env.local");
    }

    // Supporte "./serviceAccountKey.json" et "serviceAccountKey.json"
    const normalized = rawPath.startsWith("./") ? rawPath.slice(2) : rawPath;

    // Chemin absolu depuis la racine du projet
    const absPath = path.resolve(process.cwd(), normalized);

    if (!fs.existsSync(absPath)) {
        throw new Error(`Service account file not found at: ${absPath}`);
    }

    const json = fs.readFileSync(absPath, "utf8");
    return JSON.parse(json) as admin.ServiceAccount;
}

function initFirebaseAdmin() {
    if (admin.apps.length) return;

    const serviceAccount = loadServiceAccount();
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin Initialized");
}

try {
    initFirebaseAdmin();
} catch (e) {
    console.error("Firebase admin initialization error:", e);
    // On relance l’erreur : sinon admin.auth() planterait plus loin avec “default app does not exist”
    throw e;
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();