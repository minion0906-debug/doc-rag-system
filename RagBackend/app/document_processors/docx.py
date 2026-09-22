"""
In-memory DOCX extraction with heading hierarchy and inline table support.
Zero disk I/O, zero external binary dependencies.
"""

import io
from typing import List, Union
from langchain_core.documents import Document

from app.config import get_logger
from app.document_processors.base import format_table_as_markdown

logger = get_logger("askdoc.processors.docx")


def extract_docx_with_structure(source: Union[str, bytes], filename: str) -> List[Document]:
    """
    Walks a DOCX document in sequential element order in-memory:
    1. Converts Heading 1/2/3 styles to Markdown # / ## / ### headers inline.
    2. Converts tables to inlined Markdown tables in their exact document position.
    3. Tracks a running heading_path stack and attaches it to section Documents.
    4. Falls back gracefully to docx2txt in-memory if needed.
    """
    raw_bytes = source if isinstance(source, bytes) else source.encode('utf-8') if isinstance(source, str) else b""
    if not raw_bytes:
        return []

    try:
        import docx
        from docx.text.paragraph import Paragraph as DocxParagraph
        from docx.table import Table as DocxTable
    except ImportError:
        logger.warning("python-docx not available, attempting fallback")
        return _fallback_docx(raw_bytes, filename)

    try:
        doc = docx.Document(io.BytesIO(raw_bytes))
    except Exception as e:
        logger.warning(f"Error opening docx in-memory ({e}), attempting fallback")
        return _fallback_docx(raw_bytes, filename)

    documents = []
    current_section_lines = []
    heading_stack = []

    def get_heading_path():
        return " > ".join([title for _, title in heading_stack]) if heading_stack else ""

    def flush_section():
        if current_section_lines:
            content = "\n".join(current_section_lines).strip()
            if content:
                path = get_heading_path()
                documents.append(Document(
                    page_content=content,
                    metadata={
                        "source": filename,
                        "title": filename,
                        "heading_path": path,
                        "section": path
                    }
                ))
            current_section_lines.clear()

    # Iterate over all child elements of the document body in order
    for child in doc.element.body:
        if child.tag.endswith('p'):
            p = DocxParagraph(child, doc)
            text = p.text.strip()
            if not text:
                continue

            style_name = (p.style.name if p.style and p.style.name else "").lower()
            
            # Detect heading levels
            if "heading 1" in style_name or style_name == "title":
                flush_section()
                heading_stack = [(1, text)]
                current_section_lines.append(f"# {text}\n")
            elif "heading 2" in style_name or style_name == "subtitle":
                flush_section()
                heading_stack = [(lvl, t) for lvl, t in heading_stack if lvl < 2]
                heading_stack.append((2, text))
                current_section_lines.append(f"## {text}\n")
            elif "heading 3" in style_name:
                flush_section()
                heading_stack = [(lvl, t) for lvl, t in heading_stack if lvl < 3]
                heading_stack.append((3, text))
                current_section_lines.append(f"### {text}\n")
            elif "heading 4" in style_name:
                flush_section()
                heading_stack = [(lvl, t) for lvl, t in heading_stack if lvl < 4]
                heading_stack.append((4, text))
                current_section_lines.append(f"#### {text}\n")
            else:
                current_section_lines.append(text)

        elif child.tag.endswith('tbl'):
            tbl = DocxTable(child, doc)
            table_data = []
            for row in tbl.rows:
                row_cells = [cell.text.strip() for cell in row.cells]
                if any(row_cells):
                    table_data.append(row_cells)
                    
            if table_data:
                md_table = format_table_as_markdown(table_data)
                if md_table.strip():
                    current_section_lines.append(md_table)

    flush_section()

    if not documents:
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        if full_text.strip():
            documents.append(Document(
                page_content=full_text.strip(),
                metadata={"source": filename, "title": filename, "heading_path": "", "section": ""}
            ))

    return documents if documents else _fallback_docx(raw_bytes, filename)


def _fallback_docx(raw_bytes: bytes, filename: str) -> List[Document]:
    """Pure-Python docx2txt fallback extraction in-memory."""
    try:
        import docx2txt
        text = docx2txt.process(io.BytesIO(raw_bytes)) or ""
        if text.strip():
            return [Document(
                page_content=text.strip(),
                metadata={"source": filename, "title": filename, "heading_path": "", "section": ""}
            )]
    except Exception as e:
        logger.error(f"docx2txt fallback failed for {filename}: {e}")
    return []

