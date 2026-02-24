import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/client";

export interface Account {
    id: string;
    name: string;
    balance: number;
    limit?: number; // Plafond (ex: 22950 pour Livret A)
    returnRate?: number; // Taux d'intérêt (ex: 3)
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string; // ISO string
}

export interface SavingsData {
    accounts: Account[];
    goals: Goal[];
}

export const getSavingsData = async (uid: string) => {
    const docRef = doc(firestore, `users/${uid}/savings`, "data");
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
        return { accounts: [], goals: [] } as SavingsData;
    }
    return snapshot.data() as SavingsData;
};

export const setSavingsData = async (uid: string, data: SavingsData) => {
    const docRef = doc(firestore, `users/${uid}/savings`, "data");
    await setDoc(docRef, data, { merge: true });
};
