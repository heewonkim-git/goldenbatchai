"""RAG store over the CDMO knowledge base (PRD §7.3).

M3: section-chunked (H2/H3) keyword retrieval over knowledge_base/*.md. No
embedding deps — the KB is small, so TF-style term scoring is enough and keeps
the deployed image light. Swappable for embeddings later without touching MSAT.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from config import settings

_WORD = re.compile(r"[a-zA-Z][a-zA-Z0-9_]+")
_HEADING = re.compile(r"^(#{1,3})\s+(.*)")


@dataclass
class Chunk:
    doc: str
    section: str
    text: str
    score: float = 0.0


def _tokens(s: str) -> list[str]:
    return [w.lower() for w in _WORD.findall(s)]


class KnowledgeStore:
    def __init__(self) -> None:
        self._chunks: list[Chunk] = []

    @property
    def ready(self) -> bool:
        return bool(self._chunks)

    def ingest(self) -> int:
        """Chunk every knowledge_base/*.md by H1(title) / H2-H3(section)."""
        self._chunks = []
        for path in sorted(settings.kb_dir.glob("*.md")):
            if path.name.lower() == "readme.md":
                continue
            title = path.stem
            section = "(intro)"
            buf: list[str] = []

            def flush() -> None:
                body = "\n".join(buf).strip()
                if body:
                    self._chunks.append(Chunk(doc=title, section=section, text=body))

            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
                m = _HEADING.match(line)
                if not m:
                    buf.append(line)
                    continue
                level, heading = len(m.group(1)), m.group(2).strip()
                if level == 1:
                    flush()
                    title = heading
                    buf = []
                    section = "(intro)"
                else:  # H2 / H3 start a new chunk
                    flush()
                    section = heading
                    buf = [line]
            flush()
        return len(self._chunks)

    def search(self, query: str, k: int = 5) -> list[Chunk]:
        if not self._chunks:
            self.ingest()
        q = _tokens(query)
        if not q:
            return []
        scored: list[Chunk] = []
        for c in self._chunks:
            toks = _tokens(c.doc + " " + c.section + " " + c.text)
            if not toks:
                continue
            counts = {}
            for t in toks:
                counts[t] = counts.get(t, 0) + 1
            score = sum(counts.get(t, 0) for t in q)
            # small bonus for query terms appearing in the section heading
            score += 2 * sum(1 for t in q if t in _tokens(c.section))
            if score > 0:
                scored.append(Chunk(c.doc, c.section, c.text, float(score)))
        scored.sort(key=lambda c: c.score, reverse=True)
        return scored[:k]


store = KnowledgeStore()
