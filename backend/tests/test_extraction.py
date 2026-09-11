"""
Tests for app/extraction.py only.

Like test_schemas.py, deliberately does NOT import app.main / app.tasks /
app.agents -- see that file's docstring for why (Langfuse Strict Mode at
import time). extraction.py was specifically pulled out of main.py so this
logic could be unit-tested without secrets/network.
"""
import io

import docx
from pypdf import PdfWriter

from app.extraction import count_pages, extract_text_from_content


def _pdf_bytes(num_pages: int) -> bytes:
    writer = PdfWriter()
    for _ in range(num_pages):
        writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _docx_bytes(paragraphs: list[str], page_break_after: int | None = None) -> bytes:
    doc = docx.Document()
    for i, p in enumerate(paragraphs):
        doc.add_paragraph(p)
        if page_break_after == i:
            doc.add_page_break()
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# --- count_pages ---

def test_count_pages_single_page_pdf():
    assert count_pages("resume.pdf", _pdf_bytes(1)) == 1


def test_count_pages_multi_page_pdf():
    assert count_pages("resume.pdf", _pdf_bytes(3)) == 3


def test_count_pages_docx_with_explicit_break():
    content = _docx_bytes(["Page one", "Page two"], page_break_after=0)
    assert count_pages("resume.docx", content) == 2


def test_count_pages_docx_without_break():
    content = _docx_bytes(["Just one page, no break"])
    assert count_pages("resume.docx", content) == 1


def test_count_pages_txt_is_unenforced():
    assert count_pages("resume.txt", b"hello world") is None


def test_count_pages_garbage_bytes_returns_none_not_raise():
    assert count_pages("resume.pdf", b"not a real pdf") is None


# --- extract_text_from_content ---

def test_extract_text_from_txt():
    assert extract_text_from_content("resume.txt", b"Hello, resume!") == "Hello, resume!"


def test_extract_text_from_docx():
    content = _docx_bytes(["John Smith", "Software Engineer"])
    text = extract_text_from_content("resume.docx", content)
    assert "John Smith" in text
    assert "Software Engineer" in text


def test_extract_text_from_blank_pdf_is_empty():
    # A blank page has no text layer at all -- this is exactly the case
    # main.py's OCR fallback exists for. main.py itself checks
    # resume_text.strip(), not exact equality to "" (a page with zero
    # extractable text still contributes a trailing "\n" per page), so
    # that's what actually matters here too.
    assert extract_text_from_content("resume.pdf", _pdf_bytes(1)).strip() == ""


def test_extract_text_unsupported_extension_returns_empty_string():
    assert extract_text_from_content("resume.exe", b"whatever") == ""


def test_extract_text_garbage_bytes_returns_empty_string_not_raise():
    assert extract_text_from_content("resume.pdf", b"not a real pdf") == ""
