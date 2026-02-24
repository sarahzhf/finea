import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/client";

export interface Credit {
    id?: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    interestRate: number;
    createdAt?: string;
}

export const getCredits = async (uid: string) => {
    const colRef = collection(firestore, `users/${uid}/credits`);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Credit));
};

export const addCredit = async (uid: string, credit: Credit) => {
    const docRef = doc(collection(firestore, `users/${uid}/credits`));
    await setDoc(docRef, { ...credit, id: docRef.id, createdAt: new Date().toISOString() });
};

export const deleteCredit = async (uid: string, id: string) => {
    const docRef = doc(firestore, `users/${uid}/credits`, id);
    await deleteDoc(docRef);
};
