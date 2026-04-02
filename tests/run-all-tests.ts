/**
 * Rotwild-A1-System — Integrationstests
 * 
 * Validiert alle Module gegen wissenschaftliche Erwartungen
 */

import {
  totalPopulation,
  buildLeslieMatrix,
  projectOneYear,
  runDeterministic,
  calculateLambda,
  calculateNe,
  applyBonenfantDensityDependence,
} from '../src/models/population/leslie-engine';

import {
  runMonteCarlo,
  checkPhilosophyConstraints,
} from '../src/models/population/monte-carlo';

import { MERSCHBACH_DEFAULTS, PopulationVector, VitalRates } from '../src/models/population/types';

import { calculateHSI, MERSCHBACH_ZONES, HSIInput } from '../src/models/hsi/hsi-engine';
import { merschbachGeoJSON, getFeaturesByType } from '../src/geodata/merschbach-geojson';
import { recursiveChunk, deduplicateFacts } from '../src/pipeline/chunking';
import { getHealthStatus } from '../src/api/health';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAILED: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n━━━ ${name} ━━━`);
}

// ============================================================
section('1. POPULATIONSMODELL — Leslie-Matrix');
// ============================================================

// Anfangspopulation: ~60 Tiere (realistisch für 312 ha ohne Fütterung)
const initialPop: PopulationVector = {
  juvenile_f: 5, juvenile_m: 5,
  prime_f: 15, prime_m: 12,
  senescent_f: 4, senescent_m: 3,
};

const rates = MERSCHBACH_DEFAULTS.vital_rates;
const K = MERSCHBACH_DEFAULTS.carrying_capacity;

assert(totalPopulation(initialPop) === 44, `Gesamtpopulation = ${totalPopulation(initialPop)} (erwartet 44)`);

// Leslie-Matrix bauen
const L = buildLeslieMatrix(rates);
assert(L.rows === 6 && L.columns === 6, `Matrix ist 6×6 (${L.rows}×${L.columns})`);

// Alle Matrix-Einträge müssen ≥ 0 sein
let allNonNeg = true;
for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 6; j++) {
    if (L.get(i, j) < 0) allNonNeg = false;
  }
}
assert(allNonNeg, 'Alle Matrix-Einträge ≥ 0 (nicht-negativ)');

// λ berechnen
const lambda = calculateLambda(rates);
assert(lambda > 0.8 && lambda < 1.5, `λ = ${lambda.toFixed(4)} (plausibel: 0.8-1.5)`);
console.log(`  📊 Asymptotische Wachstumsrate λ = ${lambda.toFixed(4)}`);

// Ein Jahr projizieren
const pop1 = projectOneYear(initialPop, rates, K);
const N1 = totalPopulation(pop1);
assert(N1 > 0, `Population nach 1 Jahr = ${N1.toFixed(1)} (> 0)`);
assert(N1 < K * 2, `Population < 2K (keine Explosion)`);

// ============================================================
section('2. BONENFANT-HIERARCHIE — Dichteabhängigkeit');
// ============================================================

// Bei 30% K: Nur Fekundität betroffen
const rates30 = applyBonenfantDensityDependence(rates, K * 0.35, K);
assert(rates30.fecundity_prime < rates.fecundity_prime, 
  `Bei 35% K: Fekundität reduziert (${rates30.fecundity_prime.toFixed(3)} < ${rates.fecundity_prime})`);
assert(rates30.survival_juvenile_f === rates.survival_juvenile_f, 
  'Bei 35% K: Juvenile Überlebensrate UNVERÄNDERT (Bonenfant-Hierarchie)');
assert(rates30.survival_prime_f === rates.survival_prime_f, 
  'Bei 35% K: Adulte Überlebensrate UNVERÄNDERT');

// Bei 60% K: Fekundität + Juvenile betroffen
const rates60 = applyBonenfantDensityDependence(rates, K * 0.6, K);
assert(rates60.fecundity_prime < rates30.fecundity_prime, 
  `Bei 60% K: Fekundität weiter reduziert (${rates60.fecundity_prime.toFixed(3)})`);
assert(rates60.survival_juvenile_f < rates.survival_juvenile_f, 
  `Bei 60% K: Juvenile Überlebensrate reduziert (${rates60.survival_juvenile_f.toFixed(3)} < ${rates.survival_juvenile_f})`);
assert(rates60.survival_prime_f === rates.survival_prime_f, 
  'Bei 60% K: Adulte Überlebensrate NOCH UNVERÄNDERT');

// Bei 95% K: Alle betroffen
const rates95 = applyBonenfantDensityDependence(rates, K * 0.95, K);
assert(rates95.survival_prime_f < rates.survival_prime_f, 
  `Bei 95% K: Adulte Überlebensrate endlich reduziert (${rates95.survival_prime_f.toFixed(3)} < ${rates.survival_prime_f})`);
console.log(`  📊 Bonenfant-Hierarchie: Fekundität→Juvenile→Adulte (bestätigt)`);

// ============================================================
section('3. MONTE-CARLO — Stochastische Simulation');
// ============================================================

const mcResult = runMonteCarlo(
  initialPop,
  rates,
  MERSCHBACH_DEFAULTS.stochastic_rates,
  K,
  10,   // 10 Jahre
  100,  // 100 Läufe (schnell für Test)
  0.10  // 10% Entnahme
);

assert(mcResult.quantiles.length === 11, `11 Jahres-Quantile (0-10) vorhanden: ${mcResult.quantiles.length}`);
assert(mcResult.quantiles[0].q50 > 0, `Median Jahr 0 > 0: ${mcResult.quantiles[0].q50}`);
assert(mcResult.mean_lambda > 0, `Mittlere Wachstumsrate > 0: ${mcResult.mean_lambda.toFixed(4)}`);

// Konfidenzintervalle müssen geordnet sein
const yr5 = mcResult.quantiles[5];
assert(yr5.q025 <= yr5.q25, `Jahr 5: q2.5 ≤ q25 (${yr5.q025.toFixed(0)} ≤ ${yr5.q25.toFixed(0)})`);
assert(yr5.q25 <= yr5.q50, `Jahr 5: q25 ≤ q50 (${yr5.q25.toFixed(0)} ≤ ${yr5.q50.toFixed(0)})`);
assert(yr5.q50 <= yr5.q75, `Jahr 5: q50 ≤ q75 (${yr5.q50.toFixed(0)} ≤ ${yr5.q75.toFixed(0)})`);
assert(yr5.q75 <= yr5.q975, `Jahr 5: q75 ≤ q97.5 (${yr5.q75.toFixed(0)} ≤ ${yr5.q975.toFixed(0)})`);

// Unsicherheit muss mit der Zeit wachsen (Fan öffnet sich)
const spread0 = mcResult.quantiles[0].q975 - mcResult.quantiles[0].q025;
const spread10 = mcResult.quantiles[10].q975 - mcResult.quantiles[10].q025;
assert(spread10 > spread0, `Fan-Chart öffnet sich: Spread Jahr 10 (${spread10.toFixed(0)}) > Jahr 0 (${spread0.toFixed(0)})`);

console.log(`  📊 Monte-Carlo (100 Läufe, 10J): Median=${yr5.q50.toFixed(0)}, 95%-KI=[${yr5.q025.toFixed(0)}, ${yr5.q975.toFixed(0)}]`);
console.log(`  📊 Extinktionsrisiko: ${(mcResult.extinction_risk * 100).toFixed(1)}%`);

// ============================================================
section('4. PHILOSOPHIE-SYSTEM — G22/G23/G15');
// ============================================================

// G22: Unter 40% K → keine Entnahme
const lowPop: PopulationVector = {
  juvenile_f: 2, juvenile_m: 2,
  prime_f: 5, prime_m: 4,
  senescent_f: 1, senescent_m: 1,
};
const g22check = checkPhilosophyConstraints(lowPop, K, 9);
assert(!g22check.harvest_allowed, `G22: Bei N=${totalPopulation(lowPop)} (${Math.round(totalPopulation(lowPop)/K*100)}% K) → Keine Entnahme`);

// G23: Muttertierschutz Mai-Oktober
const g23summer = checkPhilosophyConstraints(initialPop, K, 7); // Juli
assert(!g23summer.adult_female_harvest_allowed, 'G23: Im Juli keine Alttier-Entnahme');
const g23winter = checkPhilosophyConstraints(initialPop, K, 11); // November
assert(g23winter.adult_female_harvest_allowed, 'G23: Im November Alttier-Entnahme möglich');

// ============================================================
section('5. Ne-BERECHNUNG — Effektive Populationsgröße');
// ============================================================

const neResult = calculateNe(initialPop, 0.20);
assert(neResult.ne === Math.round(44 * 0.20), `Ne = ${neResult.ne} (N×0.20 = ${Math.round(44 * 0.20)})`);
assert(neResult.status === 'critically_endangered' || neResult.status === 'endangered', 
  `Status: ${neResult.status} (Ne=${neResult.ne} < 50)`);
console.log(`  📊 Ne = ${neResult.ne}, Status: ${neResult.status}`);
console.log(`  📊 Hinweis: ${neResult.note}`);

// ============================================================
section('6. HSI-MODELL — 6 Covariaten');
// ============================================================

// Zone A (Kernzone) — sollte hohen HSI haben
const hsiA = calculateHSI(MERSCHBACH_ZONES.zone_a.input);
assert(hsiA.hsi > 0.5, `Zone A HSI = ${hsiA.hsi.toFixed(3)} (> 0.5 für Kernzone)`);
assert(hsiA.scores.length === 6, `6 Suitability-Scores vorhanden: ${hsiA.scores.length}`);
console.log(`  📊 Zone A: HSI=${hsiA.hsi.toFixed(3)}, Qualität=${hsiA.quality}, Limitierend=${hsiA.limiting_factor.name}`);

// Zone C (Pufferzone) — sollte niedrigeren HSI haben
const hsiC = calculateHSI(MERSCHBACH_ZONES.zone_c.input);
assert(hsiC.hsi < hsiA.hsi, `Zone C HSI (${hsiC.hsi.toFixed(3)}) < Zone A HSI (${hsiA.hsi.toFixed(3)})`);
console.log(`  📊 Zone C: HSI=${hsiC.hsi.toFixed(3)}, Qualität=${hsiC.quality}, Limitierend=${hsiC.limiting_factor.name}`);

// Kein Water-Score (bewusst entfernt!)
const hasWater = hsiA.scores.some(s => s.name.toLowerCase().includes('water') || s.name.toLowerCase().includes('wasser'));
assert(!hasWater, 'Kein Water-Score im HSI (bewusst entfernt — irrelevant im Hunsrück)');

// ============================================================
section('7. GEOJSON — Revierdaten');
// ============================================================

assert(merschbachGeoJSON.features.length > 10, `${merschbachGeoJSON.features.length} GeoJSON-Features (> 10)`);

const zones = getFeaturesByType('zone');
assert(zones.length === 3, `3 Zonen: ${zones.length}`);

const hochsitze = getFeaturesByType('hochsitz');
assert(hochsitze.length >= 5, `≥5 Hochsitze: ${hochsitze.length}`);

const wildkameras = getFeaturesByType('wildkamera');
assert(wildkameras.length >= 3, `≥3 Wildkameras: ${wildkameras.length}`);

const wildwechsel = getFeaturesByType('wildwechsel');
assert(wildwechsel.length >= 2, `≥2 Wildwechsel: ${wildwechsel.length}`);

const stoerungen = getFeaturesByType('stoerung');
assert(stoerungen.length >= 1, `≥1 Störquelle (K81): ${stoerungen.length}`);
console.log(`  📊 GeoJSON: ${merschbachGeoJSON.features.length} Features geladen (nicht mehr 0!)`);

// ============================================================
section('8. PIPELINE — Chunking & Deduplizierung');
// ============================================================

const testText = `# Kapitel 1: Rotwild im Hunsrück

