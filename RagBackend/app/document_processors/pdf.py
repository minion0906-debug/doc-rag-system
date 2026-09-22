"""
In-memory PDF extraction with pdfplumber (table detection) and pypdf fallback.
Zero disk I/O, zero external binary dependencies, 100% serverless safe.
"""

import io
from typing import List, Union
from langchain_core.documents import Document

from app.config import get_logger
from app.document_processors.base import format_table_as_markdown

logger = get_logger("askdoc.processors.pdf")


def extract_pdf_fallback(source: Union[str, bytes], filename: str) -> List[Document]:
    """Pure-Python pypdf fallback with zero external dependencies."""
    try:
        import pypdf
        raw_bytes = source if isinstance(source, bytes) else source.encode('utf-8') if isinstance(source, str) else b""
        if not raw_bytes:
            return []
        stream = io.BytesIO(raw_bytes)
        reader = pypdf.PdfReader(stream)
        documents = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                documents.append(Document(
                    page_content=text.strip(),
                    metadata={
                        "source": filename,
                        "title": filename,
                        "page": page_idx + 1,
                        "page_number": page_idx + 1
                    }
                ))
        logger.info(f"pypdf successfully extracted {len(documents)} pages from '{filename}'")
        return documents
    except Exception as e:
        logger.error(f"Fallback pypdf extraction failed for {filename}: {e}", exc_info=True)
        return []


def extract_pdf_pages_with_tables(source: Union[str, bytes], filename: str) -> List[Document]:
    """
    Extracts text and structured Markdown tables from PDF pages in-memory:
    1. Detects and inlines tables in structured Markdown format.
    2. Detects repeated headers/footers (>50% pages) and strips them.
    3. Seamlessly falls back to pure-Python pypdf if pdfplumber encounters any issues.
    """
    raw_bytes = source if isinstance(source, bytes) else source.encode('utf-8') if isinstance(source, str) else b""
    if not raw_bytes:
        return []

    raw_pages_data = []
    total_pages = 0

    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            total_pages = len(pdf.pages)
            for page_idx, page in enumerate(pdf.pages):
                page_num = page_idx + 1
                tables = []
                table_bboxes = []
                extracted_tables = []
                try:
                    tables = page.find_tables() or []
                    table_bboxes = [t.bbox for t in tables] if tables else []
                    extracted_tables = [t.extract() for t in tables] if tables else []
                except Exception as tbl_err:
                    logger.debug(f"Table detection skipped on page {page_num} of {filename}: {tbl_err}")

                page_text = ""
                try:
                    page_text = page.extract_text(layout=False) or ""
                except Exception as txt_err:
                    logger.debug(f"Text extraction notice on page {page_num} of {filename}: {txt_err}")

                if tables and extracted_tables:
                    md_tables = []
                    for tbl in extracted_tables:
                        md_tbl = format_table_as_markdown(tbl)
                        if md_tbl.strip():
                            md_tables.append(md_tbl)

                    if md_tables:
                        try:
                            non_table_text = page.filter(lambda obj: not any(
                                bbox[0] <= obj.get("x0", 0) <= bbox[2] and bbox[1] <= obj.get("top", 0) <= bbox[3]
                                for bbox in table_bboxes
                            )).extract_text() or ""
                        except Exception:
                            non_table_text = page_text

                        if non_table_text.strip():
                            combined_content = non_table_text.strip() + "\n\n" + "\n\n".join(md_tables)
                        else:
                            combined_content = "\n\n".join(md_tables)
                    else:
                        combined_content = page_text
                else:
                    combined_content = page_text

                if combined_content.strip():
                    raw_pages_data.append({
                        "page_num": page_num,
                        "content": combined_content
                    })
    except Exception as pdf_err:
        logger.warning(f"pdfplumber extraction error on '{filename}' ({pdf_err}), falling back to pypdf")
        return extract_pdf_fallback(raw_bytes, filename)

    if not raw_pages_data:
        return extract_pdf_fallback(raw_bytes, filename)

    # Strip repeated headers/footers (>50% of pages)
    if total_pages > 2:
        top_lines_count = {}
        bottom_lines_count = {}
        for p in raw_pages_data:
            lines = [l.strip() for l in p["content"].split("\n") if l.strip()]
            if lines:
                first_line = lines[0]
                top_lines_count[first_line] = top_lines_count.get(first_line, 0) + 1
                last_line = lines[-1]
                bottom_lines_count[last_line] = bottom_lines_count.get(last_line, 0) + 1

        threshold = total_pages * 0.5
        repeated_headers = {line for line, count in top_lines_count.items() if count > threshold and len(line) > 3}
        repeated_footers = {line for line, count in bottom_lines_count.items() if count > threshold and len(line) > 3}

        for p in raw_pages_data:
            lines = p["content"].split("\n")
            filtered_lines = []
            for idx, line in enumerate(lines):
                stripped = line.strip()
                if idx == 0 and stripped in repeated_headers:
                    continue
                if idx == len(lines) - 1 and stripped in repeated_footers:
                    continue
                filtered_lines.append(line)
            p["content"] = "\n".join(filtered_lines).strip()

    documents = []
    for p in raw_pages_data:
        if p["content"].strip():
            documents.append(Document(
                page_content=p["content"],
                metadata={
                    "source": filename,
                    "title": filename,
                    "page": p["page_num"],
                    "page_number": p["page_num"]
                }
            ))

    return documents if documents else extract_pdf_fallback(raw_bytes, filename)

