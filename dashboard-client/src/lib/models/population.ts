/**
 * Population dynamics model for Rotwild (red deer) in Merschbach
 * Implements Leslie matrix, density dependence, and stochastic projection
 */

// Default parameters for Merschbach
export const MERSCHBACH_DEFAULTS = {
  K: 62,
  initialN: 45,
  harvestRate: 0.05,
  projectionYears: 10,
  monteCarloRuns: 200,
  // Survival rates by age class
  survival: {
    calf: 0.65,      // Kälber 0-1
    yearling: 0.85,  // Jährlinge 1-2
    prime: 0.92,     // Prime 2-8
    senescent: 0.70, // Seneszent 9+
  },
  // Fecundity (female calves per female)
  fecundity: {
    yearling: 0.20,
    prime: 0.55,
    senescent: 0.30,
  },
  // Sex ratio at birth (proportion female)
  sexRatioAtBirth: 0.50,
  // Age structure (initial)
  initialAgeStructure: {
    juvenilMale: 5,
    juvenilFemale: 5,
    primeMale: 9,
    primeFemale: 14,
    senescentMale: 4,
    senescentFemale: 8,
  },
};

export interface PopulationState {
  juvenilMale: number;
  juvenilFemale: number;
  primeMale: number;
  primeFemale: number;
  senescentMale: number;
  senescentFemale: number;
}

export interface PopulationRates {
  survival: typeof MERSCHBACH_DEFAULTS.survival;
  fecundity: typeof MERSCHBACH_DEFAULTS.fecundity;
  sexRatioAtBirth: number;
}

export interface ProjectionResult {
  year: number;
  N: number;
  males: number;
  females: number;
  lambda: number;
  state: PopulationState;
}

export interface MonteCarloResult {
  median: number[];
  p5: number[];
  p25: number[];
  p75: number[];
  p95: number[];
  p2_5: number[];
  p97_5: number[];
  years: number[];
}

export interface PhilosophyWarning {
  code: string;
  level: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
}

function totalN(state: PopulationState): number {
  return state.juvenilMale + state.juvenilFemale +
    state.primeMale + state.primeFemale +
    state.senescentMale + state.senescentFemale;
}

function totalMales(state: PopulationState): number {
  return state.juvenilMale + state.primeMale + state.senescentMale;
}

function totalFemales(state: PopulationState): number {
  return state.juvenilFemale + state.primeFemale + state.senescentFemale;
}

/**
 * Apply Bonenfant-style density dependence
 * Reduces fecundity and calf survival as N approaches K
 */
function applyDensityDependence(
  rates: PopulationRates,
  N: number,
  K: number
): PopulationRates {
  const ratio = Math.min(N / K, 2.0);
  // Bonenfant-style: steeper response only near K
  const dd = Math.max(0, 1 - Math.pow(ratio, 5));
  
  return {
    survival: {
      ...rates.survival,
      calf: rates.survival.calf * (0.6 + 0.4 * dd),
    },
    fecundity: {
      yearling: rates.fecundity.yearling * (0.3 + 0.7 * dd),
      prime: rates.fecundity.prime * (0.5 + 0.5 * dd),
      senescent: rates.fecundity.senescent * (0.3 + 0.7 * dd),
    },
    sexRatioAtBirth: rates.sexRatioAtBirth,
  };
}

/**
 * Add stochastic noise (environmental + demographic)
 */
function addStochasticity(rates: PopulationRates, N: number): PopulationRates {
  const envNoise = () => 1 + (Math.random() - 0.5) * 0.3;
  const demoNoise = () => N < 20 ? 1 + (Math.random() - 0.5) * 0.5 : 1 + (Math.random() - 0.5) * 0.1;
  
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  
  return {
    survival: {
      calf: clamp(rates.survival.calf * envNoise() * demoNoise()),
      yearling: clamp(rates.survival.yearling * envNoise()),
      prime: clamp(rates.survival.prime * envNoise()),
      senescent: clamp(rates.survival.senescent * envNoise()),
    },
    fecundity: {
      yearling: Math.max(0, rates.fecundity.yearling * envNoise()),
      prime: Math.max(0, rates.fecundity.prime * envNoise()),
      senescent: Math.max(0, rates.fecundity.senescent * envNoise()),
    },
    sexRatioAtBirth: rates.sexRatioAtBirth,
  };
}

/**
 * Project population one year forward
 */
