const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../credentials.json"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createTestUser() {
    try {
        const userRecord = await admin.auth().createUser({
            email: "test@finea.fr",
            password: "password123",
            displayName: "Utilisateur Test",
        });
        console.log("Successfully created test user:", userRecord.uid);

        // Seed user doc
        const firestore = admin.firestore();
        await firestore.collection("users").doc(userRecord.uid).set({
            email: userRecord.email,
            createdAt: new Date().toISOString(),
            onboardingComplete: false,
        });
        console.log("Seeded user document for:", userRecord.uid);

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log("Test user test@finea.fr already exists.");
        } else {
            console.error("Error creating new user:", error);
        }
    }
}

createTestUser().then(() => process.exit(0));
