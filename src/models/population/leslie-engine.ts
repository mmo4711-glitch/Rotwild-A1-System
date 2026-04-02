/**
 * Jagdhandbuch Merschbach — 3-Stufen Leslie-Matrix Engine
 * 
 * Implementiert ein altersstrukturiertes Populationsmodell mit:
 * - 3 Lebensstadien (Juvenil/Prime/Seneszent) × 2 Geschlechter
 * - Bonenfant-Hierarchie für Dichteabhängigkeit
 * - Beta-verteilte Vitalraten für Monte-Carlo
 * 
 * Wissenschaftliche Grundlage:
 * - Gaillard et al. 2000 (Annual Review): Vitalraten-Variabilität
 * - Rose et al. 1998 (Rum): Kohortenspezifische Überlebensraten
 * - Carpio et al. 2021 (PeerJ): Dichteabhängigkeit bei Cervus elaphus
 * - Clark et al. 2010: Theta-logistic ist unzuverlässig → Bonenfant-Hierarchie
 * - Bonenfant et al. 2009: Reihenfolge der Dichteeffekte
 */

import { Matrix } from 'ml-matrix';
import {
  PopulationVector,
  VitalRates,
  HarvestVector,
  CarryingCapacity,
  SimulationResult,
  MERSCHBACH_DEFAULTS
} from './types';

/**
 * Berechne die Gesamt-N aus einem Populationsvektor
 */
export function totalPopulation(pop: PopulationVector): number {
  return pop.juvenile_f + pop.juvenile_m + 
         pop.prime_f + pop.prime_m + 
         pop.senescent_f + pop.senescent_m;
}

/**
 * Populationsvektor → Array [j_f, j_m, p_f, p_m, s_f, s_m]
 */
export function popToArray(pop: PopulationVector): number[] {
  return [
    pop.juvenile_f, pop.juvenile_m,
    pop.prime_f, pop.prime_m,
    pop.senescent_f, pop.senescent_m
  ];
}

/**
 * Array → Populationsvektor
 */
export function arrayToPop(arr: number[]): PopulationVector {
  return {
    juvenile_f: Math.max(0, arr[0]),
    juvenile_m: Math.max(0, arr[1]),
    prime_f: Math.max(0, arr[2]),
    prime_m: Math.max(0, arr[3]),
    senescent_f: Math.max(0, arr[4]),
    senescent_m: Math.max(0, arr[5]),
  };
}

/**
 * Bonenfant-Hierarchie: Dichteabhängige Korrektur der Vitalraten
 * 
 * Reihenfolge der Dichteeffekte (Bonenfant et al. 2009):
 * 1. Fekundität junger Weibchen (reagiert zuerst, ab ~30% K)
 * 2. Juvenile Überlebensrate (ab ~50% K) 
 * 3. Adulte Überlebensrate (ZULETZT, erst ab ~90% K)
 * 
 * NICHT theta-logistisch! Clark et al. 2010 haben gezeigt, dass
 * θ und r_m gegeneinander austauschbar sind → unzuverlässig.
 */
export function applyBonenfantDensityDependence(
  rates: VitalRates,
  N: number,
  K: number
): VitalRates {
  const density_ratio = N / K;
  const adjusted = { ...rates };

  // 1. Fekundität reagiert ZUERST (ab 30% K, progressiv)
  if (density_ratio > 0.3) {
    const fecundity_reduction = Math.pow((density_ratio - 0.3) / 0.7, 1.5);
    adjusted.fecundity_prime = rates.fecundity_prime * Math.max(0.1, 1 - fecundity_reduction);
    adjusted.fecundity_senescent = rates.fecundity_senescent * Math.max(0.05, 1 - fecundity_reduction * 1.2);
  }

  // 2. Juvenile Überlebensrate (ab 50% K)
  if (density_ratio > 0.5) {
    const juv_reduction = Math.pow((density_ratio - 0.5) / 0.5, 2);
    adjusted.survival_juvenile_f = rates.survival_juvenile_f * Math.max(0.15, 1 - juv_reduction * 0.6);
    adjusted.survival_juvenile_m = rates.survival_juvenile_m * Math.max(0.10, 1 - juv_reduction * 0.7);
  }

  // 3. Adulte Überlebensrate — NUR bei extremer Dichte (ab 90% K)
  // Gaillard: CV < 10%, Adulte Überlebensrate ist der stabilste Parameter
  if (density_ratio > 0.9) {
    const adult_reduction = Math.pow((density_ratio - 0.9) / 0.1, 2);
    adjusted.survival_prime_f = rates.survival_prime_f * Math.max(0.80, 1 - adult_reduction * 0.15);
    adjusted.survival_prime_m = rates.survival_prime_m * Math.max(0.75, 1 - adult_reduction * 0.20);
    adjusted.survival_senescent_f = rates.survival_senescent_f * Math.max(0.40, 1 - adult_reduction * 0.30);
    adjusted.survival_senescent_m = rates.survival_senescent_m * Math.max(0.30, 1 - adult_reduction * 0.35);
  }

  return adjusted;
}

