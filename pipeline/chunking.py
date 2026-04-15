"""
Jagdhandbuch Merschbach — Pipeline Chunking Engine (Python)

Recursive Character Splitting für deutschsprachige Fachtexte.
Port der TypeScript-Implementierung (dashboard/src/pipeline/chunking.ts).

Best Practice 2025/2026:
- 2.000 Zeichen pro Chunk (~400-500 Tokens für Deutsch)
- 20% Overlap (400 Zeichen)
- Separator-Hierarchie: Absatz → Zeilenumbruch → Satz → Semikolon → Leerzeichen
- Deutsche Satzgrenzen-Erkennung (Abkürzungen, Zahlen, Aufzählungen)

Löst das 12.000-Zeichen-Problem:
  Vorher: 1 Chunk à 12.000 Zeichen → Dokument ab Seite 3 verloren
  Nachher: 6+ Chunks à 2.000 Zeichen → vollständige Extraktion
"""

from __future__ import annotations

import re
import hashlib
from dataclasses import dataclass, field
from typing import Optional

# ─────────────────────────────────────────────
# Deutsche Abkürzungen (Satzgrenzen-Erkennung)
# ─────────────────────────────────────────────

GERMAN_ABBREVIATIONS = frozenset([
    "z.b", "bzw", "etc", "usw", "vgl", "ggf", "evtl", "ca",
    "nr", "abs", "art", "gem", "lit", "sog", "inkl", "exkl",
    "dr", "prof", "dipl", "ing", "min", "max", "std",
    "ha", "km", "kg", "mg", "ml", "cm", "mm",
    "jan", "feb", "mär", "apr", "mai", "jun",
    "jul", "aug", "sep", "okt", "nov", "dez",
    "mo", "di", "mi", "do", "fr", "sa", "so",
    "str", "pl", "weg", "co", "gmbh", "ag", "e.v",
    "bzw", "zzgl", "inkl", "bzgl", "ggü", "i.d.r",
    "u.a", "o.ä", "d.h", "z.t", "s.o", "s.u",
])


def _is_sentence_boundary(text: str, pos: int) -> bool:
    """Prüfe ob Position eine Satzgrenze ist (deutsch-aware)."""
    if pos >= len(text) - 1:
        return True

    char = text[pos]
    if char not in ".!?":
        return False

    # Nach dem Satzzeichen muss Leerzeichen + Großbuchstabe kommen
    after = text[pos + 1:pos + 4].lstrip()
    if not after or not after[0].isupper():
        return False

    # Prüfe ob vorher eine Abkürzung steht
    before = text[max(0, pos - 15):pos].lower()
    words = before.split()
    if words:
        last_word = words[-1].rstrip(".")
        if last_word in GERMAN_ABBREVIATIONS:
            return False

    # Prüfe auf Zahl vor dem Punkt (z.B. "3.5" oder "§ 12.")
    if before and before[-1].isdigit() and after and after[0].isdigit():
        return False

    return True


# ─────────────────────────────────────────────
# Chunk Datenstruktur
# ─────────────────────────────────────────────

@dataclass
class Chunk:
    """Ein einzelner Text-Chunk mit Metadaten."""
    id: str
    text: str
    index: int
    start_char: int
    end_char: int
    token_estimate: int
    source_document: Optional[str] = None
    section_title: Optional[str] = None
    content_hash: str = ""

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = hashlib.sha256(
                self.text.encode("utf-8")
            ).hexdigest()[:16]


# ─────────────────────────────────────────────
# Recursive Character Text Splitter
# ─────────────────────────────────────────────

# Separator-Hierarchie (deutsch-optimiert)
SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", " "]


