/**
 * Jagdhandbuch Merschbach — Pipeline Chunking Engine
 * 
 * Recursive Character Splitting für deutschsprachige Fachtexte
 * 
 * Best Practice 2025/2026 (Weaviate/Firecrawl):
 * - 400-512 Tokens (~2.000 Zeichen für Deutsch) pro Chunk
 * - 10-20% Overlap (200-400 Zeichen)
 * - Separator-Hierarchie: Absatz → Zeilenumbruch → Satz → Wort
 * 
 * Löst das 12.000-Zeichen-Problem: Statt 1 großen Chunk → 6+ kleine Chunks
 */

import * as stringSimilarity from 'string-similarity';

/**
 * Ein einzelner Chunk mit Metadaten
 */
export interface Chunk {
  id: string;
  text: string;
  index: number;
  start_char: number;
  end_char: number;
  token_estimate: number;
  source_document?: string;
  section_title?: string;
}

/**
 * Deduplizierungsergebnis
 */
export interface DeduplicationResult {
  original_count: number;
  deduplicated_count: number;
  removed_count: number;
  removed_facts: { fact: string; similar_to: string; similarity: number }[];
}

/**
 * Deutsche Satzgrenzen-Erkennung
 * Berücksichtigt: Abkürzungen (z.B., Nr., Abs., etc.), Zahlen, Aufzählungen
 */
const GERMAN_ABBREVIATIONS = new Set([
  'z.b', 'bzw', 'etc', 'usw', 'vgl', 'ggf', 'evtl', 'ca',
  'nr', 'abs', 'art', 'gem', 'lit', 'sog', 'inkl', 'exkl',
  'dr', 'prof', 'dipl', 'ing', 'min', 'max', 'std',
  'ha', 'km', 'kg', 'mg', 'ml', 'cm', 'mm',
  'jan', 'feb', 'mär', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez',
  'mo', 'di', 'mi', 'do', 'fr', 'sa', 'so',
  'str', 'pl', 'weg',
]);

function isSentenceBoundary(text: string, pos: number): boolean {
  if (pos >= text.length - 1) return true;
  
  const char = text[pos];
  if (char !== '.' && char !== '!' && char !== '?') return false;
  
  // Nach dem Punkt muss ein Leerzeichen und Großbuchstabe kommen
  const after = text.slice(pos + 1, pos + 3).trimStart();
  if (after.length === 0) return true;
  if (after[0] !== after[0].toUpperCase()) return false;
  
  // Prüfe ob vorher eine Abkürzung steht
  const before = text.slice(Math.max(0, pos - 10), pos).toLowerCase();
  const lastWord = before.split(/\s+/).pop() || '';
  if (GERMAN_ABBREVIATIONS.has(lastWord.replace(/\.$/, ''))) return false;
  
  // Prüfe auf Zahl vor dem Punkt (z.B. "3.5" oder "§ 12.")
  if (/\d$/.test(before) && /^\d/.test(after)) return false;
  
  return true;
}

/**
 * Teile Text an Satzgrenzen
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  
  for (let i = 0; i < text.length; i++) {
    if (isSentenceBoundary(text, i)) {
      const sentence = text.slice(start, i + 1).trim();
      if (sentence.length > 0) sentences.push(sentence);
      start = i + 1;
    }
  }
  
  // Rest
  const rest = text.slice(start).trim();
  if (rest.length > 0) sentences.push(rest);
  
  return sentences;
}

/**
 * Recursive Character Text Splitter für deutsche Fachtexte
 * 
 * Separator-Hierarchie (deutsch-optimiert):
 * 1. Doppelter Zeilenumbruch (Absatz)
 * 2. Einfacher Zeilenumbruch
 * 3. Satzende (. ! ?)
 * 4. Semikolon/Doppelpunkt
 * 5. Leerzeichen
 */
