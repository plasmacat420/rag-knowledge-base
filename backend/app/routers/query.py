from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models import QueryRequest
from app.services.rag import answer_question

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def query_documents(request: QueryRequest):
    return StreamingResponse(
        answer_question(
            question=request.question,
            document_ids=request.document_ids,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
