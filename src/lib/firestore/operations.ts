import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    QueryConstraint,
    addDoc,
} from "firebase/firestore";
import { firestore } from "../firebase/client";

export interface Expense {
    id?: string;
    amount: number; // Negative for expenses, positive for income
    category: string;
    date: string; // ISO String
    description: string;
    receiptUrl?: string;
}

export const addExpense = async (uid: string, data: Omit<Expense, 'id'>) => {
    const colRef = collection(firestore, `users/${uid}/operations`);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
};

export const getExpenses = async (uid: string, constraints: QueryConstraint[] = []) => {
    const colRef = collection(firestore, `users/${uid}/operations`);
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense));
};

export const updateExpense = async (uid: string, expenseId: string, data: Partial<Expense>) => {
    const docRef = doc(firestore, `users/${uid}/operations`, expenseId);
    await updateDoc(docRef, data);
};

export const deleteExpense = async (uid: string, expenseId: string) => {
    const docRef = doc(firestore, `users/${uid}/operations`, expenseId);
    await deleteDoc(docRef);
};
