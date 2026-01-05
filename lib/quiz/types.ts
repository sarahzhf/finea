export type AnswerChoice = "A" | "B" | "C" | "D";

export type QuizQuestionDoc = {
  id: number;
  question: string;
  choices: string[]; // length 4
  correctIndex: number; // 0..3
  explanation?: string;
  difficultyScore?: number | null; // 0..1 typically
  difficultyLevel?: string | null;
  tags?: string[];
  version?: number;
  active?: boolean;
  updatedAt?: any;
};

export type QuizQuestionPublic = {
  id: number;
  question_text: string;
  answers: Record<AnswerChoice, string>;
  theme: string; // derived from first tag or "general"
  difficulty_level: string; // derived
  questionId: string; // Firestore doc id
};

export type SkillProfile = Record<string, number>; // tag -> theta in [-3..+3]

export type QuizSessionDoc = {
  createdAt: any;
  updatedAt: any;

  // selection constraints
  totalQuestions: number;
  tagsFilter?: string[];

  // progress
  currentIndex: number;
  score: number;

  // bookkeeping
  askedQuestionIds: string[]; // Firestore doc ids
  answered: Array<{
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    tags: string[];
    difficulty: number;
    answeredAt: any;
  }>;

  // simple "IRT-like" skill per tag
  skills: SkillProfile;

  finished: boolean;
};
