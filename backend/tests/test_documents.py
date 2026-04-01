import io
from unittest.mock import AsyncMock

import pytest


@pytest.mark.asyncio
async def test_upload_txt(client):
    content = b"This is a test document with some content."
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    response = await client.post("/api/documents/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "test.txt"
    assert data["chunk_count"] >= 0


@pytest.mark.asyncio
async def test_upload_invalid_type(client):
    content = b"fake exe content"
    files = {"file": ("malware.exe", io.BytesIO(content), "application/octet-stream")}
    response = await client.post("/api/documents/upload", files=files)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_documents_empty(client, mock_vectorstore):
    mock_vectorstore.list_documents = AsyncMock(return_value=[])
    response = await client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["documents"] == []


@pytest.mark.asyncio
async def test_list_documents_after_upload(client, mock_vectorstore):
    from datetime import datetime, timezone
    mock_vectorstore.list_documents = AsyncMock(
        return_value=[
            {
                "id": "doc1",
                "filename": "file1.txt",
                "chunk_count": 3,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "doc2",
                "filename": "file2.txt",
                "chunk_count": 5,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
    )
    response = await client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_delete_document(client, mock_vectorstore):
    mock_vectorstore.delete_document = AsyncMock(return_value=True)
    response = await client.delete("/api/documents/some-doc-id")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_document(client, mock_vectorstore):
    mock_vectorstore.delete_document = AsyncMock(return_value=False)
    response = await client.delete("/api/documents/nonexistent-id")
    assert response.status_code == 404
