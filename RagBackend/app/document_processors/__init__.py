"""
Document format extractors for PDF, DOCX, PPTX, XLSX, and CSV.
"""

from app.document_processors.base import format_table_as_markdown
from app.document_processors.pdf import extract_pdf_pages_with_tables
from app.document_processors.docx import extract_docx_with_structure
from app.document_processors.pptx import extract_pptx_slides
from app.document_processors.xlsx import extract_xlsx_sheets
from app.document_processors.csv_parser import extract_csv_data

__all__ = [
    "format_table_as_markdown",
    "extract_pdf_pages_with_tables",
    "extract_docx_with_structure",
    "extract_pptx_slides",
    "extract_xlsx_sheets",
    "extract_csv_data",
]
