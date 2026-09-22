"""
Shared utilities for document extraction: Markdown table formatting.
"""

from typing import List, Any


def format_table_as_markdown(table: List[List[Any]]) -> str:
    """
    Converts a 2D list of table cells into a clean GitHub-flavored Markdown table.
    Cleans up newlines inside cells and ensures aligned header separators.
    """
    if not table or not any(table):
        return ""
    
    # Filter out completely empty rows
    cleaned_rows = []
    for row in table:
        if not row:
            continue
        cleaned_row = [str(cell).replace("\n", " ").strip() if cell is not None else "" for cell in row]
        if any(cleaned_row):
            cleaned_rows.append(cleaned_row)
            
    if not cleaned_rows:
        return ""
        
    num_cols = max(len(r) for r in cleaned_rows)
    # Normalize row lengths
    normalized_rows = [r + [""] * (num_cols - len(r)) for r in cleaned_rows]
    
    header = normalized_rows[0]
    separator = [":---"] * num_cols
    
    md_lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(separator) + " |"
    ]
    
    for row in normalized_rows[1:]:
        md_lines.append("| " + " | ".join(row) + " |")
        
    return "\n" + "\n".join(md_lines) + "\n"
