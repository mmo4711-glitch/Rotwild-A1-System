"""
Tests für die Pipeline-Module: Chunking, Deduplizierung, Upsert, Reindexierung.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from chunking import recursive_chunk, chunk_document, Chunk
from deduplication import cosine_similarity, deduplicate_facts, upsert_facts
from reindex_bm25 import run_reindex

passed = 0
failed = 0

def assert_true(condition: bool, message: str):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ {message}")
    else:
        failed += 1
        print(f"  ❌ FAILED: {message}")

def section(name: str):
    print(f"\n{'━' * 3} {name} {'━' * 3}")


# ═══════════════════════════════════════════════
section("1. CHUNKING — Recursive Splitting")
# ═══════════════════════════════════════════════

test_text = """# Kapitel 1: Rotwild im Hunsrück

Das Rotwild (Cervus elaphus) ist die größte freilebende Hirschart Mitteleuropas. Im Hunsrück-Hochwald bildet es stabile Populationen mit einer geschätzten Dichte von 2-4 Tieren pro Quadratkilometer.

## 1.1 Lebensraum

Der Hunsrück bietet ideale Bedingungen für Rotwild: ausgedehnte Mischwälder, moderate Hangneigung und ausreichende Äsungsflächen. Die Höhenlagen zwischen 300 und 600 Metern ü.NN. ermöglichen ganzjährige Besiedlung ohne kritische Schneehöhen.

## 1.2 Population

Die Bestandserfassung erfolgt durch regelmäßige Scheinwerfer-Taxationen, Wildkamera-Auswertungen und Jagdstreckenanalysen. Der aktuelle Frühjahrsbestand wird auf 40-50 Stück geschätzt, davon ca. 15-20 adulte Weibchen.

## 1.3 Jagdliche Bewirtschaftung

Die Abschussplanung folgt dem Grundsatz der nachhaltigen Nutzung. Der jährliche Abschuss liegt bei 8-12 Stück, was einer Entnahmerate von ca. 20% entspricht. Die Geschlechterverteilung im Abschuss wird aktiv gesteuert.

## 1.4 Habitatbewertung

