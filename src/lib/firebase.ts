import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

// Configuration injected by Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyCVIH30ZusjqSkDoX6JokPPe2fFwSOOgNk",
  authDomain: "gen-lang-client-0534717067.firebaseapp.com",
  projectId: "gen-lang-client-0534717067",
  storageBucket: "gen-lang-client-0534717067.firebasestorage.app",
  messagingSenderId: "854854027061",
  appId: "1:854854027061:web:fdd63114cc531576716e7c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore using our custom database ID
const db = getFirestore(app, "ai-studio-bc5016c4-4dd2-4d75-885f-ef183a4a05da");

// House state structure
export interface HouseState {
  weekStart: string;
  weekEnd: string;
  dailyTasks: any[];
  nTimesTasks: any[];
  weeklyTasks: any[];
  monthlyTasks: any[];
  memo: string;
  spouseAName: string;
  spouseBName: string;
  relationshipQuests: any[];
  cumulativeHomeXp: number;
  spouseAOverallXp: number;
  spouseBOverallXp: number;
  lastUpdatedBy?: string;
  version: number;
}

/**
 * Generate a clean 6-digit sync code (e.g., 582491)
 */
export function generateSyncCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Saves initial state or updates an existing house document
 */
export async function saveHouseState(houseCode: string, state: Omit<HouseState, 'version'> & { version?: number }) {
  const docRef = doc(db, 'houses', houseCode);
  try {
    const existingSnap = await getDoc(docRef);
    let nextVersion = 1;
    if (existingSnap.exists()) {
      const data = existingSnap.data() as HouseState;
      nextVersion = (data.version || 0) + 1;
    }
    
    await setDoc(docRef, {
      ...state,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error("Failed to save state to Firebase Firestore:", error);
  }
}

/**
 * Checks if a house sync code exists
 */
export async function checkHouseExists(houseCode: string): Promise<boolean> {
  const docRef = doc(db, 'houses', houseCode);
  const snap = await getDoc(docRef);
  return snap.exists();
}

export { db };
