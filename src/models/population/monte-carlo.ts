/**
 * Jagdhandbuch Merschbach — Monte-Carlo-Simulation
 * 
 * Stochastische Populationsprojektion mit Beta-verteilten Vitalraten
 * 
 * Wissenschaftliche Grundlage:
 * - Harris et al. 2008: Beta-Verteilung für Überlebensraten bei Huftieren
 * - Gaillard et al. 2000: CV >30% für Juvenilüberleben, <10% für Adult
 * - Paterson et al. 2022: Stochastische Populationsmodelle für Elk
 */

import * as ss from 'simple-statistics';
import {
  PopulationVector,
  VitalRates,
  StochasticVitalRates,
  BetaParams,
  MonteCarloResult,
  SimulationResult,
  MERSCHBACH_DEFAULTS,
} from './types';
import {
  totalPopulation,
  projectOneYear,
  calculateNe,
} from './leslie-engine';

/**
 * Ziehe einen Wert aus einer Beta-Verteilung
 * 
 * Methode: Joehnk's Algorithm (für kleine α, β)
 * und Cheng's BA/BB Algorithmen (für größere Werte)
 * 
 * Vereinfachte Implementierung via Gamma-Variablen:
 * Wenn X ~ Gamma(α,1) und Y ~ Gamma(β,1), dann X/(X+Y) ~ Beta(α,β)
 */
function sampleBeta(params: BetaParams): number {
  const { alpha, beta } = params;
  
  // Gamma-Sampling via Marsaglia & Tsang (2000)
  const gammaA = sampleGamma(alpha);
  const gammaB = sampleGamma(beta);
  
  if (gammaA + gammaB === 0) return 0.5;
  
  const result = gammaA / (gammaA + gammaB);
  return Math.max(0, Math.min(1, result)); // Clamp [0,1]
}

/**
 * Gamma-Variate via Marsaglia & Tsang's Method (shape ≥ 1)
 * Für shape < 1: X = Gamma(shape+1) × U^(1/shape)
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // Ahrens-Dieter für shape < 1
    const u = Math.random();
    return sampleGamma(shape + 1) * Math.pow(u, 1 / shape);
  }
  
  // Marsaglia & Tsang für shape ≥ 1
  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9 * d);
  
  while (true) {
    let x: number, v: number;
    do {
      // Standard Normal via Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = Math.pow(1 + c * x, 3);
    } while (v <= 0);
    
    const u = Math.random();
    if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Generiere stochastische Vitalraten aus Beta-Verteilungen
 */
export function sampleVitalRates(
  stochastic: StochasticVitalRates,
  baseRates: VitalRates
): VitalRates {
  return {
    ...baseRates,
    survival_juvenile_f: sampleBeta(stochastic.survival_juvenile_f),
    survival_juvenile_m: sampleBeta(stochastic.survival_juvenile_m),
    survival_prime_f: sampleBeta(stochastic.survival_prime_f),
    survival_prime_m: sampleBeta(stochastic.survival_prime_m),
    survival_senescent_f: sampleBeta(stochastic.survival_senescent_f),
    survival_senescent_m: sampleBeta(stochastic.survival_senescent_m),
    fecundity_prime: sampleBeta(stochastic.fecundity_prime),
    fecundity_senescent: sampleBeta(stochastic.fecundity_senescent),
  };
}

/**
 * Führe eine Monte-Carlo-Simulation durch
 * 
 * @param initial - Anfangspopulation
 * @param baseRates - Basis-Vitalraten (Mittelwerte)
 * @param stochastic - Beta-Verteilungs-Parameter für jede Rate
 * @param K - Tragfähigkeit
 * @param years - Projektionszeitraum
 * @param runs - Anzahl Monte-Carlo-Läufe (Standard: 500)
 * @param harvestRate - Entnahmerate (Anteil)
 * @param mvp - Minimum Viable Population (für Extinktions-Check)
 */
