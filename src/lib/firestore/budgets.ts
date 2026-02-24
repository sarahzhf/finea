import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/client";

export interface BudgetLimit {
    category: string;
    limit: number;
}

export const getBudgets = async (uid: string) => {
    const colRef = collection(firestore, `users/${uid}/budgets`);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ category: doc.id, limit: doc.data().limit } as BudgetLimit));
};

export const setBudgetLimit = async (uid: string, category: string, limit: number) => {
    const docRef = doc(firestore, `users/${uid}/budgets`, category);
    await setDoc(docRef, { limit }, { merge: true });
};
