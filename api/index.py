import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request as FastAPIRequest
from fastapi.responses import StreamingResponse
from google import genai
from .utils.prompt import ClientMessage, convert_to_gemini_messages
from .utils.stream import patch_response_with_headers, stream_text
from .utils.tools import AVAILABLE_TOOLS, TOOL_DEFINITIONS


load_dotenv(".env.local")

app = FastAPI()


class Request(BaseModel):
    messages: List[ClientMessage]


@app.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query('data')):
    messages = request.messages
    gemini_messages = convert_to_gemini_messages(messages)

    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    response = StreamingResponse(
        stream_text(client, gemini_messages, TOOL_DEFINITIONS, AVAILABLE_TOOLS, protocol),
        media_type="text/event-stream",
    )
    return patch_response_with_headers(response, protocol)
