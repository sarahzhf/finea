export type AnswerChoice = "A" | "B" | "C" | "D";

export type QuizQuestionPublic = {
  id: string;
  theme: string;
  difficulty_level: number;
  question_text: string;
  explanation?: string | null;
  tags: string[];
  answers: Record<AnswerChoice, string>;
};

export type QuizProgress = {
  sessionId: string;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  finished: boolean;
};

export type QuizQuestionResponse = {
  progress: QuizProgress;
  question: QuizQuestionPublic | null;
};

export type QuizAnswerRequest = {
  selected: AnswerChoice;
};

export type QuizAnswerResponse =
  | { progress: QuizProgress; nextQuestion: QuizQuestionPublic }
  | { progress: QuizProgress; results: { score: number; total: number } };