export function runMonteCarlo(
  initial: PopulationVector,
  baseRates: VitalRates,
  stochastic: StochasticVitalRates,
  K: number,
  years: number = 10,
  runs: number = 500,
  harvestRate: number = 0,
  mvp: number = 10
): MonteCarloResult {
  const allRuns: SimulationResult[][] = [];
  
  // Alle Simulationsläufe durchführen
  for (let run = 0; run < runs; run++) {
    const runResults: SimulationResult[] = [];
    let pop = { ...initial };
    
    for (let year = 0; year <= years; year++) {
      const N = totalPopulation(pop);
      const lambda = year > 0 ? N / totalPopulation(runResults[year - 1].population) : 1;
      
      // Ernte
      const harvest = {
        juvenile_f: Math.round(pop.juvenile_f * harvestRate * 0.3),
        juvenile_m: Math.round(pop.juvenile_m * harvestRate * 0.3),
        prime_f: Math.round(pop.prime_f * harvestRate * 0.15),
        prime_m: Math.round(pop.prime_m * harvestRate * 0.25),
        senescent_f: Math.round(pop.senescent_f * harvestRate * 0.1),
        senescent_m: Math.round(pop.senescent_m * harvestRate * 0.2),
      };
      
      runResults.push({
        year,
        population: { ...pop },
        totalN: N,
        lambda,
        harvest: year === 0 ? { juvenile_f: 0, juvenile_m: 0, prime_f: 0, prime_m: 0, senescent_f: 0, senescent_m: 0 } : harvest,
        totalHarvest: year === 0 ? 0 : Object.values(harvest).reduce((a, b) => a + b, 0),
      });
      
      if (year < years) {
        // Ziehe stochastische Vitalraten für dieses Jahr
        const yearRates = sampleVitalRates(stochastic, baseRates);
        pop = projectOneYear(pop, yearRates, K, harvest);
      }
    }
    
    allRuns.push(runResults);
  }
  
  // Quantile berechnen
  const quantiles = [];
  let totalExtinctions = 0;
  
  for (let year = 0; year <= years; year++) {
    const yearNs = allRuns.map(run => run[year].totalN);
    const yearLambdas = allRuns.map(run => run[year].lambda);
    
    yearNs.sort((a, b) => a - b);
    yearLambdas.sort((a, b) => a - b);
    
    const extinct = yearNs.filter(n => n < mvp).length;
    if (year === years) totalExtinctions = extinct;
    
    quantiles.push({
      year,
      q025: ss.quantile(yearNs, 0.025),
      q25: ss.quantile(yearNs, 0.25),
      q50: ss.quantile(yearNs, 0.5),
      q75: ss.quantile(yearNs, 0.75),
      q975: ss.quantile(yearNs, 0.975),
      lambda_median: ss.quantile(yearLambdas, 0.5),
      extinction_probability: extinct / runs,
    });
  }
  
  // Mittlere Wachstumsrate (geometrisches Mittel über alle Läufe)
  const finalLambdas = allRuns.map(run => {
    const finalN = run[years].totalN;
    const initialN = run[0].totalN;
    if (initialN === 0 || finalN === 0) return 0;
    return Math.pow(finalN / initialN, 1 / years);
  });
  
  return {
    runs: allRuns,
    median: allRuns[Math.floor(runs / 2)], // Approximation
    quantiles,
    mean_lambda: ss.mean(finalLambdas.filter(l => l > 0 && isFinite(l))),
    extinction_risk: totalExtinctions / runs,
  };
}

/**
 * Philosophie-System Integration
 * 
 * G22: Jagdverzicht wenn N < 0.4·K (80% von K/2)
 * G23: Muttertierschutz Mai-Oktober (keine führenden Alttiere)
 * G15: Mindestanteil Alttiere erhalten
 */
export interface PhilosophyConstraints {
  /** G22: Keine Entnahme unter dieser Schwelle */
  g22_no_harvest_threshold: number;
  /** G23: Monate in denen führende Alttiere geschützt sind */
  g23_protection_months: number[];
  /** G15: Mindestanteil adulter Weibchen */
  g15_min_adult_female_ratio: number;
}

export const MERSCHBACH_PHILOSOPHY: PhilosophyConstraints = {
  g22_no_harvest_threshold: 0.4, // 40% von K → Nullentnahme
  g23_protection_months: [5, 6, 7, 8, 9, 10], // Mai-Oktober
  g15_min_adult_female_ratio: 0.25, // Mindestens 25% des Bestands sind adulte ♀
};

/**
 * Prüfe ob Ernte zulässig ist nach Philosophie-System
 */
export function checkPhilosophyConstraints(
  pop: PopulationVector,
  K: number,
  month: number,
  constraints: PhilosophyConstraints = MERSCHBACH_PHILOSOPHY
): {
  harvest_allowed: boolean;
  adult_female_harvest_allowed: boolean;
  warnings: string[];
} {
  const N = totalPopulation(pop);
  const warnings: string[] = [];
  let harvest_allowed = true;
  let adult_female_harvest_allowed = true;
  
  // G22: Jagdverzicht
  if (N / K < constraints.g22_no_harvest_threshold) {
    harvest_allowed = false;
    warnings.push(`G22 BLOCKER: Population bei ${Math.round(N/K*100)}% von K — Nullentnahme empfohlen`);
  }
  
  // G23: Muttertierschutz
  if (constraints.g23_protection_months.includes(month)) {
    adult_female_harvest_allowed = false;
    warnings.push(`G23: Muttertierschutz aktiv (Monat ${month}) — keine führenden Alttiere`);
  }
  
  // G15: Mindestanteil adulter Weibchen
  const adultFemaleRatio = (pop.prime_f + pop.senescent_f) / Math.max(1, N);
  if (adultFemaleRatio < constraints.g15_min_adult_female_ratio) {
    adult_female_harvest_allowed = false;
    warnings.push(
      `G15: Adulter Weibchenanteil bei ${Math.round(adultFemaleRatio*100)}% — ` +
      `unter Mindestschwelle von ${Math.round(constraints.g15_min_adult_female_ratio*100)}%`
    );
  }
  
  return { harvest_allowed, adult_female_harvest_allowed, warnings };
}
