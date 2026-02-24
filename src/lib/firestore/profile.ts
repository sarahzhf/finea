import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/client";

export interface UserProfile {
    firstName: string;
    lastName: string;
    job: string;
    financialGoal: string;
    monthlyIncome?: number;
}

export const getUserProfile = async (uid: string) => {
    const docRef = doc(firestore, `users/${uid}/profile`, "data");
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
        return {
            firstName: "",
            lastName: "",
            job: "",
            financialGoal: "",
            monthlyIncome: 0,
        } as UserProfile;
    }
    return snapshot.data() as UserProfile;
};

export const setUserProfile = async (uid: string, profile: UserProfile) => {
    const docRef = doc(firestore, `users/${uid}/profile`, "data");
    await setDoc(docRef, profile, { merge: true });
};
