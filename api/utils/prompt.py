import json
from enum import Enum
from typing import Any, List, Optional

from google.genai import types
from pydantic import BaseModel, ConfigDict

from .attachment import ClientAttachment


class ToolInvocationState(str, Enum):
    CALL = 'call'
    PARTIAL_CALL = 'partial-call'
    RESULT = 'result'


class ToolInvocation(BaseModel):
    state: ToolInvocationState
    toolCallId: str
    toolName: str
    args: Any
    result: Any


class ClientMessagePart(BaseModel):
    type: str
    text: Optional[str] = None
    contentType: Optional[str] = None
    url: Optional[str] = None
    data: Optional[Any] = None
    toolCallId: Optional[str] = None
    toolName: Optional[str] = None
    state: Optional[str] = None
    input: Optional[Any] = None
    output: Optional[Any] = None
    args: Optional[Any] = None

    model_config = ConfigDict(extra="allow")


class ClientMessage(BaseModel):
    role: str
    content: Optional[str] = None
    parts: Optional[List[ClientMessagePart]] = None
    experimental_attachments: Optional[List[ClientAttachment]] = None
    toolInvocations: Optional[List[ToolInvocation]] = None


def convert_to_gemini_messages(messages: List[ClientMessage]) -> List[types.Content]:
    """Convert client messages to Gemini Content format."""
    gemini_messages = []

    for message in messages:
        parts: List[types.Part] = []

        # Map roles: Gemini uses "user" and "model"
        role = "model" if message.role == "assistant" else "user"

        if message.parts:
            for part in message.parts:
                if part.type == 'text':
                    text_content = part.text or ''
                    if text_content:
                        parts.append(types.Part.from_text(text=text_content))

                elif part.type == 'file':
                    if part.contentType and part.contentType.startswith('image') and part.url:
                        # Handle base64 data URLs
                        if part.url.startswith('data:'):
                            # Extract mime type and base64 data
                            header, data = part.url.split(',', 1)
                            mime_type = header.split(':')[1].split(';')[0]
                            import base64
                            image_bytes = base64.b64decode(data)
                            parts.append(types.Part.from_bytes(
                                data=image_bytes,
                                mime_type=mime_type
                            ))
                        else:
                            # For URLs, include as text reference
                            parts.append(types.Part.from_text(text=f"[Image: {part.url}]"))
                    elif part.url:
                        parts.append(types.Part.from_text(text=part.url))

                elif part.type.startswith('tool-'):
                    # Handle tool-related parts
                    if part.state == 'output-available' and part.output is not None:
                        # This is a tool result - create a function response
                        parts.append(types.Part.from_function_response(
                            name=part.toolName or "unknown",
                            response={"result": part.output}
                        ))

        elif message.content is not None:
            parts.append(types.Part.from_text(text=message.content))

        # Handle attachments
        if not message.parts and message.experimental_attachments:
            for attachment in message.experimental_attachments:
                if attachment.contentType.startswith('image'):
                    if attachment.url.startswith('data:'):
                        header, data = attachment.url.split(',', 1)
                        mime_type = header.split(':')[1].split(';')[0]
                        import base64
                        image_bytes = base64.b64decode(data)
                        parts.append(types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        ))
                    else:
                        parts.append(types.Part.from_text(text=f"[Image: {attachment.url}]"))
                elif attachment.contentType.startswith('text'):
                    parts.append(types.Part.from_text(text=attachment.url))

        # Handle tool invocations
        if message.toolInvocations:
            for tool_invocation in message.toolInvocations:
                # Add function call
                parts.append(types.Part.from_function_call(
                    name=tool_invocation.toolName,
                    args=tool_invocation.args if isinstance(tool_invocation.args, dict) else {}
                ))

            # Add tool results as a separate user message
            for tool_invocation in message.toolInvocations:
                if tool_invocation.result is not None:
                    gemini_messages.append(types.Content(
                        role=role,
                        parts=parts
                    ))
                    parts = []
                    gemini_messages.append(types.Content(
                        role="user",
                        parts=[types.Part.from_function_response(
                            name=tool_invocation.toolName,
                            response={"result": tool_invocation.result}
                        )]
                    ))

        # Only add message if we have parts
        if parts:
            gemini_messages.append(types.Content(
                role=role,
                parts=parts
            ))

    return gemini_messages