def recursive_chunk(
    text: str,
    chunk_size: int = 2000,
    overlap: int = 400,
    source_document: Optional[str] = None,
) -> list[Chunk]:
    """
    Teile einen Text rekursiv in Chunks auf.

    Args:
        text: Der zu teilende Text
        chunk_size: Maximale Chunk-Größe in Zeichen (Default: 2000 ≈ 400-500 Tokens)
        overlap: Overlap in Zeichen (Default: 400 = 20% von 2000)
        source_document: Name des Quelldokuments

    Returns:
        Liste von Chunk-Objekten
    """
    chunks: list[Chunk] = []

    def _split_recursive(txt: str, start_char: int, sep_idx: int) -> None:
        # Text passt in einen Chunk
        if len(txt) <= chunk_size:
            stripped = txt.strip()
            if stripped:
                chunks.append(Chunk(
                    id=f"chunk_{len(chunks):04d}",
                    text=stripped,
                    index=len(chunks),
                    start_char=start_char,
                    end_char=start_char + len(txt),
                    token_estimate=len(stripped) // 4,  # ~4 chars/token für Deutsch
                    source_document=source_document,
                ))
            return

        # Keine Separatoren mehr → hart schneiden
        if sep_idx >= len(SEPARATORS):
            for i in range(0, len(txt), chunk_size - overlap):
                piece = txt[i:i + chunk_size]
                stripped = piece.strip()
                if stripped:
                    chunks.append(Chunk(
                        id=f"chunk_{len(chunks):04d}",
                        text=stripped,
                        index=len(chunks),
                        start_char=start_char + i,
                        end_char=start_char + i + len(piece),
                        token_estimate=len(stripped) // 4,
                        source_document=source_document,
                    ))
            return

        separator = SEPARATORS[sep_idx]
        parts = txt.split(separator)

        if len(parts) <= 1:
            # Separator nicht gefunden → nächsten versuchen
            _split_recursive(txt, start_char, sep_idx + 1)
            return

        # Teile zusammenfügen bis chunk_size erreicht
        current_chunk = ""
        current_start = start_char

        for part in parts:
            candidate = (current_chunk + separator + part) if current_chunk else part

            if len(candidate) > chunk_size and current_chunk:
                # Aktuellen Chunk speichern oder rekursiv weiter splitten
                if len(current_chunk) <= chunk_size:
                    stripped = current_chunk.strip()
                    if stripped:
                        chunks.append(Chunk(
                            id=f"chunk_{len(chunks):04d}",
                            text=stripped,
                            index=len(chunks),
                            start_char=current_start,
                            end_char=current_start + len(current_chunk),
                            token_estimate=len(stripped) // 4,
                            source_document=source_document,
                        ))
                else:
                    _split_recursive(current_chunk, current_start, sep_idx + 1)

                # Overlap: letzte N Zeichen des vorherigen Chunks mitnehmen
                overlap_text = current_chunk[-overlap:] if overlap > 0 else ""
                current_chunk = overlap_text + separator + part
                current_start = (
                    current_start + len(current_chunk)
                    - len(overlap_text) - len(separator) - len(part)
                )
            else:
                current_chunk = candidate

        # Rest verarbeiten
        if current_chunk.strip():
            if len(current_chunk) <= chunk_size:
                stripped = current_chunk.strip()
                chunks.append(Chunk(
                    id=f"chunk_{len(chunks):04d}",
                    text=stripped,
                    index=len(chunks),
                    start_char=current_start,
                    end_char=current_start + len(current_chunk),
                    token_estimate=len(stripped) // 4,
                    source_document=source_document,
                ))
            else:
                _split_recursive(current_chunk, current_start, sep_idx + 1)

    _split_recursive(text, 0, 0)

    # Section Titles extrahieren (Markdown-Header)
    for chunk in chunks:
        header_match = re.search(r"^#{1,3}\s+(.+)", chunk.text, re.MULTILINE)
        if header_match:
            chunk.section_title = header_match.group(1).strip()

    return chunks


# ─────────────────────────────────────────────
# PDF-Extraktion + Chunking Pipeline
# ─────────────────────────────────────────────

def chunk_document(
    text: str,
    filename: str,
    chunk_size: int = 2000,
    overlap: int = 400,
) -> list[Chunk]:
    """
    Vollständige Dokument-Chunking-Pipeline.

    1. Text bereinigen (mehrfache Leerzeilen, Seitenumbrüche)
    2. Recursive Chunking
    3. Section Titles extrahieren
    4. Content Hashes berechnen

    Args:
        text: Extrahierter Dokumenttext
        filename: Dateiname des Quelldokuments
        chunk_size: Maximale Chunk-Größe
        overlap: Overlap-Größe

    Returns:
        Liste von Chunks mit Metadaten
    """
    # Bereinigung
    cleaned = re.sub(r"\n{3,}", "\n\n", text)       # Max 2 Leerzeilen
    cleaned = re.sub(r"\f", "\n\n", cleaned)          # Seitenumbrüche → Absatz
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)      # Trailing Whitespace
    cleaned = re.sub(r"\n[ \t]+", "\n", cleaned)       # Leading Whitespace per Zeile
    cleaned = cleaned.strip()

    if not cleaned:
        return []

    return recursive_chunk(
        text=cleaned,
        chunk_size=chunk_size,
        overlap=overlap,
        source_document=filename,
    )
