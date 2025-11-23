from google import genai
from .retriever import DataRetriever
from typing import Dict, Optional
import os


class ContextualLLM:
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GOOGLE_API_KEY environment variable must be set or api_key must be provided"
            )
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model
        self.retriever = DataRetriever()

    def get_company_context(self, company_id: str, task: str, limit: int = 10) -> Dict:
        return self.retriever.get_context(company_id, task, limit)

    def build_prompt(self, task: str, context: Dict) -> str:
        formatted_context = context["formatted_context"]
        warnings = context.get("warnings", [])
        lessons = context.get("lessons_learned", [])
        mistakes = context.get("common_mistakes", [])
        bug_clues = context.get("bug_clues", [])

        prompt = f"""You are a technical advisor helping developers avoid past mistakes.

User's task: {task}

Past team context:
{formatted_context}
"""

        if warnings:
            prompt += f"\n\nPast warnings:\n" + "\n".join(
                [f"- {w}" for w in warnings[:5]]
            )

        if lessons:
            prompt += f"\n\nLessons learned:\n" + "\n".join(
                [f"- {l}" for l in lessons[:5]]
            )

        if mistakes:
            prompt += f"\n\nCommon mistakes to avoid:\n" + "\n".join(
                [f"- {m}" for m in mistakes[:5]]
            )

        if bug_clues:
            prompt += f"\n\nBug-related insights:\n" + "\n".join(
                [f"- {b}" for b in bug_clues[:5]]
            )

        prompt += """

Based on the above context, provide:
1. What to be careful about
2. Potential pitfalls to avoid
3. Best practices from past experience
4. Specific warnings if any patterns match

If nothing relevant is found in past context, say so and proceed with general guidance."""

        return prompt

    def ask(self, company_id: str, task: str, use_context: bool = True) -> str:
        if not use_context:
            response = self.client.models.generate_content(
                model=self.model_name, contents=task
            )
            return response.text

        context = self.get_company_context(company_id, task)

        if not context["raw_results"]:
            prompt = f"""No relevant past context found for this task.

User's task: {task}

Provide general best practices and guidance."""
            response = self.client.models.generate_content(
                model=self.model_name, contents=prompt
            )
            return response.text

        prompt = self.build_prompt(task, context)
        response = self.client.models.generate_content(
            model=self.model_name, contents=prompt
        )

        return response.text

    def compare_with_without_context(
        self, company_id: str, task: str
    ) -> Dict[str, str]:
        with_context = self.ask(company_id, task, use_context=True)
        without_context = self.ask(company_id, task, use_context=False)

        return {"with_context": with_context, "without_context": without_context}