export function projectOneYear(
  state: PopulationState,
  rates: PopulationRates,
  K: number,
  harvestRate: number,
  stochastic: boolean = false
): PopulationState {
  const N = totalN(state);
  let effectiveRates = applyDensityDependence(rates, N, K);
  if (stochastic) {
    effectiveRates = addStochasticity(effectiveRates, N);
  }
  
  // Birth (from females)
  const newCalves =
    state.primeFemale * effectiveRates.fecundity.prime +
    state.senescentFemale * effectiveRates.fecundity.senescent +
    state.juvenilFemale * effectiveRates.fecundity.yearling * 0.3;
  
  const newFemaleCalves = newCalves * effectiveRates.sexRatioAtBirth;
  const newMaleCalves = newCalves * (1 - effectiveRates.sexRatioAtBirth);
  
  // Aging and survival  
  // Transition rates: juveniles -> prime (yearling survival), prime stays (with aging fraction leaving to senescent)
  const agingRate = 0.12; // fraction of prime aging out per year
  
  const nextState: PopulationState = {
    juvenilMale: Math.max(0, newMaleCalves * effectiveRates.survival.calf),
    juvenilFemale: Math.max(0, newFemaleCalves * effectiveRates.survival.calf),
    primeMale: Math.max(0,
      state.juvenilMale * effectiveRates.survival.yearling +
      state.primeMale * effectiveRates.survival.prime * (1 - agingRate)
    ),
    primeFemale: Math.max(0,
      state.juvenilFemale * effectiveRates.survival.yearling +
      state.primeFemale * effectiveRates.survival.prime * (1 - agingRate)
    ),
    senescentMale: Math.max(0,
      state.primeMale * effectiveRates.survival.prime * agingRate +
      state.senescentMale * effectiveRates.survival.senescent
    ),
    senescentFemale: Math.max(0,
      state.primeFemale * effectiveRates.survival.prime * agingRate +
      state.senescentFemale * effectiveRates.survival.senescent
    ),
  };
  
  // Apply harvest proportionally
  if (harvestRate > 0) {
    const nextN = totalN(nextState);
    const toHarvest = Math.round(nextN * harvestRate);
    if (toHarvest > 0 && nextN > 0) {
      const factor = Math.max(0, 1 - toHarvest / nextN);
      nextState.juvenilMale *= factor;
      nextState.juvenilFemale *= factor;
      nextState.primeMale *= factor;
      nextState.primeFemale *= factor;
      nextState.senescentMale *= factor;
      nextState.senescentFemale *= factor;
    }
  }
  
  return nextState;
}

/**
 * Run deterministic projection
 */
export function runDeterministicProjection(
  initialState: PopulationState,
  rates: PopulationRates,
  K: number,
  harvestRate: number,
  years: number
): ProjectionResult[] {
  const results: ProjectionResult[] = [];
  let state = { ...initialState };
  
  results.push({
    year: 0,
    N: totalN(state),
    males: totalMales(state),
    females: totalFemales(state),
    lambda: 1,
    state: { ...state },
  });
  
  for (let y = 1; y <= years; y++) {
    const prevN = totalN(state);
    state = projectOneYear(state, rates, K, harvestRate);
    const newN = totalN(state);
    results.push({
      year: y,
      N: Math.round(newN),
      males: Math.round(totalMales(state)),
      females: Math.round(totalFemales(state)),
      lambda: prevN > 0 ? newN / prevN : 0,
      state: { ...state },
    });
  }
  
  return results;
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarlo(
  initialState: PopulationState,
  rates: PopulationRates,
  K: number,
  harvestRate: number,
  years: number,
  runs: number = 200
): MonteCarloResult {
  const allTrajectories: number[][] = [];
  
  for (let r = 0; r < runs; r++) {
    let state = { ...initialState };
    const trajectory: number[] = [totalN(state)];
    
    for (let y = 1; y <= years; y++) {
      state = projectOneYear(state, rates, K, harvestRate, true);
      trajectory.push(Math.round(totalN(state)));
    }
    
    allTrajectories.push(trajectory);
  }
  
  // Calculate percentiles for each year
  const yearsArr = Array.from({ length: years + 1 }, (_, i) => i);
  const median: number[] = [];
  const p5: number[] = [];
  const p25: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];
  const p2_5: number[] = [];
  const p97_5: number[] = [];
  
  for (let y = 0; y <= years; y++) {
    const values = allTrajectories.map(t => t[y]).sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const idx = Math.floor(p / 100 * (values.length - 1));
      return values[idx];
    };
    
    median.push(getPercentile(50));
    p5.push(getPercentile(5));
    p25.push(getPercentile(25));
    p75.push(getPercentile(75));
    p95.push(getPercentile(95));
    p2_5.push(getPercentile(2.5));
    p97_5.push(getPercentile(97.5));
  }
  
  return { median, p5, p25, p75, p95, p2_5, p97_5, years: yearsArr };
}

