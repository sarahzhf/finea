import type { QuizQuestionDoc, SkillProfile } from "./types";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Convert question difficulty score to IRT-like difficulty in [-2..+2].
 * If score is missing, assume medium (0).
 */
export function difficultyFromScore(score?: number | null) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  // score is often in [0..1]; map to [-2..+2]
  return clamp((score - 0.5) * 4, -2, 2);
}

/**
 * Probability of correct answer with 1PL logistic model:
 * p = sigmoid(theta - b)
 */
export function probCorrect(theta: number, b: number) {
  const x = theta - b;
  const p = 1 / (1 + Math.exp(-x));
  return clamp(p, 1e-6, 1 - 1e-6);
}

/**
 * Update skill for a set of tags using a light online gradient step.
 * This is NOT a full IRT estimation; it's a simple and defensible "ML-like" adaptive model.
 */
export function updateSkills(
  skills: SkillProfile,
  tags: string[],
  isCorrect: boolean,
  difficultyB: number,
  lr = 0.35
): SkillProfile {
  const next = { ...skills };
  const y = isCorrect ? 1 : 0;

  for (const tag of tags.length ? tags : ["general"]) {
    const theta = typeof next[tag] === "number" ? next[tag] : 0;
    const p = probCorrect(theta, difficultyB);
    // gradient of log-loss for logistic model: theta += lr*(y - p)
    const updated = clamp(theta + lr * (y - p), -3, 3);
    next[tag] = updated;
  }
  return next;
}

/**
 * Choose the next question among candidates.
 * We want:
 *  - difficulty near the user's theta (maximize information),
 *  - respect tag filter,
 *  - avoid repeats,
 *  - slight exploration (epsilon-greedy).
 */
export function selectNextQuestion(
  candidates: Array<{ docId: string; doc: QuizQuestionDoc }>,
  skills: SkillProfile,
  askedIds: Set<string>,
  tagsFilter?: string[]
) {
  const epsilon = 0.15; // exploration rate

  // filter active, not asked
  const filtered = candidates.filter((c) => !askedIds.has(c.docId) && c.doc.active !== false);
  if (filtered.length === 0) return null;

  // exploration
  if (Math.random() < epsilon) {
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  // score by "distance to target difficulty"
  let best = filtered[0];
  let bestScore = -Infinity;

  for (const c of filtered) {
    const tags = (c.doc.tags?.length ? c.doc.tags : ["general"]).map((t) => String(t).toLowerCase());
    const primaryTag =
      (tagsFilter?.length ? tags.find((t) => tagsFilter.includes(t)) : tags[0]) ?? "general";
    const theta = typeof skills[primaryTag] === "number" ? skills[primaryTag] : 0;
    const b = difficultyFromScore(c.doc.difficultyScore ?? null);

    const distance = Math.abs(theta - b); // smaller is better
    const information = 1 - clamp(distance / 4, 0, 1); // [0..1]
    // slight preference for questions with explicit explanation
    const explainBonus = c.doc.explanation && c.doc.explanation.trim().length > 0 ? 0.05 : 0;

    const score = information + explainBonus;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}
