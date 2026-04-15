"""
Jagdhandbuch Merschbach — Fakt-Deduplizierung

Erkennt und verschmilzt ähnliche Fakten über Cosine Similarity.
Verhindert redundante Einträge in der Wissensbasis.

Methoden:
1. Exakte Duplikat-Erkennung (Hash-basiert, O(n))
2. Fuzzy-Duplikat-Erkennung (Trigram Cosine Similarity, O(n²) aber mit Vorfilter)
3. Upsert-Logik: Längere/neuere Version behält Vorrang
"""

from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Optional


@dataclass
class DeduplicationResult:
    """Ergebnis einer Deduplizierungs-Operation."""
    original_count: int
    deduplicated_count: int
    removed_count: int
    removed_facts: list[dict]  # [{fact, similar_to, similarity}]
    kept_facts: list[str]


def _normalize(text: str) -> str:
    """Normalisiere Text für Vergleich."""
    t = text.lower().strip()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"[^\w\s]", "", t)
    return t


def _trigrams(text: str) -> Counter:
    """Berechne Character-Trigrams eines Textes."""
    normalized = _normalize(text)
    if len(normalized) < 3:
        return Counter({normalized: 1})
    return Counter(normalized[i:i+3] for i in range(len(normalized) - 2))


def cosine_similarity(text_a: str, text_b: str) -> float:
    """
    Berechne Cosine Similarity zwischen zwei Texten über Character-Trigrams.

    Effizienter als volles Embedding-basiertes Matching,
    ausreichend für Fakt-Deduplizierung (Threshold 0.92).
    """
    trig_a = _trigrams(text_a)
    trig_b = _trigrams(text_b)

    if not trig_a or not trig_b:
        return 0.0

    # Schnittmenge
    common_keys = set(trig_a.keys()) & set(trig_b.keys())
    dot_product = sum(trig_a[k] * trig_b[k] for k in common_keys)

    # Normen
    norm_a = math.sqrt(sum(v * v for v in trig_a.values()))
    norm_b = math.sqrt(sum(v * v for v in trig_b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def deduplicate_facts(
    facts: list[str],
    threshold: float = 0.92,
) -> DeduplicationResult:
    """
    Dedupliziere eine Liste von Fakten.

    Strategie:
    1. Exakte Duplikate über Hash entfernen (schnell)
    2. Fuzzy-Duplikate über Trigram Cosine Similarity (threshold=0.92)
    3. Bei Fuzzy-Match: Längerer Fakt wird behalten

    Args:
        facts: Liste von Fakt-Strings
        threshold: Similarity-Schwelle für Fuzzy-Matching (Default: 0.92)

    Returns:
        DeduplicationResult mit behaltenen und entfernten Fakten
    """
    if not facts:
        return DeduplicationResult(0, 0, 0, [], [])

    # Phase 1: Exakte Duplikate (Hash)
    seen_hashes: dict[str, int] = {}
    unique_facts: list[str] = []

    for fact in facts:
        h = hashlib.sha256(_normalize(fact).encode()).hexdigest()[:16]
        if h not in seen_hashes:
            seen_hashes[h] = len(unique_facts)
            unique_facts.append(fact)

    exact_removed = len(facts) - len(unique_facts)

    # Phase 2: Fuzzy-Duplikate (Trigram Cosine)
    kept: list[str] = []
    removed: list[dict] = []

    # Vorfilter: Nur Fakten ähnlicher Länge vergleichen (±50%)
    for fact in unique_facts:
        is_duplicate = False

        for existing in kept:
            # Längenfilter: Fakten unterschiedlicher Länge können nicht >0.92 ähnlich sein
            len_ratio = len(fact) / max(len(existing), 1)
            if len_ratio < 0.5 or len_ratio > 2.0:
                continue

            similarity = cosine_similarity(fact, existing)

            if similarity >= threshold:
                is_duplicate = True

                # Längerer Fakt gewinnt
                if len(fact) > len(existing):
                    idx = kept.index(existing)
                    removed.append({
                        "fact": existing,
                        "similar_to": fact,
                        "similarity": round(similarity, 4),
                    })
                    kept[idx] = fact
                else:
                    removed.append({
                        "fact": fact,
                        "similar_to": existing,
                        "similarity": round(similarity, 4),
                    })
                break

        if not is_duplicate:
            kept.append(fact)

    # Exakte Duplikate zu removed hinzufügen
    if exact_removed > 0:
        removed.insert(0, {
            "fact": f"[{exact_removed} exakte Duplikate entfernt]",
            "similar_to": "Hash-Matching",
            "similarity": 1.0,
        })

    return DeduplicationResult(
        original_count=len(facts),
        deduplicated_count=len(kept),
        removed_count=len(facts) - len(kept),
        removed_facts=removed,
        kept_facts=kept,
    )


# ─────────────────────────────────────────────
# Upsert-Logik für Wissensbasis
# ─────────────────────────────────────────────

@dataclass
class UpsertResult:
    """Ergebnis einer Upsert-Operation."""
    inserted: int
    updated: int
    skipped: int
    details: list[dict]


def upsert_facts(
    new_facts: list[str],
    existing_facts: list[str],
    similarity_threshold: float = 0.88,
    update_threshold: float = 0.95,
) -> UpsertResult:
    """
    Upsert-Logik: Neue Fakten in bestehende Wissensbasis einfügen.

    Entscheidungsbaum:
    1. similarity < similarity_threshold → INSERT (neuer Fakt)
    2. similarity >= update_threshold → SKIP (identisch genug)
    3. similarity_threshold <= similarity < update_threshold → UPDATE (ähnlich aber besser)

    Bei UPDATE: Neuer Fakt ersetzt alten, wenn er länger ist oder neuere Info enthält.

    Args:
        new_facts: Neue Fakten aus dem Dokument
        existing_facts: Bestehende Fakten in der DB
        similarity_threshold: Ab dieser Ähnlichkeit wird verglichen (Default: 0.88)
        update_threshold: Ab dieser Ähnlichkeit wird übersprungen (Default: 0.95)

    Returns:
        UpsertResult mit Insert/Update/Skip-Statistiken
    """
    inserted = 0
    updated = 0
    skipped = 0
    details: list[dict] = []

    for new_fact in new_facts:
        best_match: Optional[str] = None
        best_similarity = 0.0

        for existing in existing_facts:
            sim = cosine_similarity(new_fact, existing)
            if sim > best_similarity:
                best_similarity = sim
                best_match = existing

        if best_similarity < similarity_threshold:
            # INSERT — neuer Fakt
            inserted += 1
            details.append({
                "action": "INSERT",
                "fact": new_fact[:100],
                "similarity": round(best_similarity, 4),
            })

        elif best_similarity >= update_threshold:
            # SKIP — nahezu identisch
            skipped += 1
            details.append({
                "action": "SKIP",
                "fact": new_fact[:100],
                "similar_to": (best_match or "")[:100],
                "similarity": round(best_similarity, 4),
            })

        else:
            # UPDATE — ähnlich aber unterschiedlich genug
            if len(new_fact) > len(best_match or ""):
                updated += 1
                details.append({
                    "action": "UPDATE",
                    "fact": new_fact[:100],
                    "replaces": (best_match or "")[:100],
                    "similarity": round(best_similarity, 4),
                })
            else:
                skipped += 1
                details.append({
                    "action": "SKIP",
                    "fact": new_fact[:100],
                    "reason": "existing version is longer",
                    "similarity": round(best_similarity, 4),
                })

    return UpsertResult(
        inserted=inserted,
        updated=updated,
        skipped=skipped,
        details=details,
    )