/**
 * Baue die 6×6 Leslie-Transitionsmatrix
 * 
 * Zustandsvektor: [J_f, J_m, P_f, P_m, S_f, S_m]
 * 
 * Die Matrix bildet ab:
 * - Zeile 0 (J_f): Geburten von Prime-♀ und Seneszent-♀ (× sex_ratio × survival_juv)
 * - Zeile 1 (J_m): Geburten (× (1-sex_ratio) × survival_juv) 
 * - Zeile 2 (P_f): Übergang J_f → P_f + Verbleib P_f (1-transition_to_sen)
 * - Zeile 3 (P_m): Übergang J_m → P_m + Verbleib P_m
 * - Zeile 4 (S_f): Übergang P_f → S_f + Verbleib S_f
 * - Zeile 5 (S_m): Übergang P_m → S_m + Verbleib S_m
 */
export function buildLeslieMatrix(rates: VitalRates): Matrix {
  const {
    survival_juvenile_f: sj_f, survival_juvenile_m: sj_m,
    survival_prime_f: sp_f, survival_prime_m: sp_m,
    survival_senescent_f: ss_f, survival_senescent_m: ss_m,
    fecundity_prime: fp, fecundity_senescent: fs,
    sex_ratio_birth: sr, // Anteil ♀
    transition_juv_to_prime: t_jp,
    transition_prime_to_sen: t_ps
  } = rates;

  // Die Matrix: n(t+1) = L · n(t)
  //           J_f    J_m    P_f                  P_m  S_f                  S_m
  const L = [
    [0,      0,     fp * sr * sj_f,     0,   fs * sr * sj_f,     0    ], // J_f: neue weibliche Kälber
    [0,      0,     fp * (1-sr) * sj_m,  0,   fs * (1-sr) * sj_m,  0    ], // J_m: neue männliche Kälber
    [t_jp * sj_f, 0, sp_f * (1-t_ps),    0,   0,                    0    ], // P_f: Übergang J→P + Verbleib P
    [0, t_jp * sj_m, 0,  sp_m * (1-t_ps), 0,                    0    ], // P_m
    [0,      0,     sp_f * t_ps,         0,   ss_f,                 0    ], // S_f: Übergang P→S + Verbleib S
    [0,      0,     0,  sp_m * t_ps,      0,                    ss_m ], // S_m
  ];

  return new Matrix(L);
}

/**
 * Projiziere die Population um ein Jahr
 */
export function projectOneYear(
  pop: PopulationVector,
  rates: VitalRates,
  K: number,
  harvest: HarvestVector = { juvenile_f: 0, juvenile_m: 0, prime_f: 0, prime_m: 0, senescent_f: 0, senescent_m: 0 }
): PopulationVector {
  const N = totalPopulation(pop);
  
  // Bonenfant-Hierarchie anwenden
  const adjustedRates = applyBonenfantDensityDependence(rates, N, K);
  
  // Leslie-Matrix bauen
  const L = buildLeslieMatrix(adjustedRates);
  
  // Matrix-Vektor-Multiplikation
  const nVec = new Matrix([popToArray(pop)]).transpose(); // 6×1
  const nNext = L.mmul(nVec); // 6×1
  
  // Ergebnis als Array
  const result = nNext.getColumn(0);
  
  // Ernte abziehen
  result[0] = Math.max(0, result[0] - harvest.juvenile_f);
  result[1] = Math.max(0, result[1] - harvest.juvenile_m);
  result[2] = Math.max(0, result[2] - harvest.prime_f);
  result[3] = Math.max(0, result[3] - harvest.prime_m);
  result[4] = Math.max(0, result[4] - harvest.senescent_f);
  result[5] = Math.max(0, result[5] - harvest.senescent_m);
  
  return arrayToPop(result);
}

/**
 * Berechne die asymptotische Wachstumsrate λ (dominanter Eigenwert)
 * 
 * λ > 1: Population wächst
 * λ = 1: Stabil
 * λ < 1: Population schrumpft
 */