export function recursiveChunk(
  text: string,
  options: {
    /** Maximale Chunk-Größe in Zeichen (Default: 2000 ≈ 400-500 Tokens) */
    chunkSize?: number;
    /** Overlap in Zeichen (Default: 400 = 20% von 2000) */
    overlap?: number;
    /** Quell-Dokument Name */
    sourceDocument?: string;
  } = {}
): Chunk[] {
  const {
    chunkSize = 2000,
    overlap = 400,
    sourceDocument,
  } = options;
  
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ': ', ' '];
  
  const chunks: Chunk[] = [];
  
  function splitRecursive(text: string, startChar: number, separatorIdx: number): void {
    // Wenn Text klein genug → direkt als Chunk
    if (text.length <= chunkSize) {
      if (text.trim().length > 0) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          text: text.trim(),
          index: chunks.length,
          start_char: startChar,
          end_char: startChar + text.length,
          token_estimate: Math.ceil(text.length / 4.5), // ~4.5 chars/token für Deutsch
          source_document: sourceDocument,
        });
      }
      return;
    }
    
    // Kein Separator mehr → hart schneiden
    if (separatorIdx >= separators.length) {
      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        const chunk = text.slice(i, i + chunkSize);
        if (chunk.trim().length > 0) {
          chunks.push({
            id: `chunk_${chunks.length}`,
            text: chunk.trim(),
            index: chunks.length,
            start_char: startChar + i,
            end_char: startChar + i + chunk.length,
            token_estimate: Math.ceil(chunk.length / 4.5),
            source_document: sourceDocument,
          });
        }
      }
      return;
    }
    
    // Versuche mit aktuellem Separator zu splitten
    const separator = separators[separatorIdx];
    const parts = text.split(separator);
    
    if (parts.length <= 1) {
      // Separator nicht gefunden → nächsten versuchen
      splitRecursive(text, startChar, separatorIdx + 1);
      return;
    }
    
    // Teile zusammenfügen bis chunkSize erreicht
    let currentChunk = '';
    let currentStart = startChar;
    
    for (const part of parts) {
      const candidate = currentChunk.length > 0 
        ? currentChunk + separator + part 
        : part;
      
      if (candidate.length > chunkSize && currentChunk.length > 0) {
        // Aktuellen Chunk speichern
        if (currentChunk.length <= chunkSize) {
          chunks.push({
            id: `chunk_${chunks.length}`,
            text: currentChunk.trim(),
            index: chunks.length,
            start_char: currentStart,
            end_char: currentStart + currentChunk.length,
            token_estimate: Math.ceil(currentChunk.length / 4.5),
            source_document: sourceDocument,
          });
        } else {
          // Zu groß → rekursiv mit nächstem Separator
          splitRecursive(currentChunk, currentStart, separatorIdx + 1);
        }
        
        // Overlap: Die letzten N Zeichen des vorherigen Chunks mitnehmen
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + separator + part;
        currentStart = currentStart + currentChunk.length - overlap - separator.length - part.length;
      } else {
        currentChunk = candidate;
      }
    }
    
    // Rest verarbeiten
    if (currentChunk.trim().length > 0) {
      if (currentChunk.length <= chunkSize) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          text: currentChunk.trim(),
          index: chunks.length,
          start_char: currentStart,
          end_char: currentStart + currentChunk.length,
          token_estimate: Math.ceil(currentChunk.length / 4.5),
          source_document: sourceDocument,
        });
      } else {
        splitRecursive(currentChunk, currentStart, separatorIdx + 1);
      }
    }
  }
  
  splitRecursive(text, 0, 0);
  
  // Section Titles extrahieren (Markdown-Header)
  for (const chunk of chunks) {
    const headerMatch = chunk.text.match(/^#{1,3}\s+(.+)/m);
    if (headerMatch) {
      chunk.section_title = headerMatch[1].trim();
    }
  }
  
  return chunks;
}

/**
 * Fakt-Deduplizierung via String-Similarity
 * 
 * Threshold: 0.92 (Cosine Similarity)
 * Bei Überschreitung: Längeren Fakt behalten, kürzeren verwerfen
 */
export function deduplicateFacts(
  facts: string[],
  threshold: number = 0.92
): DeduplicationResult {
  const kept: string[] = [];
  const removed: { fact: string; similar_to: string; similarity: number }[] = [];
  
  for (const fact of facts) {
    let isDuplicate = false;
    
    for (const existing of kept) {
      const similarity = stringSimilarity.compareTwoStrings(
        fact.toLowerCase().trim(),
        existing.toLowerCase().trim()
      );
      
      if (similarity >= threshold) {
        isDuplicate = true;
        removed.push({ fact, similar_to: existing, similarity });
        
        // Wenn der neue Fakt länger ist, ersetze den bestehenden
        if (fact.length > existing.length) {
          const idx = kept.indexOf(existing);
          kept[idx] = fact;
          removed[removed.length - 1].similar_to = fact;
          removed[removed.length - 1].fact = existing;
        }
        break;
      }
    }
    
    if (!isDuplicate) {
      kept.push(fact);
    }
  }
  
  return {
    original_count: facts.length,
    deduplicated_count: kept.length,
    removed_count: removed.length,
    removed_facts: removed,
  };
}