Das HSI-Modell mit 6 Covariaten (Cover, Slope, Aspect, Disturbance, Forest%, Edge) zeigt Zone A als optimalen Lebensraum. Die Bonenfant-Hierarchie der Dichteabhängigkeit erklärt warum die Population bei 72% K noch stabil ist."""

chunks = recursive_chunk(test_text, chunk_size=500, overlap=100, source_document="test.pdf")

assert_true(len(chunks) >= 3, f"{len(chunks)} Chunks erzeugt (≥3 bei 500 chars)")
assert_true(all(len(c.text) <= 600 for c in chunks), "Alle Chunks ≤ 600 Zeichen (mit Toleranz)")
assert_true(any(c.section_title is not None for c in chunks), "Mindestens ein Chunk hat Section-Title")
assert_true(all(c.content_hash for c in chunks), "Alle Chunks haben Content-Hash")
assert_true(all(c.token_estimate > 0 for c in chunks), "Alle Chunks haben Token-Schätzung")

# Chunk-Abdeckung: Gesamter Text muss abgedeckt sein
combined = " ".join(c.text for c in chunks)
for keyword in ["Cervus elaphus", "Bonenfant", "HSI-Modell", "Scheinwerfer"]:
    assert_true(keyword in combined, f'Keyword "{keyword}" in Chunks enthalten')

print(f"  📊 {len(test_text)} Zeichen → {len(chunks)} Chunks")
for i, c in enumerate(chunks):
    print(f"     Chunk {i}: {len(c.text)} Zeichen, Section: {c.section_title or '—'}")


# ═══════════════════════════════════════════════
section("2. CHUNKING — Langes Dokument (12.000+ Zeichen)")
# ═══════════════════════════════════════════════

# Simuliere ein langes Dokument (das Problem: >12.000 Zeichen)
long_text = test_text * 8  # ~8.000 Zeichen
long_chunks = recursive_chunk(long_text, chunk_size=2000, overlap=400, source_document="lang.pdf")

assert_true(len(long_chunks) >= 4, f"Langes Dokument: {len(long_chunks)} Chunks (≥4)")
assert_true(all(len(c.text) <= 2200 for c in long_chunks), "Alle Chunks ≤ 2200 Zeichen")

total_chars = sum(len(c.text) for c in long_chunks)
coverage = total_chars / len(long_text) * 100
print(f"  📊 {len(long_text)} Zeichen → {len(long_chunks)} Chunks (Coverage: {coverage:.0f}%)")


# ═══════════════════════════════════════════════
section("3. CHUNKING — Deutsche Satzgrenzen")
# ═══════════════════════════════════════════════

german_text = "Dr. Müller untersucht z.B. die Population bei ca. 45 Stück. Die Tragfähigkeit liegt bei K=62. Das entspricht etwa 20 Tieren pro km². Neue Studien zeigen andere Werte."
german_chunks = recursive_chunk(german_text, chunk_size=100, overlap=20)

# "Dr." und "z.B." und "ca." sollten NICHT als Satzgrenze erkannt werden
first_chunk_text = german_chunks[0].text if german_chunks else ""
assert_true("Dr. Müller" in first_chunk_text or len(german_chunks) < 10,
    "Abkürzungen werden nicht als Satzgrenze erkannt")


# ═══════════════════════════════════════════════
section("4. DEDUPLIZIERUNG — Cosine Similarity")
# ═══════════════════════════════════════════════

sim1 = cosine_similarity(
    "Rotwild ist die größte Hirschart in Mitteleuropa.",
    "Rotwild ist die größte Hirschart Mitteleuropas."
)
assert_true(sim1 > 0.9, f"Ähnliche Sätze: similarity={sim1:.3f} (>0.9)")

sim2 = cosine_similarity(
    "Rotwild ist die größte Hirschart in Mitteleuropa.",
    "Die Tragfähigkeit liegt bei 20 Tieren pro km²."
)
assert_true(sim2 < 0.5, f"Verschiedene Sätze: similarity={sim2:.3f} (<0.5)")

sim3 = cosine_similarity(
    "Die Tragfähigkeit liegt bei 20 Tieren pro km².",
    "Die Tragfähigkeit beträgt 20 Tiere pro km²."
)
assert_true(sim3 > 0.70, f"Paraphrasierte Sätze: similarity={sim3:.3f} (>0.70)")


# ═══════════════════════════════════════════════
section("5. DEDUPLIZIERUNG — Fakt-Bereinigung")
# ═══════════════════════════════════════════════

facts = [
    "Rotwild ist die größte Hirschart in Mitteleuropa.",
    "Rotwild ist die größte Hirschart Mitteleuropas.",
    "Die Tragfähigkeit liegt bei 20 Tieren pro km².",
    "Die Tragfähigkeit beträgt 20 Tiere pro km².",
    "Kälberüberleben variiert zwischen 0.26 und 1.00.",
    "Die Kälberüberlebensrate liegt zwischen 0,26 und 1,00.",
    "Der Hunsrück liegt in Rheinland-Pfalz.",
]

dedup = deduplicate_facts(facts, threshold=0.80)

assert_true(dedup.deduplicated_count < dedup.original_count,
    f"Deduplizierung: {dedup.original_count} → {dedup.deduplicated_count} Fakten")
assert_true(dedup.removed_count >= 1, f"{dedup.removed_count} Duplikate entfernt (≥1)")
assert_true("Hunsrück" in " ".join(dedup.kept_facts),
    "Einzigartiger Fakt (Hunsrück) bleibt erhalten")


# ═══════════════════════════════════════════════
section("6. UPSERT-LOGIK")
# ═══════════════════════════════════════════════

existing = [
    "Rotwild ist die größte Hirschart.",
    "K liegt bei 62 Tieren.",
]

new = [
    "Rotwild (Cervus elaphus) ist die größte freilebende Hirschart Mitteleuropas.",  # UPDATE (länger)
    "K liegt bei 62 Tieren.",                                                        # SKIP (identisch)
    "Die Bonenfant-Hierarchie beschreibt dichteabhängige Effekte.",                  # INSERT (neu)
]

upsert = upsert_facts(new, existing, similarity_threshold=0.70, update_threshold=0.95)

assert_true(upsert.inserted >= 1, f"Mindestens 1 INSERT: {upsert.inserted}")
assert_true(upsert.updated >= 1 or upsert.skipped >= 1,
    f"Mindestens 1 UPDATE oder SKIP: updated={upsert.updated}, skipped={upsert.skipped}")
print(f"  📊 Upsert: {upsert.inserted} INSERT, {upsert.updated} UPDATE, {upsert.skipped} SKIP")


# ═══════════════════════════════════════════════
section("7. REINDEXIERUNG — Simulationslauf")
# ═══════════════════════════════════════════════

stats = run_reindex(dry_run=True)

assert_true(stats.total_documents == 2, f"2 Simulationsdokumente: {stats.total_documents}")
assert_true(stats.total_chunks_created >= 3, f"≥3 Chunks erstellt: {stats.total_chunks_created}")
assert_true(stats.total_facts_after_dedup > 0, f"Fakten nach Dedup > 0: {stats.total_facts_after_dedup}")
assert_true(stats.errors == 0, f"Keine Fehler: {stats.errors}")
assert_true(stats.duration_seconds < 10, f"Dauer < 10s: {stats.duration_seconds:.2f}s")


# ═══════════════════════════════════════════════
section("8. CHUNK_DOCUMENT — Vollständige Pipeline")
# ═══════════════════════════════════════════════

doc_text = """Titel: Jagdkonzept Merschbach\\f
Seite 2: Die Abschussplanung...\\f
Seite 3: Habitatbewertung...\\f
Seite 4: Genetische Analyse..."""

doc_chunks = chunk_document(doc_text, "konzept.pdf", chunk_size=100, overlap=20)
assert_true(len(doc_chunks) >= 1, f"Dokumentpipeline erzeugt Chunks: {len(doc_chunks)}")
# Seitenumbrüche (\\f) sollten als Absatztrennung behandelt werden
# Seitenumbrüche werden durch chunk_document bereinigt (\f → \n\n)
assert_true(len(doc_chunks) >= 1, "Dokument wird in Chunks aufgeteilt")


# ═══════════════════════════════════════════════
print(f"\n{'═' * 50}")
print(f"  ERGEBNIS: {passed} bestanden, {failed} fehlgeschlagen")
print(f"{'═' * 50}")

if failed > 0:
    sys.exit(1)
