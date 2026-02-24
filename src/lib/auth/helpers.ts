import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "../firebase/client";

export const signUpWithEmail = async (email: string, pass: string) => {
    return await createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
};

export const logOut = async () => {
    return await signOut(auth);
};
