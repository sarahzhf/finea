import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/client";

//export interface QuizQuestion {
//    id: string;
//    question: string;
//    choix_a: string;
//    choix_b: string;
//    choix_c: string;
//    choix_d: string;
//    bonne_reponse: string;
//    explication: string;
//    difficulte_score?: number;
//    difficulte_niveau?: string;
//    tags?: string;
//    actif?: boolean;
//}
export interface QuizQuestion {
    // si tu as un champ "id" (numéro) dans Firestore
    id: number;
    question: string;
    choices: string[];        // 4 choix
    correctIndex: number;     // 0..3
    explanation: string;
    difficultyScore?: number; // 1..5
    difficultyLevel?: string; // "Intermédiaire", etc.
    tags?: string[];          // ["decision","risque",...]
    version?: number;
    active?: boolean;
    updatedAt?: any;          // Timestamp Firestore (optionnel)
}

//export const getActiveQuizQuestions = async () => {
//    const colRef = collection(firestore, "quiz_questions");
//    const snapshot = await getDocs(colRef);
//    return snapshot.docs.map(doc => doc.data() as QuizQuestion);
//};
export const getActiveQuizQuestions = async () => {
    const colRef = collection(firestore, "questions");
    const q = query(colRef, where("active", "==", true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as QuizQuestion);
};