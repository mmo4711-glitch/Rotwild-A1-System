/**
 * Jagdhandbuch Merschbach — Population Model Types
 * 
 * 3-Stufen-Modell (Juvenil/Prim/Seneszent) × 2 Geschlechter
 * Basierend auf: Gaillard et al. 2000, Rose et al. 1998 (Rum), Carpio et al. 2021
 */

/** 3 Lebensstadien × 2 Geschlechter = 6 Zustandsvariablen */
export interface PopulationVector {
  /** Kälber/Jährlinge (0-1 Jahr), weiblich */
  juvenile_f: number;
  /** Kälber/Jährlinge (0-1 Jahr), männlich */
  juvenile_m: number;
  /** Prime-Age (2-8 Jahre), weiblich */
  prime_f: number;
  /** Prime-Age (2-8 Jahre), männlich */
  prime_m: number;
  /** Seneszent (9+ Jahre), weiblich */
  senescent_f: number;
  /** Seneszent (9+ Jahre), männlich */
  senescent_m: number;
}

/** Vitalraten — Überlebensraten und Fekunditäten */
export interface VitalRates {
  /** Kälberüberleben erster Winter — Rum: 0.26-1.00, CV >30% */
  survival_juvenile_f: number;
  survival_juvenile_m: number;
  /** Prime-Age Überleben — Rum: sehr stabil, CV <10% */
  survival_prime_f: number;
  survival_prime_m: number;
  /** Seneszent Überleben — Onset ~9J, schneller bei ♂ */
  survival_senescent_f: number;
  survival_senescent_m: number;
  /** Fekundität Prime-Weibchen — Carpio: 0.63 (gefüttert), 0.48 (ungefüttert) */
  fecundity_prime: number;
  /** Fekundität Seneszent-Weibchen — deutlich reduziert */
  fecundity_senescent: number;
  /** Geschlechterverhältnis bei Geburt (Anteil ♀) — Rum: leicht männlich-lastig */
  sex_ratio_birth: number;
  /** Übergangswahrscheinlichkeit Juvenil→Prime (Anteil der Jährlinge die zu Prime werden) */
  transition_juv_to_prime: number;
  /** Übergangswahrscheinlichkeit Prime→Seneszent pro Jahr (1/7 bei 7-Jahres-Prime-Phase) */
  transition_prime_to_sen: number;
}

/** Entnahmevektor */
export interface HarvestVector {
  juvenile_f: number;
  juvenile_m: number;
  prime_f: number;
  prime_m: number;
  senescent_f: number;
  senescent_m: number;
}

/** Tragfähigkeit pro Zone */
export interface CarryingCapacity {
  /** Gesamte K für das Revier */
  total: number;
  /** K pro Zone (optional) */
  zone_a?: number;
  zone_b?: number;
  zone_c?: number;
}

/** Beta-Verteilungs-Parameter für stochastische Simulation */
export interface BetaParams {
  alpha: number;
  beta: number;
}

/** Stochastische Vitalraten — jede Rate als Beta-Verteilung */
export interface StochasticVitalRates {
  survival_juvenile_f: BetaParams;
  survival_juvenile_m: BetaParams;
  survival_prime_f: BetaParams;
  survival_prime_m: BetaParams;
  survival_senescent_f: BetaParams;
  survival_senescent_m: BetaParams;
  fecundity_prime: BetaParams;
  fecundity_senescent: BetaParams;
}

/** Ergebnis einer einzelnen Simulation */
export interface SimulationResult {
  year: number;
  population: PopulationVector;
  totalN: number;
  lambda: number; // Wachstumsrate
  harvest: HarvestVector;
  totalHarvest: number;
}

