from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from typing import Optional, List, Dict

app = FastAPI()

class CopilotProfileInput(BaseModel):
    monthlyIncomeNet: Optional[float] = None
    fixedCosts: Optional[float] = None
    variableCosts: Optional[float] = None
    currentSavings: Optional[float] = None
    debtsMonthly: Optional[float] = None
    goalAmount: Optional[float] = None
    goalHorizonMonths: Optional[int] = None

class SimulationAssumptions(BaseModel):
    muAnnual: float = 0.05
    sigmaAnnual: float = 0.15
    inflationAnnual: float = 0.02
    shockProbAnnual: float = 0.05
    shockAmount: float = 1000.0
    nSims: int = 200

class SimulationRequest(BaseModel):
    profile: CopilotProfileInput
    assumptions: SimulationAssumptions

@app.post("/simulate")
def simulate(req: SimulationRequest):
    # Retrieve base params
    current_savings = req.profile.currentSavings or 0.0
    goal_amount = req.profile.goalAmount or 0.0
    T = req.profile.goalHorizonMonths or 36
    
    # Calculate monthly contribution (C_t)
    income = req.profile.monthlyIncomeNet or 0.0
    fixed = req.profile.fixedCosts or 0.0
    var_costs = req.profile.variableCosts or 0.0
    debts = req.profile.debtsMonthly or 0.0
    
    C_t = max(0.0, income - fixed - var_costs - debts)
    
    # Assumptions
    mu_m = req.assumptions.muAnnual / 12.0
    sigma_m = req.assumptions.sigmaAnnual / np.sqrt(12)
    n_sims = req.assumptions.nSims
    
    results_WT = []
    
    # Vectorized simulation could be faster, but loop is fine for n=1000, T=36
    for _ in range(n_sims):
        W = current_savings
        for t in range(T):
            # Market shock
            eps = np.random.normal(0, 1)
            r_t = mu_m + sigma_m * eps
            
            # Expense shock
            shock = 0.0
            if np.random.rand() < (req.assumptions.shockProbAnnual / 12.0):
                shock = req.assumptions.shockAmount
                
            W = (W + C_t) * (1 + r_t) - shock
        results_WT.append(W)
        
    results_WT = np.array(results_WT)
    
    success_prob = np.mean(results_WT >= goal_amount)
    p10 = float(np.percentile(results_WT, 10))
    p50 = float(np.percentile(results_WT, 50))
    p90 = float(np.percentile(results_WT, 90))
    
    return {
        "successProb": float(success_prob),
        "p10": p10,
        "p50": p50,
        "p90": p90,
        "computedMonthlyContribution": C_t
    }
