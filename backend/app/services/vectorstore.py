from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_openai import OpenAIEmbeddings
from loguru import logger

from app.config import settings
from app.models import SourceChunk


class VectorStore:
    def __init__(self):
        self._client = None
        self._collection = None
        self._embeddings = None

    def _get_client(self):
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def _get_collection(self):
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def _get_embeddings(self):
        if self._embeddings is None:
            self._embeddings = OpenAIEmbeddings(
                api_key=settings.OPENAI_API_KEY
            )
        return self._embeddings

    async def add_documents(self, chunks: list, document_id: str) -> int:
        collection = self._get_collection()
        embeddings_model = self._get_embeddings()

        texts = [chunk.page_content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

        vectors = embeddings_model.embed_documents(texts)

        collection.add(
            embeddings=vectors,
            documents=texts,
            metadatas=metadatas,
            ids=ids,
        )

        logger.info(f"Added {len(chunks)} chunks for document {document_id}")
        return len(chunks)

    async def search(
        self,
        query: str,
        document_ids: Optional[list[str]],
        k: int,
    ) -> list[SourceChunk]:
        collection = self._get_collection()
        embeddings_model = self._get_embeddings()

        query_vector = embeddings_model.embed_query(query)

        where = None
        if document_ids:
            if len(document_ids) == 1:
                where = {"document_id": document_ids[0]}
            else:
                where = {"document_id": {"$in": document_ids}}

        kwargs = {
            "query_embeddings": [query_vector],
            "n_results": min(k, max(collection.count(), 1)),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        results = collection.query(**kwargs)

        sources = []
        if results["documents"] and results["documents"][0]:
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                score = 1 - dist
                sources.append(
                    SourceChunk(
                        content=doc,
                        document_id=meta.get("document_id", ""),
                        filename=meta.get("filename", ""),
                        chunk_index=meta.get("chunk_index", 0),
                        score=round(score, 4),
                    )
                )

        return sources

    async def delete_document(self, document_id: str) -> bool:
        collection = self._get_collection()
        results = collection.get(where={"document_id": document_id})
        if results["ids"]:
            collection.delete(ids=results["ids"])
            count = len(results["ids"])
            logger.info(f"Deleted {count} chunks for document {document_id}")
            return True
        return False

    async def list_documents(self) -> list[dict]:
        collection = self._get_collection()
        results = collection.get(include=["metadatas"])

        docs: dict[str, dict] = {}
        for meta in results["metadatas"]:
            doc_id = meta.get("document_id", "")
            if doc_id not in docs:
                docs[doc_id] = {
                    "id": doc_id,
                    "filename": meta.get("filename", ""),
                    "chunk_count": 0,
                    "uploaded_at": meta.get("uploaded_at", ""),
                }
            docs[doc_id]["chunk_count"] += 1

        return list(docs.values())

    async def get_document_chunk_count(self, document_id: str) -> int:
        collection = self._get_collection()
        results = collection.get(where={"document_id": document_id})
        return len(results["ids"])


vectorstore = VectorStore()
