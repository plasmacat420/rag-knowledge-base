import json
from typing import AsyncGenerator, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from loguru import logger

from app.config import settings
from app.services.vectorstore import vectorstore

SYSTEM_PROMPT = (
    "You are a helpful assistant. Answer based ONLY on the provided context. "
    "If the answer is not in the context, say so clearly. "
    "Be concise and accurate."
)


async def answer_question(
    question: str,
    document_ids: Optional[list[str]],
) -> AsyncGenerator[str, None]:
    sources = await vectorstore.search(
        query=question,
        document_ids=document_ids,
        k=settings.MAX_RETRIEVAL_DOCS,
    )

    if not sources:
        no_docs_msg = "No relevant documents found. Please upload documents first."
        yield f"data: {json.dumps({'token': no_docs_msg})}\n\n"
        yield f"data: {json.dumps({'sources': [], 'done': True})}\n\n"
        return

    context = "\n\n---\n\n".join(
        f"[Source: {s.filename}, chunk {s.chunk_index}]\n{s.content}"
        for s in sources
    )

    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model="gpt-4o-mini",
        temperature=0,
        streaming=True,
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {question}"),
    ]

    logger.info(f"Streaming answer for: {question[:50]}...")

    async for chunk in llm.astream(messages):
        token = chunk.content
        if token:
            yield f"data: {json.dumps({'token': token})}\n\n"

    sources_data = [s.model_dump() for s in sources]
    yield f"data: {json.dumps({'sources': sources_data, 'done': True})}\n\n"