export function calculateLambda(rates: VitalRates): number {
  const L = buildLeslieMatrix(rates);
  
  // ml-matrix EVD (Eigenvalue Decomposition)
  // Für eine 6×6 Matrix ist dies performant
  try {
    const { realEigenvalues } = new (Matrix as any).EigenvalueDecomposition(L);
    // Dominanter Eigenwert = Maximum der reellen Eigenwerte
    return Math.max(...realEigenvalues.filter((v: number) => !isNaN(v) && isFinite(v)));
  } catch {
    // Fallback: Power Iteration für dominanten Eigenwert
    return powerIterationLambda(L);
  }
}

/**
 * Power Iteration — robuster Fallback für λ-Berechnung
 */
function powerIterationLambda(L: Matrix, maxIter: number = 100, tol: number = 1e-8): number {
  let v = Matrix.ones(6, 1); // Startvektor
  let lambda_old = 0;
  
  for (let i = 0; i < maxIter; i++) {
    const Lv = L.mmul(v);
    const lambda_new = Math.max(...Lv.getColumn(0).map(Math.abs));
    
    if (lambda_new === 0) return 0;
    
    v = Lv.mul(1 / lambda_new); // Normalisieren
    
    if (Math.abs(lambda_new - lambda_old) < tol) return lambda_new;
    lambda_old = lambda_new;
  }
  
  return lambda_old;
}

/**
 * Deterministische Simulation über N Jahre
 */
export function runDeterministic(
  initial: PopulationVector,
  rates: VitalRates,
  K: number,
  years: number,
  harvestRate: number = 0 // Anteil der Population die entnommen wird
): SimulationResult[] {
  const results: SimulationResult[] = [];
  let pop = { ...initial };
  
  for (let year = 0; year <= years; year++) {
    const N = totalPopulation(pop);
    const lambda = year > 0 ? N / totalPopulation(results[year - 1].population) : 1;
    
    // Ernte berechnen (proportional zum Bestand)
    const harvest: HarvestVector = {
      juvenile_f: Math.round(pop.juvenile_f * harvestRate * 0.3),
      juvenile_m: Math.round(pop.juvenile_m * harvestRate * 0.3),
      prime_f: Math.round(pop.prime_f * harvestRate * 0.15),
      prime_m: Math.round(pop.prime_m * harvestRate * 0.25),
      senescent_f: Math.round(pop.senescent_f * harvestRate * 0.1),
      senescent_m: Math.round(pop.senescent_m * harvestRate * 0.2),
    };
    
    results.push({
      year,
      population: { ...pop },
      totalN: N,
      lambda,
      harvest: year === 0 ? { juvenile_f: 0, juvenile_m: 0, prime_f: 0, prime_m: 0, senescent_f: 0, senescent_m: 0 } : harvest,
      totalHarvest: year === 0 ? 0 : Object.values(harvest).reduce((a, b) => a + b, 0),
    });
    
    if (year < years) {
      pop = projectOneYear(pop, rates, K, harvest);
    }
  }
  
  return results;
}

/**
 * Berechne effektive Populationsgröße Ne
 * 
 * Für Harem-Polygynie (Cervus elaphus):
 * Ne/N ≈ 0.20 (Laumeier et al. 2025, Median für deutsche AMUs)
 * Range: 0.15-0.33
 * 
 * Detailliertere Berechnung nach Nunney 1993:
 * Ne = 4·Nf·Nm / (Nf + Nm) × Korrekturfaktor für Varianz in Reproduktionserfolg
 */
export function calculateNe(pop: PopulationVector, neNRatio: number = 0.20): {
  ne: number;
  ne_n_ratio: number;
  status: 'critically_endangered' | 'endangered' | 'vulnerable' | 'viable';
  note: string;
} {
  const N = totalPopulation(pop);
  const ne = N * neNRatio;
  
  let status: 'critically_endangered' | 'endangered' | 'vulnerable' | 'viable';
  let note: string;
  
  if (ne < 10) {
    status = 'critically_endangered';
    note = 'Ne < 10: Akute Inzuchtgefahr, genetischer Drift dominiert';
  } else if (ne < 50) {
    status = 'endangered';
    note = 'Ne < 50: Langfristig nicht lebensfähig ohne Genfluss (Frankham-Schwelle)';
  } else if (ne < 100) {
    status = 'vulnerable';
    note = 'Ne < 100: Eingeschränkt lebensfähig, Monitoring empfohlen (Laumeier et al. 2025)';
  } else {
    status = 'viable';
    note = 'Ne ≥ 100: Genetisch lebensfähig bei erhaltener Konnektivität';
  }
  
  return { ne: Math.round(ne), ne_n_ratio: neNRatio, status, note };
}
