# AI SDK Python Streaming Preview

This template demonstrates the usage of [Data Stream Protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol#data-stream-protocol) to stream chat completions from a Python endpoint ([FastAPI](https://fastapi.tiangolo.com)) and display them using the [useChat](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot#chatbot) hook in your Next.js application.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel-labs/ai-sdk-preview-python-streaming)

## How to use

Run [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example https://github.com/vercel-labs/ai-sdk-preview-python-streaming ai-sdk-preview-python-streaming-example
```

```bash
yarn create next-app --example https://github.com/vercel-labs/ai-sdk-preview-python-streaming ai-sdk-preview-python-streaming-example
```

```bash
pnpm create next-app --example https://github.com/vercel-labs/ai-sdk-preview-python-streaming ai-sdk-preview-python-streaming-example
```

To run the example locally you need to:

1. Sign up for accounts with the AI providers you want to use (eg: Gemini).
2. Obtain API keys for each provider.
3. Set the required environment variables as shown in the `.env.example` file, but in a new file called `.env.local`.
4. `pnpm install` to install the required Node dependencies.
5. `virtualenv venv` to create a virtual environment.
6. `source venv/bin/activate` to activate the virtual environment.
7. `pip install -r requirements.txt` to install the required Python dependencies.
8. `pnpm dev` to launch the development server.

## Project Structure

```
├── api/                          # Python FastAPI backend
│   ├── index.py                  # Main API endpoint (/api/chat)
│   └── utils/
│       ├── __init__.py
│       ├── attachment.py         # Attachment handling
│       ├── prompt.py             # Message conversion to Gemini format
│       ├── stream.py             # Streaming response handler
│       └── tools.py              # Tool definitions (e.g., weather)
│
├── app/                          # Next.js frontend
│   ├── (chat)/
│   │   └── page.tsx              # Main chat page
│   ├── layout.tsx                # Root layout
│   ├── icons.tsx
│   └── og/
│       └── route.tsx             # Open Graph image route
│
├── components/                   # React components
│   ├── chat.tsx                  # Chat container
│   ├── message.tsx               # Message display
│   ├── multimodal-input.tsx      # Input with file support
│   ├── markdown.tsx              # Markdown renderer
│   ├── navbar.tsx                # Navigation bar
│   ├── overview.tsx              # Welcome overview
│   ├── preview-attachment.tsx    # Attachment preview
│   ├── weather.tsx               # Weather tool UI
│   ├── icons.tsx
│   └── ui/                       # UI primitives
│       ├── button.tsx
│       └── textarea.tsx
│
├── hooks/
│   └── use-scroll-to-bottom.tsx  # Auto-scroll hook
│
├── lib/
│   └── utils.ts                  # Utility functions
│
├── requirements.txt              # Python dependencies
├── package.json                  # Node.js dependencies
└── vercel.json                   # Vercel deployment config
```

## Gemini Setup

This project uses **Google Gemini 2.0 Flash** as the AI model. Here's how it's configured:

### 1. Environment Variables

Create a `.env.local` file with your Google API key:

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. Client Initialization (`api/index.py`)

```python
from google import genai

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
```

### 3. Streaming Response (`api/utils/stream.py`)

The API uses Gemini's streaming content generation:

```python
response = client.models.generate_content_stream(
    model="gemini-2.0-flash",
    contents=messages,
    config=types.GenerateContentConfig(
        tools=tool_definitions if tool_definitions else None,
    ),
)
```

### 4. Message Format (`api/utils/prompt.py`)

Messages are converted from the Vercel AI SDK format to Gemini's `Content` format:

- Roles: `"assistant"` → `"model"`, `"user"` → `"user"`
- Supports text, images (base64), and tool invocations

### 5. Tool Definitions (`api/utils/tools.py`)

Tools are defined using Gemini's schema format:

```python
TOOL_DEFINITIONS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_current_weather",
                description="Get the current weather at a location",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "latitude": types.Schema(type=types.Type.NUMBER, ...),
                        "longitude": types.Schema(type=types.Type.NUMBER, ...),
                    },
                    required=["latitude", "longitude"],
                ),
            ),
        ]
    )
]
```

### Key Dependencies

```
google-genai          # Google Generative AI SDK
fastapi               # Web framework
pydantic              # Data validation
python-dotenv         # Environment variables
```

## Learn More

To learn more about the AI SDK or Next.js by Vercel, take a look at the following resources:

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
