export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { toPublicQuestion } from "@/lib/quiz/selectQuestions";
import { DEFAULT_THETA, selectNextQuestion } from "@/lib/quiz/adaptive";

function getClientIdFromCookies() {
  const store = cookies();
  const existing = store.get("finea_client_id")?.value;
  if (existing) return { clientId: existing, isNew: false };

  const clientId = `client_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  return { clientId, isNew: true };
}

export async function GET(req: NextRequest) {
  try {
    console.log("ENV CHECK", {
      SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      HAS_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

  const count = Math.min(Math.max(Number(searchParams.get("count") ?? "10"), 1), 25);
  const rawTheme = searchParams.get("theme");
  const theme = rawTheme ? rawTheme.trim().toLowerCase() : null;

  const { clientId, isNew } = getClientIdFromCookies();

  // 1) Create session
  const { data: session, error: sErr } = await supabase
    .from("quiz_sessions")
    .insert({
      client_id: clientId,
      total_questions: count,
      theme_filter: theme,
      // Adaptive fields (online ability estimation)
      theta_overall: DEFAULT_THETA,
      theme_theta: {},
    })
    .select("*")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: sErr?.message ?? "Failed to create session" }, { status: 500 });
  }

  // 2) Pick questions (simple random for MVP)
  let q = supabase
    .from("quiz_questions")
    .select("*")
    .eq("active", true);

  if (theme) q = q.ilike("theme", `%${theme}%`);

  // Supabase doesn't offer true random cheaply; MVP approach:
  // fetch more and shuffle client-side
  const { data: questions, error: qErr } = await q.limit(200);
  if (qErr || !questions || questions.length === 0) {
    return NextResponse.json({ error: qErr?.message ?? "No questions available" }, { status: 500 });
  }

  // Fetch all previously seen questions for this client (across past sessions)
  const { data: seenRows } = await supabase
    .from("quiz_session_questions")
    .select("question_id, quiz_sessions!inner(client_id)")
    .eq("quiz_sessions.client_id", clientId);

  const seenQuestionIds = new Set(
    (seenRows ?? []).map((r: any) => r.question_id)
  );

  // Adaptive: only insert the first question now.
  // Next questions will be selected on-the-fly in /answer.
  const first = selectNextQuestion({
    candidates: questions ?? [],
    askedIds: seenQuestionIds,
    thetaOverall: DEFAULT_THETA,
    themeTheta: {},
    // start around medium difficulty
    targetDifficultyLevel: 3,
    epsilon: 0.15,
  });

  const finalFirst = first ?? selectNextQuestion({
    candidates: questions ?? [],
    askedIds: new Set(),
    thetaOverall: DEFAULT_THETA,
    themeTheta: {},
    targetDifficultyLevel: 3,
    epsilon: 0.15,
  });

  if (!finalFirst) {
    return NextResponse.json({ error: "No question could be selected" }, { status: 500 });
  }

  const { error: sqErr } = await supabase.from("quiz_session_questions").insert({
    session_id: session.id,
    question_id: finalFirst.id,
    position: 0,
  });
  if (sqErr) {
    return NextResponse.json({ error: sqErr.message }, { status: 500 });
  }

  const res = NextResponse.json({
    progress: {
      sessionId: session.id,
      currentIndex: 0,
      totalQuestions: count,
      score: 0,
      finished: false,
    },
    question: toPublicQuestion(finalFirst),
  });

  if (isNew) {
    res.cookies.set("finea_client_id", clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

    return res;
  } catch (e: any) {
    console.error("QUIZ START UNCAUGHT ERROR", e);
    return NextResponse.json(
      { error: e?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
