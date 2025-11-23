import os
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from utils.prompt import ClientMessage, convert_to_gemini_messages
from utils.stream import (
    patch_response_with_headers,
    stream_text,
    stream_contextual_response,
)
from utils.tools import AVAILABLE_TOOLS, TOOL_DEFINITIONS
from utils.contextual_llm import ContextualLLM
from utils.company_metadata import (
    CompanyMetadata,
    CompanyDataStore,
    UserManager,
    ChatHistory,
)
from utils.ingestor import DataIngestor


load_dotenv(".env.local")

app = FastAPI()

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Request(BaseModel):
    messages: List[ClientMessage]


class ContextualQueryRequest(BaseModel):
    company_id: str
    user_id: str
    task: str
    session_id: Optional[str] = None
    use_context: bool = True
    limit: int = 10
    stream: bool = False


class UserRegistrationRequest(BaseModel):
    name: str
    email: str


class CreateCompanyRequest(BaseModel):
    company_id: str
    name: str
    user_id: str
    short_summary: str = ""
    long_summary: str = ""
    suggested_questions: List[str] = []


class IngestDataRequest(BaseModel):
    data: List[dict]


@app.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query("data")):
    messages = request.messages
    gemini_messages = convert_to_gemini_messages(messages)

    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    response = StreamingResponse(
        stream_text(
            client, gemini_messages, TOOL_DEFINITIONS, AVAILABLE_TOOLS, protocol
        ),
        media_type="text/event-stream",
    )
    return patch_response_with_headers(response, protocol)


@app.post("/api/contextual-query")
async def handle_contextual_query(
    request: ContextualQueryRequest, protocol: str = Query("data")
):
    try:
        user_manager = UserManager()
        user = user_manager.get_user(request.user_id)
        if not user:
            return {"success": False, "error": "User not found"}

        chat_history = ChatHistory()

        # Create or use existing session
        if request.session_id:
            session = chat_history.get_session(request.session_id)
            if not session:
                return {"success": False, "error": "Session not found"}
            session_id = request.session_id
        else:
            session_id = chat_history.create_session(request.user_id, request.company_id)

        # Store user message
        chat_history.add_message(session_id, "user", request.task)

        llm = ContextualLLM()
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

        # Build the prompt based on context
        if request.use_context:
            context = llm.get_company_context(
                request.company_id, request.task, request.limit
            )
            if context["raw_results"]:
                prompt = llm.build_prompt(request.task, context)
            else:
                prompt = f"""No relevant past context found for this task.

User's task: {request.task}

Provide general best practices and guidance."""
        else:
            prompt = request.task

        # Handle streaming response
        if request.stream:
            response = StreamingResponse(
                stream_contextual_response(client, prompt, llm.model_name, protocol),
                media_type="text/event-stream",
            )
            return patch_response_with_headers(response, protocol)

        # Handle non-streaming response
        response_text = llm.ask(
            company_id=request.company_id,
            task=request.task,
            use_context=request.use_context,
        )

        # Store assistant response
        chat_history.add_message(session_id, "assistant", response_text)

        return {
            "success": True,
            "session_id": session_id,
            "company_id": request.company_id,
            "task": request.task,
            "response": response_text,
            "used_context": request.use_context,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/companies")
async def get_all_companies():
    try:
        metadata = CompanyMetadata()
        companies = metadata.get_all_companies()
        return {"success": True, "companies": companies}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/companies/{company_id}/metadata")
async def get_company_metadata(company_id: str):
    try:
        metadata = CompanyMetadata()
        company_data = metadata.get_company_metadata(company_id)
        if not company_data:
            return {"success": False, "error": "Company not found"}
        return {"success": True, "metadata": company_data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/users/register")
async def register_user(request: UserRegistrationRequest):
    try:
        user_manager = UserManager()
        result = user_manager.create_user(name=request.name, email=request.email)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    try:
        user_manager = UserManager()
        user = user_manager.get_user(user_id)
        if not user:
            return {"success": False, "error": "User not found"}
        return {"success": True, "user": user}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/users/{user_id}/companies")
async def get_user_companies(user_id: str):
    try:
        user_manager = UserManager()
        user = user_manager.get_user(user_id)
        if not user:
            return {"success": False, "error": "User not found"}

        metadata = CompanyMetadata()
        companies = metadata.get_user_companies(user_id)
        return {"success": True, "user_id": user_id, "companies": companies}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/companies/create")
async def create_company(request: CreateCompanyRequest):
    try:
        user_manager = UserManager()
        user = user_manager.get_user(request.user_id)
        if not user:
            return {"success": False, "error": "User not found"}

        metadata = CompanyMetadata()
        result = metadata.create_company(
            company_id=request.company_id,
            name=request.name,
            user_id=request.user_id,
            short_summary=request.short_summary,
            long_summary=request.long_summary,
            suggested_questions=request.suggested_questions,
        )

        if not result.get("success"):
            return result

        ingestor = DataIngestor()
        ingestor.setup_company(request.company_id)

        return {
            "success": True,
            "company_id": request.company_id,
            "user_id": request.user_id,
            "message": "Company created successfully",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/companies/{company_id}/ingest")
async def ingest_company_data(company_id: str, request: IngestDataRequest):
    try:
        metadata = CompanyMetadata()
        company_data = metadata.get_company_metadata(company_id)
        if not company_data:
            return {"success": False, "error": "Company not found"}

        ingestor = DataIngestor()
        qdrant_result = ingestor.ingest_data(company_id, request.data)

        data_store = CompanyDataStore()
        mongo_result = data_store.store_data(company_id, request.data)

        return {
            "success": True,
            "company_id": company_id,
            "qdrant": {
                "items_ingested": qdrant_result.get("items_ingested", 0),
                "collection_name": qdrant_result.get("collection_name", ""),
            },
            "mongodb": {
                "items_stored": mongo_result.get("items_stored", 0),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/companies/{company_id}/data")
async def get_company_data(
    company_id: str, source: str = Query(None), limit: int = Query(100)
):
    try:
        data_store = CompanyDataStore()
        data = data_store.get_company_data(company_id, source, limit)
        return {"success": True, "company_id": company_id, "data": data, "count": len(data)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/companies/{company_id}/stats")
async def get_company_stats(company_id: str):
    try:
        data_store = CompanyDataStore()
        stats = data_store.get_data_stats(company_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/users/{user_id}/chat-history")
async def get_user_chat_history(
    user_id: str, company_id: str = Query(None), limit: int = Query(50)
):
    try:
        user_manager = UserManager()
        user = user_manager.get_user(user_id)
        if not user:
            return {"success": False, "error": "User not found"}

        chat_history = ChatHistory()
        sessions = chat_history.get_user_sessions(user_id, company_id, limit)
        return {
            "success": True,
            "user_id": user_id,
            "sessions": sessions,
            "count": len(sessions),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        chat_history = ChatHistory()
        session = chat_history.get_session(session_id)
        if not session:
            return {"success": False, "error": "Session not found"}
        return {"success": True, "session": session}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    try:
        chat_history = ChatHistory()
        messages = chat_history.get_session_messages(session_id)
        if not messages:
            return {"success": False, "error": "Session not found or no messages"}
        return {"success": True, "session_id": session_id, "messages": messages}
    except Exception as e:
        return {"success": False, "error": str(e)}
