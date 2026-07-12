"""RAG store over the CDMO knowledge base (PRD §7.3).

The grounding documents are Word files (``knowledge_base/*.docx``). This store:
  * reads each .docx into ordered preview **blocks** (headings/paragraphs/tables)
    and section **chunks** for keyword retrieval,
  * tracks a per-document **version** (bumped when a new .docx is uploaded),
  * supports restricting retrieval to a caller-selected subset of documents.

Keyword TF scoring (no embeddings) keeps the deployed image light; the KB is
small enough that term scoring is sufficient and swappable later.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

from config import settings

_WORD = re.compile(r"[a-zA-Z][a-zA-Z0-9_]+")
_VERSIONS = settings.kb_dir / "_versions.json"


@dataclass
class Block:
    """One renderable unit of a Word doc for the preview."""
    type: str                       # heading1|heading2|heading3|para|bullet|meta|table
    text: str = ""
    rows: list[list[str]] = field(default_factory=list)   # for type == "table"


@dataclass
class Doc:
    id: str
    title: str
    version: int
    blocks: list[Block] = field(default_factory=list)
    sections: int = 0


@dataclass
class Chunk:
    doc: str            # document title (what the LLM cites)
    doc_id: str
    section: str
    text: str
    score: float = 0.0


def _tokens(s: str) -> list[str]:
    return [w.lower() for w in _WORD.findall(s)]


def _iter_blocks(document: Document):
    """Yield Paragraph / Table objects in true document order."""
    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, document)
        elif child.tag == qn("w:tbl"):
            yield Table(child, document)


def _heading_level(style_name: str) -> int:
    m = re.search(r"heading\s*(\d)", (style_name or "").lower())
    if m:
        return int(m.group(1))
    if (style_name or "").lower() == "title":
        return 1
    return 0


def _load_versions() -> dict[str, int]:
    if _VERSIONS.exists():
        try:
            return {k: int(v) for k, v in json.loads(_VERSIONS.read_text("utf-8")).items()}
        except Exception:
            return {}
    return {}


def _save_versions(v: dict[str, int]) -> None:
    _VERSIONS.write_text(json.dumps(v, indent=2), encoding="utf-8")


class KnowledgeStore:
    def __init__(self) -> None:
        self._chunks: list[Chunk] = []
        self._docs: dict[str, Doc] = {}
        self._versions: dict[str, int] = {}

    @property
    def ready(self) -> bool:
        return bool(self._chunks)

    # --- ingestion -----------------------------------------------------------

    def _parse_docx(self, path) -> tuple[Doc, list[Chunk]]:
        doc_id = path.stem
        version = self._versions.get(doc_id, 1)
        document = Document(str(path))

        title = doc_id
        title_set = False
        blocks: list[Block] = []
        chunks: list[Chunk] = []

        section = "(intro)"
        buf: list[str] = []
        sections = 0

        def flush() -> None:
            body = "\n".join(buf).strip()
            if body:
                chunks.append(Chunk(doc=title, doc_id=doc_id, section=section, text=body))

        for item in _iter_blocks(document):
            if isinstance(item, Table):
                rows = [[c.text.strip() for c in row.cells] for row in item.rows]
                blocks.append(Block(type="table", rows=rows))
                buf.extend(" | ".join(r) for r in rows)   # table text for search / quoting
                continue

            text = item.text.strip()
            if not text:
                continue
            level = _heading_level(item.style.name if item.style else "")
            is_meta = bool(item.runs) and item.runs[0].italic and level == 0

            if level == 1:
                flush()
                if not title_set:
                    title = text
                    title_set = True
                section = "(intro)"
                buf = []
                blocks.append(Block(type="heading1", text=text))
            elif level in (2, 3):
                flush()
                section = text
                sections += 1
                buf = [text]
                blocks.append(Block(type=f"heading{level}", text=text))
            elif is_meta:
                blocks.append(Block(type="meta", text=text))
                buf.append(text)
            else:
                style = (item.style.name if item.style else "") or ""
                btype = "bullet" if "list" in style.lower() else "para"
                blocks.append(Block(type=btype, text=text))
                buf.append(text)
        flush()

        return Doc(id=doc_id, title=title, version=version, blocks=blocks, sections=sections), chunks

    def ingest(self) -> int:
        self._versions = _load_versions()
        self._chunks = []
        self._docs = {}
        for path in sorted(settings.kb_dir.glob("*.docx")):
            if path.stem.startswith("_") or path.stem == "build_docx":
                continue
            doc, chunks = self._parse_docx(path)
            self._docs[doc.id] = doc
            self._chunks.extend(chunks)
        return len(self._chunks)

    def _ensure(self) -> None:
        if not self._chunks:
            self.ingest()

    # --- retrieval -----------------------------------------------------------

    def search(self, query: str, k: int = 5, allowed_ids: list[str] | None = None) -> list[Chunk]:
        self._ensure()
        q = _tokens(query)
        if not q:
            return []
        allow = set(allowed_ids) if allowed_ids else None
        scored: list[Chunk] = []
        for c in self._chunks:
            if allow is not None and c.doc_id not in allow:
                continue
            toks = _tokens(c.doc + " " + c.section + " " + c.text)
            if not toks:
                continue
            counts: dict[str, int] = {}
            for t in toks:
                counts[t] = counts.get(t, 0) + 1
            score = sum(counts.get(t, 0) for t in q)
            score += 2 * sum(1 for t in q if t in _tokens(c.section))
            if score > 0:
                scored.append(Chunk(c.doc, c.doc_id, c.section, c.text, float(score)))
        scored.sort(key=lambda c: c.score, reverse=True)
        return scored[:k]

    # --- document management (MSAT settings) ---------------------------------

    def list_docs(self) -> list[dict]:
        self._ensure()
        return [
            {"id": d.id, "title": d.title, "version": d.version, "sections": d.sections}
            for d in self._docs.values()
        ]

    def get_doc(self, doc_id: str) -> dict | None:
        self._ensure()
        d = self._docs.get(doc_id)
        if not d:
            return None
        return {
            "id": d.id,
            "title": d.title,
            "version": d.version,
            "blocks": [{"type": b.type, "text": b.text, "rows": b.rows} for b in d.blocks],
        }

    def resolve_id(self, name: str) -> str | None:
        """Map a cited title (or id) back to a doc id, tolerantly."""
        self._ensure()
        if name in self._docs:
            return name
        n = re.sub(r"[^a-z0-9]", "", name.lower())
        best: str | None = None
        for d in self._docs.values():
            for cand in (d.id, d.title):
                c = re.sub(r"[^a-z0-9]", "", cand.lower())
                if c and (c in n or n in c) and (best is None or len(cand) < len(best)):
                    best = d.id
        return best

    def add_version(self, doc_id: str, filename: str, data: bytes) -> dict:
        """Save an uploaded .docx as the new current version of `doc_id`, bump version."""
        self._ensure()
        if not filename.lower().endswith(".docx"):
            raise ValueError("only .docx files are accepted")
        target = settings.kb_dir / f"{doc_id}.docx"
        if doc_id not in self._docs:
            # new document: derive a fresh id from the filename
            doc_id = re.sub(r"[^a-zA-Z0-9_]+", "_", filename.rsplit(".", 1)[0]).strip("_") or "doc"
            target = settings.kb_dir / f"{doc_id}.docx"
        self._versions = _load_versions()
        new_version = self._versions.get(doc_id, 0) + 1
        target.write_bytes(data)
        self._versions[doc_id] = new_version
        _save_versions(self._versions)
        self.ingest()   # re-read everything so blocks/chunks reflect the upload
        return {"id": doc_id, "version": new_version}


store = KnowledgeStore()
