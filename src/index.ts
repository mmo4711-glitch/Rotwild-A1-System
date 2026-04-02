/**
 * Rotwild-A1-System — Hauptmodul
 * Jagdhandbuch Merschbach
 * 
 * Wissenschaftlich fundierte Module für:
 * - Populationsdynamik (3-Stufen Leslie-Matrix + Monte-Carlo)
 * - Habitatbewertung (6-Covariaten HSI)
 * - Geodaten (GeoJSON Revier/Zonen/Infrastruktur)
 * - Pipeline (Chunking + Deduplizierung)
 * - System-Gesundheit (Health Check API)
 */

// Population Models
export { 
  totalPopulation, 
  buildLeslieMatrix, 
  projectOneYear, 
  runDeterministic,
  calculateLambda,
  calculateNe,
  applyBonenfantDensityDependence,
} from './models/population/leslie-engine';

export {
  runMonteCarlo,
  sampleVitalRates,
  checkPhilosophyConstraints,
  MERSCHBACH_PHILOSOPHY,
} from './models/population/monte-carlo';

export type {
  PopulationVector,
  VitalRates,
  HarvestVector,
  StochasticVitalRates,
  BetaParams,
  SimulationResult,
  MonteCarloResult,
} from './models/population/types';

export { MERSCHBACH_DEFAULTS } from './models/population/types';

// HSI Model
export {
  calculateHSI,
  MERSCHBACH_ZONES,
} from './models/hsi/hsi-engine';

export type {
  HSIInput,
  HSIResult,
  SuitabilityScore,
} from './models/hsi/hsi-engine';

// Geodata
export {
  merschbachGeoJSON,
  getGeoJSONString,
  getFeaturesByType,
  MERSCHBACH_CENTER,
} from './geodata/merschbach-geojson';

// Pipeline
export {
  recursiveChunk,
  deduplicateFacts,
} from './pipeline/chunking';

export type {
  Chunk,
  DeduplicationResult,
} from './pipeline/chunking';

// API
export {
  getHealthStatus,
} from './api/health';

export type {
  HealthStatus,
} from './api/health';
