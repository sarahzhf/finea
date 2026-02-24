import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        let credential;

        // In production, you might load credentials from environment variables directly.
        // Locally, we use the path from FIREBASE_SERVICE_ACCOUNT_PATH.
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
            credential = admin.credential.cert(require(`../../${serviceAccountPath.replace('./', '')}`));
        } else {
            credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
            credential,
        });
        console.log("Firebase Admin Initialized");
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

const adminAuth = admin.auth();
const adminFirestore = admin.firestore();

export { adminAuth, adminFirestore };