/** Ergebnis der Monte-Carlo-Simulation */
export interface MonteCarloResult {
  /** Alle Simulationsläufe */
  runs: SimulationResult[][];
  /** Median-Trajektorie */
  median: SimulationResult[];
  /** Konfidenzintervalle pro Jahr */
  quantiles: {
    year: number;
    q025: number; // 2.5% Quantil
    q25: number;  // 25% Quantil
    q50: number;  // Median
    q75: number;  // 75% Quantil
    q975: number; // 97.5% Quantil
    lambda_median: number;
    extinction_probability: number; // Anteil Läufe mit N < MVP
  }[];
  /** Mittlere Wachstumsrate */
  mean_lambda: number;
  /** Extinktionswahrscheinlichkeit über gesamten Zeitraum */
  extinction_risk: number;
}

/** Merschbach Default-Parameter — validiert gegen Primärliteratur */
export const MERSCHBACH_DEFAULTS = {
  /** Reviergrüße in km² */
  area_km2: 3.12,
  
  /** K nach Carpio et al. 2021: ~39/km² (gefüttert), ~33/km² (ungefüttert)
   *  Für Hunsrück-Wald (ungefüttert, Mittelgebirge): konservativ 15-25/km²
   *  → 312 ha = 3.12 km² × 20/km² ≈ 62 Tiere (realistisch)
   *  Zielpopulation "Project Little Hungary": 120 (erfordert aktive Äsungsverbesserung)
   */
  carrying_capacity: 62,
  carrying_capacity_optimistic: 120,
  
  /** MVP (Minimum Viable Population) — Frankham et al.: Ne > 50 */
  minimum_viable_ne: 50,
  
  /** Ne/N-Ratio für Harem-Polygynie — Laumeier et al.: 0.15-0.33 */
  ne_n_ratio: 0.20,
  
  /** Standard-Vitalraten (Mittelwerte) */
  vital_rates: {
    survival_juvenile_f: 0.62,  // Rum Median weiblich, etwas besser als männlich
    survival_juvenile_m: 0.55,  // Rum Median männlich, schlechter als weiblich
    survival_prime_f: 0.97,     // Rum/Gaillard: sehr stabil, ~3% natürliche Mortalität
    survival_prime_m: 0.93,     // Männchen: höhere Mortalität
    survival_senescent_f: 0.78, // Ab 9 Jahre: deutlicher Rückgang
    survival_senescent_m: 0.65, // Männchen: schnellere Seneszenz
    fecundity_prime: 0.55,      // Hunsrück, ungefüttert: zwischen Carpio fed/unfed
    fecundity_senescent: 0.30,  // Rum: deutlicher Rückgang ab 11J
    sex_ratio_birth: 0.49,      // Leicht männlich-lastig (Rum)
    transition_juv_to_prime: 1.0, // Alle überlebenden Jährlinge werden Prime
    transition_prime_to_sen: 0.143, // 1/7 pro Jahr (Prime-Phase: 2-8J = 7 Jahre)
  } as VitalRates,
  
  /** Stochastische Parameter — Beta(α,β) Verteilungen */
  stochastic_rates: {
    // Kälber: hohe Variabilität (CV >30%), E=0.60
    survival_juvenile_f: { alpha: 3.1, beta: 1.9 },   // E=0.62, SD=0.20
    survival_juvenile_m: { alpha: 2.75, beta: 2.25 },  // E=0.55, SD=0.20
    // Prime: sehr stabil (CV <10%)
    survival_prime_f: { alpha: 40, beta: 1.24 },       // E=0.97, SD=0.03
    survival_prime_m: { alpha: 25, beta: 1.88 },       // E=0.93, SD=0.05
    // Seneszent: moderat variabel
    survival_senescent_f: { alpha: 8, beta: 2.26 },    // E=0.78, SD=0.12
    survival_senescent_m: { alpha: 5, beta: 2.69 },    // E=0.65, SD=0.16
    // Fekundität
    fecundity_prime: { alpha: 5, beta: 4.09 },         // E=0.55, SD=0.16
    fecundity_senescent: { alpha: 3, beta: 7.0 },      // E=0.30, SD=0.14
  } as StochasticVitalRates,
} as const;
