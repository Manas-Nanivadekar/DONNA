import json
import traceback
import uuid
from typing import Any, Callable, Dict, List, Mapping

from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types


def stream_text(
    client: genai.Client,
    messages: List[types.Content],
    tool_definitions: List[types.Tool],
    available_tools: Mapping[str, Callable[..., Any]],
    protocol: str = "data",
):
    """Yield Server-Sent Events for a streaming chat completion."""
    try:

        def format_sse(payload: dict) -> str:
            return f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"

        message_id = f"msg-{uuid.uuid4().hex}"
        text_stream_id = "text-1"
        text_started = False
        text_finished = False
        finish_reason = None
        usage_data = None
        tool_calls_state: Dict[str, Dict[str, Any]] = {}

        yield format_sse({"type": "start", "messageId": message_id})

        response = client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=messages,
            config=types.GenerateContentConfig(
                tools=tool_definitions if tool_definitions else None,
            ),
        )

        for chunk in response:
            print(f"[Gemini Response] {chunk}")
            if chunk.candidates:
                for candidate in chunk.candidates:
                    if candidate.finish_reason:
                        finish_reason = candidate.finish_reason.name

                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            # Handle text content
                            if part.text:
                                if not text_started:
                                    yield format_sse(
                                        {"type": "text-start", "id": text_stream_id}
                                    )
                                    text_started = True
                                yield format_sse(
                                    {
                                        "type": "text-delta",
                                        "id": text_stream_id,
                                        "delta": part.text,
                                    }
                                )

                            # Handle function calls
                            if part.function_call:
                                tool_call_id = f"call-{uuid.uuid4().hex}"
                                tool_name = part.function_call.name
                                tool_args = (
                                    dict(part.function_call.args)
                                    if part.function_call.args
                                    else {}
                                )

                                state = tool_calls_state.setdefault(
                                    tool_call_id,
                                    {
                                        "id": tool_call_id,
                                        "name": tool_name,
                                        "arguments": tool_args,
                                        "started": False,
                                    },
                                )

                                if not state["started"]:
                                    yield format_sse(
                                        {
                                            "type": "tool-input-start",
                                            "toolCallId": tool_call_id,
                                            "toolName": tool_name,
                                        }
                                    )
                                    state["started"] = True

                                # Send the arguments as delta
                                args_str = json.dumps(tool_args)
                                yield format_sse(
                                    {
                                        "type": "tool-input-delta",
                                        "toolCallId": tool_call_id,
                                        "inputTextDelta": args_str,
                                    }
                                )

            # Check for usage metadata
            if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
                usage_data = chunk.usage_metadata

        # End text stream if started
        if text_started and not text_finished:
            yield format_sse({"type": "text-end", "id": text_stream_id})
            text_finished = True

        # Process tool calls
        if tool_calls_state:
            for tool_call_id, state in tool_calls_state.items():
                tool_name = state.get("name")
                parsed_arguments = state.get("arguments", {})

                if tool_call_id is None or tool_name is None:
                    continue

                yield format_sse(
                    {
                        "type": "tool-input-available",
                        "toolCallId": tool_call_id,
                        "toolName": tool_name,
                        "input": parsed_arguments,
                    }
                )

                tool_function = available_tools.get(tool_name)
                if tool_function is None:
                    yield format_sse(
                        {
                            "type": "tool-output-error",
                            "toolCallId": tool_call_id,
                            "errorText": f"Tool '{tool_name}' not found.",
                        }
                    )
                    continue

                try:
                    tool_result = tool_function(**parsed_arguments)
                except Exception as error:
                    yield format_sse(
                        {
                            "type": "tool-output-error",
                            "toolCallId": tool_call_id,
                            "errorText": str(error),
                        }
                    )
                else:
                    yield format_sse(
                        {
                            "type": "tool-output-available",
                            "toolCallId": tool_call_id,
                            "output": tool_result,
                        }
                    )

        # Build finish metadata
        finish_metadata: Dict[str, Any] = {}
        if finish_reason is not None:
            # Map Gemini finish reasons to standard format
            reason_map = {
                "STOP": "stop",
                "MAX_TOKENS": "length",
                "SAFETY": "content-filter",
                "RECITATION": "content-filter",
                "OTHER": "other",
            }
            finish_metadata["finishReason"] = reason_map.get(
                finish_reason, finish_reason.lower()
            )

        if usage_data is not None:
            usage_payload = {
                "promptTokens": getattr(usage_data, "prompt_token_count", 0),
                "completionTokens": getattr(usage_data, "candidates_token_count", 0),
            }
            total_tokens = getattr(usage_data, "total_token_count", None)
            if total_tokens is not None:
                usage_payload["totalTokens"] = total_tokens
            finish_metadata["usage"] = usage_payload

        if finish_metadata:
            yield format_sse({"type": "finish", "messageMetadata": finish_metadata})
        else:
            yield format_sse({"type": "finish"})

        yield "data: [DONE]\n\n"
    except Exception:
        traceback.print_exc()
        raise


def stream_contextual_response(
    client: genai.Client,
    prompt: str,
    model: str = "gemini-2.5-flash",
    protocol: str = "data",
):
    """Yield Server-Sent Events for a streaming contextual query response."""
    try:

        def format_sse(payload: dict) -> str:
            return f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"

        message_id = f"msg-{uuid.uuid4().hex}"
        text_stream_id = "text-1"
        text_started = False
        text_finished = False
        finish_reason = None
        usage_data = None

        yield format_sse({"type": "start", "messageId": message_id})

        response = client.models.generate_content_stream(
            model=model,
            contents=prompt,
        )

        for chunk in response:
            if chunk.candidates:
                for candidate in chunk.candidates:
                    if candidate.finish_reason:
                        finish_reason = candidate.finish_reason.name

                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if part.text:
                                if not text_started:
                                    yield format_sse(
                                        {"type": "text-start", "id": text_stream_id}
                                    )
                                    text_started = True
                                yield format_sse(
                                    {
                                        "type": "text-delta",
                                        "id": text_stream_id,
                                        "delta": part.text,
                                    }
                                )

            if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
                usage_data = chunk.usage_metadata

        # End text stream if started
        if text_started and not text_finished:
            yield format_sse({"type": "text-end", "id": text_stream_id})
            text_finished = True

        # Build finish metadata
        finish_metadata: Dict[str, Any] = {}
        if finish_reason is not None:
            reason_map = {
                "STOP": "stop",
                "MAX_TOKENS": "length",
                "SAFETY": "content-filter",
                "RECITATION": "content-filter",
                "OTHER": "other",
            }
            finish_metadata["finishReason"] = reason_map.get(
                finish_reason, finish_reason.lower()
            )

        if usage_data is not None:
            usage_payload = {
                "promptTokens": getattr(usage_data, "prompt_token_count", 0),
                "completionTokens": getattr(usage_data, "candidates_token_count", 0),
            }
            total_tokens = getattr(usage_data, "total_token_count", None)
            if total_tokens is not None:
                usage_payload["totalTokens"] = total_tokens
            finish_metadata["usage"] = usage_payload

        if finish_metadata:
            yield format_sse({"type": "finish", "messageMetadata": finish_metadata})
        else:
            yield format_sse({"type": "finish"})

        yield "data: [DONE]\n\n"
    except Exception:
        traceback.print_exc()
        raise


def patch_response_with_headers(
    response: StreamingResponse,
    protocol: str = "data",
) -> StreamingResponse:
    """Apply the standard streaming headers expected by the Vercel AI SDK."""

    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"

    if protocol:
        response.headers.setdefault("x-vercel-ai-protocol", protocol)

    return response
