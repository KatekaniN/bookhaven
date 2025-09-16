import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;

/**
 * Initialize firebase-admin if service account env is present.
 * Returns Firestore instance or null when not configured.
 */
export function getFirestoreAdmin(): Firestore | null {
  if (adminFirestore) return adminFirestore;

  // Accept either a JSON string env or individual env vars
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  try {
    // Attempt to dynamically import firebase-admin only on server
    const isServer = typeof window === "undefined";
    if (!isServer) return null;

    // If neither JSON nor individual fields are provided, skip admin
    if (!saJson && !(projectId && clientEmail && privateKey)) {
      return null;
    }

    // Lazy import to keep client bundle clean
    // eslint-disable-next-line
    const admin = require("firebase-admin");

    if (!admin.apps.length) {
      const credential = saJson
        ? admin.credential.cert(JSON.parse(saJson))
        : admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          });

      adminApp = admin.initializeApp({ credential });
    } else {
      adminApp = admin.apps[0];
    }

    adminFirestore = admin.firestore();
    return adminFirestore;
  } catch (e) {
    console.warn("firebase-admin not available or failed to init:", e);
    return null;
  }
}
