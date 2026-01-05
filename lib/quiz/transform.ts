import type { AnswerChoice, QuizQuestionDoc, QuizQuestionPublic } from "./types";

export function toPublicQuestion(docId: string, q: QuizQuestionDoc): QuizQuestionPublic {
  const answers: Record<AnswerChoice, string> = {
    A: q.choices?.[0] ?? "",
    B: q.choices?.[1] ?? "",
    C: q.choices?.[2] ?? "",
    D: q.choices?.[3] ?? "",
  };
  const theme = (q.tags?.[0] ?? "general").toString();
  const difficultyLevel = (q.difficultyLevel ?? "moyen").toString();
  return {
    id: q.id,
    questionId: docId,
    question_text: q.question,
    answers,
    theme,
    difficulty_level: difficultyLevel,
  };
}

export function choiceToIndex(choice: AnswerChoice): number {
  if (choice === "A") return 0;
  if (choice === "B") return 1;
  if (choice === "C") return 2;
  return 3;
}
