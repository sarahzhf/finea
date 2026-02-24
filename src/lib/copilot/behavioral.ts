/**
 * Calculation of Behavioral Score (0-100) and detection of flags.
 */

export interface BehavioralInputs {
    monthlyIncomeNet: number;
    monthlySavingsAmount: number; // Actual saved this month
    funExpenses: number; // Loisirs, etc.
    totalExpenses: number;
    debtsMonthly: number;
    volatility: number; // std dev / mean of last 3 months expenses (0 if not enough data)
    goalAmount: number;
    currentSavings: number;
    goalHorizonMonths: number;
}

export function calculateBehavioralScore(inputs: BehavioralInputs) {
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const {
        monthlyIncomeNet,
        monthlySavingsAmount,
        funExpenses,
        totalExpenses,
        debtsMonthly,
        volatility,
        goalAmount,
        currentSavings,
        goalHorizonMonths,
    } = inputs;

    const savingsRate = monthlyIncomeNet > 0 ? clamp(monthlySavingsAmount / monthlyIncomeNet, 0, 1) : 0;
    const funShare = totalExpenses > 0 ? clamp(funExpenses / totalExpenses, 0, 1) : 0;

    const requiredMonthlySaving = goalHorizonMonths > 0
        ? Math.max(0, (goalAmount - currentSavings) / goalHorizonMonths)
        : 0;

    const goalGap = requiredMonthlySaving > 0
        ? clamp(Math.max(0, requiredMonthlySaving - monthlySavingsAmount) / requiredMonthlySaving, 0, 1)
        : 0;

    const consistency = 1 - clamp(volatility, 0, 1);
    const debtPressure = monthlyIncomeNet > 0 ? clamp(debtsMonthly / monthlyIncomeNet, 0, 1) : 0;

    // Normalizations (f1 to f5)
    const f1 = clamp(savingsRate / 0.2, 0, 1);
    const f2 = 1 - clamp(funShare / 0.3, 0, 1);
    const f3 = clamp(consistency, 0, 1);
    const f4 = 1 - clamp(goalGap, 0, 1);
    const f5 = 1 - clamp(debtPressure / 0.35, 0, 1);

    // Score
    const w1 = 3, w2 = 2, w3 = 2, w4 = 3, w5 = 2;
    const totalWeight = w1 + w2 + w3 + w4 + w5;
    const rawScore = 100 * (w1 * f1 + w2 * f2 + w3 * f3 + w4 * f4 + w5 * f5) / totalWeight;
    const behaviorScore = Math.round(rawScore);

    // Flags
    const flags: string[] = [];
    if (f4 < 0.6 && funShare > 0.3) flags.push("Incohérence objectif vs comportement");
    if (monthlySavingsAmount <= 0 && requiredMonthlySaving > 0) flags.push("Procrastination");
    if (volatility > 0.25) flags.push("Budget fragile");
    if (debtPressure > 0.35) flags.push("Endettement tendu");

    return {
        score: behaviorScore,
        subscores: { f1, f2, f3, f4, f5 },
        flags
    };
}
