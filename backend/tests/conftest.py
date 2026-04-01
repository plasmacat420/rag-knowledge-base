from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app


@pytest.fixture
def temp_dirs(tmp_path):
    upload_dir = tmp_path / "uploads"
    chroma_dir = tmp_path / "chroma_db"
    upload_dir.mkdir()
    chroma_dir.mkdir()
    return upload_dir, chroma_dir


@pytest.fixture
def mock_vectorstore():
    with patch("app.routers.documents.vectorstore") as mock_vs, \
         patch("app.services.embeddings.vectorstore") as mock_vs2:
        mock_vs.add_documents = AsyncMock(return_value=5)
        mock_vs.list_documents = AsyncMock(return_value=[])
        mock_vs.delete_document = AsyncMock(return_value=True)
        mock_vs.get_document_chunk_count = AsyncMock(return_value=5)
        mock_vs2.add_documents = AsyncMock(return_value=5)
        yield mock_vs


@pytest.fixture
def mock_embeddings():
    with patch("app.services.embeddings.PyPDFLoader") as mock_pdf, \
         patch("app.services.embeddings.TextLoader") as mock_txt:
        mock_doc = MagicMock()
        mock_doc.page_content = "Test content"
        mock_doc.metadata = {}
        mock_pdf.return_value.load.return_value = [mock_doc]
        mock_txt.return_value.load.return_value = [mock_doc]
        yield mock_pdf, mock_txt


@pytest.fixture
async def client(temp_dirs, mock_vectorstore, mock_embeddings):
    upload_dir, chroma_dir = temp_dirs
    settings.UPLOAD_DIR = str(upload_dir)
    settings.CHROMA_PERSIST_DIR = str(chroma_dir)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
