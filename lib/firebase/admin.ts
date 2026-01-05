import "server-only";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

/**
 * Firebase Admin init for server-side (API routes, server actions).
 *
 * Provide ONE of:
 * - FIREBASE_SERVICE_ACCOUNT_JSON: JSON string (server only)
 * - FIREBASE_SERVICE_ACCOUNT_PATH: path to serviceAccountKey.json (relative to project root recommended)
 * - GOOGLE_APPLICATION_CREDENTIALS: path recognized by Firebase Admin SDK
 */
function loadServiceAccountFromEnv(): admin.ServiceAccount | undefined {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonStr && jsonStr.trim()) {
    try {
      return JSON.parse(jsonStr) as admin.ServiceAccount;
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", e);
      return undefined;
    }
  }

  const p =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!p || !p.trim()) return undefined;

  try {
    // ✅ Supporte chemin relatif (recommandé) et absolu
    const resolved = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);

    if (!fs.existsSync(resolved)) {
      console.error(
        "Service account file not found:",
        resolved,
        "\n(process.cwd() =",
        process.cwd(),
        ")"
      );
      return undefined;
    }

    const raw = fs.readFileSync(resolved, "utf8");
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch (e) {
    console.error("Failed to read/parse service account file:", e);
    return undefined;
  }
}

export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccount = loadServiceAccountFromEnv();
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS (server-only)."
    );
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // optionnel mais pratique
  try {
    admin.firestore(app).settings({ ignoreUndefinedProperties: true });
  } catch {
    // no-op
  }

  return app;
}

export function getFirestore() {
  const app = getAdminApp();
  return admin.firestore(app);
}

export function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

export function nowTimestamp() {
  return admin.firestore.Timestamp.now();
}