/**
 * Calculate growth rate (lambda)
 */
export function calculateLambda(state: PopulationState, rates: PopulationRates, K: number): number {
  const N = totalN(state);
  const nextState = projectOneYear(state, rates, K, 0);
  const nextN = totalN(nextState);
  return N > 0 ? nextN / N : 0;
}

/**
 * Calculate effective population size Ne
 */
export function calculateNe(males: number, females: number): number {
  if (males + females === 0) return 0;
  return (4 * males * females) / (males + females);
}

/**
 * Calculate Maximum Sustainable Yield
 * Uses the intrinsic growth rate (lambda without harvest at low density)
 */
export function calculateMSY(K: number, rMax: number): { percent: number; absolute: number } {
  // rMax is the maximum intrinsic rate (lambda_max - 1)
  // For ungulates, rMax ≈ 0.2-0.4
  // MSY = rMax * K / 4 (logistic model)
  const msyAbsolute = Math.round(rMax * K / 4);
  const msyPercent = Math.round((rMax / 2) * 100 * 10) / 10;
  return {
    percent: Math.max(0, msyPercent),
    absolute: Math.max(0, msyAbsolute),
  };
}

/**
 * Estimate intrinsic growth rate at low density
 */
export function estimateRMax(rates: PopulationRates): number {
  // Approximate lambda at low density (no density dependence)
  // For red deer: typically rMax ≈ 0.25-0.35
  const avgSurvival = (rates.survival.calf + rates.survival.yearling + rates.survival.prime + rates.survival.senescent) / 4;
  const avgFecundity = (rates.fecundity.prime + rates.fecundity.senescent) / 2;
  const r = Math.log(avgSurvival) + Math.log(1 + avgFecundity * rates.sexRatioAtBirth);
  return Math.max(0.05, Math.min(0.5, r + 0.15)); // bounded realistic range
}

/**
 * Check philosophy constraints (Hegephilosophie)
 */
export function checkPhilosophyConstraints(
  state: PopulationState,
  K: number,
  month: number = new Date().getMonth() + 1
): PhilosophyWarning[] {
  const warnings: PhilosophyWarning[] = [];
  const N = totalN(state);
  const females = totalFemales(state);
  const adultFemales = state.primeFemale + state.senescentFemale;
  
  // G22: Population below 40% K
  if (N < 0.4 * K) {
    warnings.push({
      code: 'G22',
      level: 'danger',
      title: 'Populationsgrenze unterschritten',
      message: `N = ${Math.round(N)} liegt unter 40% von K (${Math.round(0.4 * K)}). Entnahme aussetzen und Bestandsaufbau priorisieren.`,
    });
  }
  
  // G23: Muttertierschutz (March-August)
  if (month >= 3 && month <= 8) {
    warnings.push({
      code: 'G23',
      level: 'info',
      title: 'Muttertierschutz aktiv',
      message: `Schonzeit ${month >= 3 && month <= 8 ? 'März–August' : ''}: Keine Bejagung von führenden Alttieren. Kälberentnahme bevorzugen.`,
    });
  }
  
  // G15: Adult female ratio
  const femaleRatio = N > 0 ? adultFemales / N : 0;
  if (femaleRatio < 0.25) {
    warnings.push({
      code: 'G15',
      level: 'warning',
      title: 'Alttier-Anteil zu gering',
      message: `Weiblicher Anteil adulter Tiere bei ${Math.round(femaleRatio * 100)}% (Ziel: >25%). Entnahme auf männliche Stücke konzentrieren.`,
    });
  }
  
  // Ne warning
  const ne = calculateNe(totalMales(state), females);
  if (ne < 50) {
    warnings.push({
      code: 'Ne50',
      level: 'warning',
      title: 'Effektive Populationsgröße kritisch',
      message: `Ne = ${Math.round(ne)} liegt unter der 50/500-Schwelle. Genetische Drift gefährdet langfristige Fitness.`,
    });
  }
  
  return warnings;
}

export { totalN, totalMales, totalFemales };
