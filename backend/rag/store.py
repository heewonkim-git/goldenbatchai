"""RAG store over the CDMO knowledge base (PRD §7.3).

M0: placeholder in-memory keyword search so MSAT wiring has something to call.
M3 replaces ``search`` with section-chunked retrieval (BM25 or embeddings).
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Chunk:
    doc: str
    section: str
    text: str
    score: float = 0.0


class KnowledgeStore:
    def __init__(self) -> None:
        self._chunks: list[Chunk] = []

    def ingest_placeholder(self) -> None:
        """M3 will chunk knowledge_base/*.md by H2/H3 headings."""
        self._chunks = []

    def search(self, query: str, k: int = 4) -> list[Chunk]:
        # Naive substring match for M0; returns nothing until KB is ingested.
        q = query.lower()
        hits = [c for c in self._chunks if q in c.text.lower()]
        return hits[:k]


store = KnowledgeStore()
