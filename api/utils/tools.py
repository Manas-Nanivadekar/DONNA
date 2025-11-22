import requests
from google.genai import types


def get_current_weather(latitude: float, longitude: float):
    """Get current weather data for a location."""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto"

    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    except requests.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return None


# Gemini tool definitions
TOOL_DEFINITIONS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_current_weather",
                description="Get the current weather at a location",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "latitude": types.Schema(
                            type=types.Type.NUMBER,
                            description="The latitude of the location",
                        ),
                        "longitude": types.Schema(
                            type=types.Type.NUMBER,
                            description="The longitude of the location",
                        ),
                    },
                    required=["latitude", "longitude"],
                ),
            ),
        ]
    )
]


AVAILABLE_TOOLS = {
    "get_current_weather": get_current_weather,
}
