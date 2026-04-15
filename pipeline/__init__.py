"""Jagdhandbuch Merschbach — Pipeline Module"""

from .chunking import recursive_chunk, chunk_document, Chunk
from .deduplication import cosine_similarity, deduplicate_facts, upsert_facts
