import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Returns a Firestore Admin instance if service account env vars are present.
 * Safely no-ops on the client and when credentials are missing.
 */
export function getFirestoreAdmin(): Firestore | null {
  try {
    // Ensure this only runs on the server
    if (typeof window !== "undefined") return null;

    const projectId = process.env.FIREBASE_PROJECT_ID as string | undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY as string | undefined;

    // Support optional JSON service account via FIREBASE_SERVICE_ACCOUNT
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT as string | undefined;

    if (!saJson && !(projectId && clientEmail && privateKey)) {
      return null;
    }

    // Normalize private key
    if (privateKey) {
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (!getApps().length) {
      const credential = saJson
        ? cert(JSON.parse(saJson))
        : cert({
            projectId: projectId!,
            clientEmail: clientEmail!,
            privateKey: privateKey!,
          });

      initializeApp({ credential });
    }

    return getFirestore();
  } catch (e) {
    console.error("Failed to init Firebase Admin:", e);
    return null;
  }
}
