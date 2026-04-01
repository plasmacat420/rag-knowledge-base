from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger

from app.config import settings
from app.services.vectorstore import vectorstore


async def process_document(
    file_path: Path,
    document_id: str,
    filename: str,
    uploaded_at: str,
) -> int:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        loader = TextLoader(str(file_path), encoding="utf-8")

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(documents)

    for i, chunk in enumerate(chunks):
        chunk.metadata.update(
            {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": i,
                "uploaded_at": uploaded_at,
            }
        )

    logger.info(f"Created {len(chunks)} chunks from {filename}")
    count = await vectorstore.add_documents(chunks, document_id)
    return count
