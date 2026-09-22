import io
import csv
from typing import List, Union
from langchain_core.documents import Document

from app.config import get_logger

logger = get_logger("askdoc.processors.csv")


def extract_csv_data(source: Union[str, bytes], filename: str) -> List[Document]:
    """
    Advanced structure-preserving CSV parser in-memory:
    1. Preserves original string formatting (currencies, percentages, codes with leading zeros).
    2. Detects multi-row headers and combines them into compound headers.
    3. Handles wide tables (> 15 columns) by noting truncation in metadata.
    4. Handles large datasets (> 500 rows) by batching 5-10 rows per chunk.
    5. Prepends filename and column context to all chunks.
    """
    raw_bytes = source if isinstance(source, bytes) else source.encode('utf-8') if isinstance(source, str) else b""
    if not raw_bytes:
        return []

    raw_rows = []
    
    # Try multiple standard encodings in-memory
    for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            text_content = raw_bytes.decode(enc, errors='replace')
            reader = csv.reader(io.StringIO(text_content))
            for row in reader:
                cleaned_row = [str(c).strip() for c in row]
                if any(c != "" for c in cleaned_row):
                    raw_rows.append(cleaned_row)
            if raw_rows:
                break
        except Exception:
            continue
            
    if not raw_rows:
        return []

    # 1. Multi-row header detection (e.g. Row 0 Category + Row 1 Subheader)
    is_multi_row_header = False
    if len(raw_rows) >= 3:
        row0_has_blanks = any(c == "" for c in raw_rows[0]) and any(c != "" for c in raw_rows[0])
        row0_non_empty = [c for c in raw_rows[0] if c]
        row1_non_empty = [c for c in raw_rows[1] if c]
        if row0_has_blanks and len(row1_non_empty) >= 2:
            non_num_count = sum(1 for c in row1_non_empty if not c.replace(",", "").replace(".", "").replace("$", "").replace("%", "").isdigit())
            if (non_num_count / len(row1_non_empty)) >= 0.7:
                is_multi_row_header = True

    if is_multi_row_header:
        filled_row0 = []
        last_cat = ""
        for c in raw_rows[0]:
            if c:
                last_cat = c
            filled_row0.append(last_cat)

        combined_headers = []
        for col_idx, (cat, sub) in enumerate(zip(filled_row0, raw_rows[1])):
            if cat and sub and cat != sub:
                combined_headers.append(f"{cat} - {sub}")
            else:
                combined_headers.append(sub or cat or f"Col_{col_idx+1}")
        data_rows = raw_rows[2:]
    else:
        combined_headers = [c if c else f"Col_{i+1}" for i, c in enumerate(raw_rows[0])]
        data_rows = raw_rows[1:]

    if not data_rows:
        return []

    # 2. Wide Table handling (> 15 columns)
    is_truncated = False
    col_limit = 15
    active_headers = combined_headers
    if len(combined_headers) > col_limit:
        is_truncated = True
        active_headers = combined_headers[:col_limit]

    col_names = ", ".join(active_headers)
    total_rows = len(data_rows)
    documents = []

    # 3. Large Dataset Batching (> 500 rows)
    if total_rows > 500:
        batch_size = 8
        for start_idx in range(0, total_rows, batch_size):
            batch_end = min(start_idx + batch_size, total_rows)
            batch_rows = data_rows[start_idx:batch_end]
            
            rows_text = []
            for row_offset, row in enumerate(batch_rows):
                row_num = start_idx + row_offset + 1
                row_cells = row[:len(active_headers)] if is_truncated else row
                row_pairs = [f"{col}: {val}" for col, val in zip(active_headers, row_cells) if val != ""]
                if row_pairs:
                    rows_text.append(f"[Row {row_num}] " + "; ".join(row_pairs))

            if rows_text:
                content = (
                    f"File: {filename}\n"
                    f"Columns: {col_names}\n"
                    f"Rows {start_idx + 1}-{batch_end} Data:\n" +
                    "\n".join(rows_text)
                )
                documents.append(Document(
                    page_content=content,
                    metadata={
                        "source": filename,
                        "title": filename,
                        "sheet": "CSV",
                        "row_start": start_idx + 1,
                        "row_end": batch_end,
                        "row": f"{start_idx + 1}-{batch_end}",
                        "total_rows": total_rows,
                        "is_truncated": is_truncated
                    }
                ))
    else:
        # Single-row precision for datasets <= 500 rows
        for row_idx, row in enumerate(data_rows):
            row_num = row_idx + 1
            row_cells = row[:len(active_headers)] if is_truncated else row
            row_pairs = [f"{col}: {val}" for col, val in zip(active_headers, row_cells) if val != ""]
            if row_pairs:
                row_str = "\n".join(row_pairs)
                content = f"File: {filename}\nColumns: {col_names}\nRow Data:\n{row_str}"
                documents.append(Document(
                    page_content=content,
                    metadata={
                        "source": filename,
                        "title": filename,
                        "sheet": "CSV",
                        "row": row_num,
                        "total_rows": total_rows,
                        "is_truncated": is_truncated
                    }
                ))

    return documents