Das Rotwild (Cervus elaphus) ist die größte freilebende Hirschart Mitteleuropas. Im Hunsrück-Hochwald bildet es stabile Populationen mit einer geschätzten Dichte von 2-4 Tieren pro Quadratkilometer.

## 1.1 Lebensraum

Der Hunsrück bietet ideale Bedingungen für Rotwild: ausgedehnte Mischwälder, moderate Hangneigung und ausreichende Äsungsflächen. Die Höhenlagen zwischen 300 und 600 Metern ü.NN. ermöglichen ganzjährige Besiedlung ohne kritische Schneehöhen.

## 1.2 Population

Die Bestandserfassung erfolgt durch regelmäßige Scheinwerfer-Taxationen, Wildkamera-Auswertungen und Jagdstreckenanalysen. Der aktuelle Frühjahrsbestand wird auf 40-50 Stück geschätzt, davon ca. 15-20 adulte Weibchen.

## 1.3 Jagdliche Bewirtschaftung

Die Abschussplanung folgt dem Grundsatz der nachhaltigen Nutzung. Der jährliche Abschuss liegt bei 8-12 Stück, was einer Entnahmerate von ca. 20% entspricht. Die Geschlechterverteilung im Abschuss wird aktiv gesteuert.`;

const chunks = recursiveChunk(testText, { chunkSize: 500, overlap: 100, sourceDocument: 'test_doc' });
assert(chunks.length >= 3, `${chunks.length} Chunks erzeugt (≥3 bei 500 chars)`);
assert(chunks.every(c => c.text.length <= 600), 'Alle Chunks ≤ 600 Zeichen (mit Toleranz)');
assert(chunks.some(c => c.section_title !== undefined), 'Mindestens ein Chunk hat Section-Title');
console.log(`  📊 Chunking: ${testText.length} Zeichen → ${chunks.length} Chunks`);

// Deduplizierung
const facts = [
  'Rotwild ist die größte Hirschart in Mitteleuropa.',
  'Rotwild ist die größte Hirschart Mitteleuropas.',
  'Die Tragfähigkeit liegt bei 20 Tieren pro km².',
  'Die Tragfähigkeit beträgt 20 Tiere pro km².',
  'Kälberüberleben variiert zwischen 0.26 und 1.00.',
];
const dedup = deduplicateFacts(facts, 0.8);
assert(dedup.deduplicated_count < dedup.original_count, 
  `Deduplizierung: ${dedup.original_count} → ${dedup.deduplicated_count} Fakten`);
assert(dedup.removed_count > 0, `${dedup.removed_count} Duplikate entfernt`);

// ============================================================
section('9. HEALTH CHECK');
// ============================================================

const health = getHealthStatus({
  totalFacts: 41583,
  indexedFacts: 8000,
  dbConnected: true,
  retrievalApiOk: false,
});
assert(health.status === 'unhealthy' || health.status === 'degraded', 
  `Status: ${health.status} (erwartet: degraded/unhealthy wegen API + BM25)`);
assert(health.checks.length >= 5, `${health.checks.length} Health-Checks`);
const bm25Check = health.checks.find(c => c.name === 'bm25_index');
assert(bm25Check?.status === 'fail', `BM25-Index: ${bm25Check?.status} (19% ≠ 100%)`);

// ============================================================
section('10. DETERMINISTISCHE 20-JAHRES-PROJEKTION');
// ============================================================

const det20 = runDeterministic(initialPop, rates, K, 20, 0.10);
assert(det20.length === 21, `21 Datenpunkte (Jahr 0-20): ${det20.length}`);

// Population sollte sich stabilisieren (nicht explodieren, nicht aussterben)
const finalN = det20[20].totalN;
assert(finalN > 5, `Nach 20 Jahren: N=${finalN.toFixed(0)} (> 5, nicht ausgestorben)`);
assert(finalN < K * 1.5, `Nach 20 Jahren: N=${finalN.toFixed(0)} (< ${K * 1.5}, nicht explodiert)`);

console.log(`\n  📊 20-Jahres-Projektion (10% Entnahme):`);
for (const yr of [0, 5, 10, 15, 20]) {
  const r = det20[yr];
  console.log(`     Jahr ${yr.toString().padStart(2)}: N=${r.totalN.toFixed(0).padStart(4)}, λ=${r.lambda.toFixed(3)}, Entnahme=${r.totalHarvest}`);
}

// ============================================================
// ZUSAMMENFASSUNG
// ============================================================
console.log(`\n${'═'.repeat(50)}`);
console.log(`  ERGEBNIS: ${passed} bestanden, ${failed} fehlgeschlagen`);
console.log(`${'═'.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
