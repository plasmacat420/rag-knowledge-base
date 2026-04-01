from typing import Optional

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    chunk_count: int
    uploaded_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class QueryRequest(BaseModel):
    question: str
    document_ids: Optional[list[str]] = None


class SourceChunk(BaseModel):
    content: str
    document_id: str
    filename: str
    chunk_index: int
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    question: str
