import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from loguru import logger

from app.config import settings
from app.models import DocumentListResponse, DocumentResponse
from app.services.embeddings import process_document
from app.services.vectorstore import vectorstore

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"File type '{suffix}' not allowed. Use .pdf or .txt",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=422,
            detail="File too large. Maximum size is 10MB.",
        )

    document_id = str(uuid.uuid4())
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{document_id}{suffix}"
    file_path.write_bytes(content)

    uploaded_at = datetime.now(timezone.utc).isoformat()

    try:
        chunk_count = await process_document(
            file_path=file_path,
            document_id=document_id,
            filename=file.filename,
            uploaded_at=uploaded_at,
        )
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        logger.error(f"Failed to process document: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(exc)}",
        )

    return DocumentResponse(
        id=document_id,
        filename=file.filename,
        chunk_count=chunk_count,
        uploaded_at=uploaded_at,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    docs = await vectorstore.list_documents()
    return DocumentListResponse(
        documents=[DocumentResponse(**d) for d in docs],
        total=len(docs),
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str):
    deleted = await vectorstore.delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    upload_dir = Path(settings.UPLOAD_DIR)
    for ext in ALLOWED_EXTENSIONS:
        file_path = upload_dir / f"{document_id}{ext}"
        file_path.unlink(missing_ok=True)

    return None
