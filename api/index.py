import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request as FastAPIRequest
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
from utils.company_metadata import CompanyMetadata


load_dotenv(".env.local")

app = FastAPI()


class Request(BaseModel):
    messages: List[ClientMessage]


class ContextualQueryRequest(BaseModel):
    company_id: str
    task: str
    use_context: bool = True
    limit: int = 10
    stream: bool = False


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

        return {
            "success": True,
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
