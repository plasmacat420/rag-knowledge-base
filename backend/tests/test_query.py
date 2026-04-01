from unittest.mock import patch

import pytest


async def mock_answer_generator(*args, **kwargs):
    yield 'data: {"token": "Hello"}\n\n'
    yield 'data: {"token": " world"}\n\n'
    yield 'data: {"sources": [], "done": true}\n\n'


async def mock_empty_generator(*args, **kwargs):
    no_docs = "No relevant documents found. Please upload documents first."
    yield f'data: {{"token": "{no_docs}"}}\n\n'
    yield 'data: {"sources": [], "done": true}\n\n'


@pytest.mark.asyncio
async def test_query_streams(client):
    with patch("app.routers.query.answer_question", side_effect=mock_answer_generator):
        response = await client.post(
            "/api/query",
            json={"question": "What is in the document?"},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    body = response.text
    assert "Hello" in body
    assert "world" in body
    assert "done" in body


@pytest.mark.asyncio
async def test_query_empty_kb(client):
    with patch("app.routers.query.answer_question", side_effect=mock_empty_generator):
        response = await client.post(
            "/api/query",
            json={"question": "What is the meaning of life?"},
        )
    assert response.status_code == 200
    body = response.text
    assert "No relevant documents found" in body


@pytest.mark.asyncio
async def test_query_with_document_filter(client):
    with patch("app.routers.query.answer_question", side_effect=mock_answer_generator):
        response = await client.post(
            "/api/query",
            json={
                "question": "What does it say?",
                "document_ids": ["doc-uuid-123"],
            },
        )
    assert response.status_code == 200
