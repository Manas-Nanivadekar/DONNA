import ollama
from qdrant_client import QdrantClient
from typing import List, Dict


class DataRetriever:
    def __init__(self):
        self.client = QdrantClient("http://localhost:6333")
        self.embedding_model = "nomic-embed-text"

    def embed(self, text: str):
        result = ollama.embeddings(model=self.embedding_model, prompt=text)
        return result["embedding"]

    def search(self, company_id: str, query: str, limit: int = 10):
        collection_name = f"company_{company_id}"
        query_embedding = self.embed(query)

        results = self.client.query_points(
            collection_name=collection_name, query=query_embedding, limit=limit
        ).points

        return results

    def format_results(self, results) -> str:
        contexts = []

        for result in results:
            payload = result.payload
            source = payload.get("source", "unknown")
            sprint = payload.get("sprint", "")
            bug_stage = payload.get("bug_stage", "")
            content = payload.get("content", "")

            header = f"[{source}]"
            if sprint:
                header += f" Sprint {sprint}"
            if bug_stage:
                header += f" | {bug_stage}"

            contexts.append(f"{header}\n{content}")

        return "\n\n".join(contexts)

    def get_context(self, company_id: str, query: str, limit: int = 10) -> Dict:
        results = self.search(company_id, query, limit)

        warnings = []
        lessons = []
        best_practices = []
        common_mistakes = []
        bug_clues = []
        key_decisions = []

        for result in results:
            full_data = result.payload.get("full_data", {})

            if full_data.get("warnings"):
                warnings.append(full_data["warnings"])

            if full_data.get("lessons_learned"):
                lessons.append(full_data["lessons_learned"])

            if full_data.get("best_practices"):
                bp = full_data["best_practices"]
                if isinstance(bp, list):
                    best_practices.extend(bp)
                else:
                    best_practices.append(bp)

            if full_data.get("common_mistakes"):
                cm = full_data["common_mistakes"]
                if isinstance(cm, list):
                    common_mistakes.extend(cm)
                else:
                    common_mistakes.append(cm)

            if full_data.get("bug_clues"):
                bug_clues.append(full_data["bug_clues"])

            if full_data.get("bug_related"):
                bug_clues.append(full_data["bug_related"])

            if full_data.get("bug_connection"):
                bug_clues.append(full_data["bug_connection"])

            if full_data.get("bug_mentions"):
                bug_clues.append(full_data["bug_mentions"])

            if full_data.get("key_decisions"):
                key_decisions.append(full_data["key_decisions"])

        return {
            "formatted_context": self.format_results(results),
            "warnings": warnings,
            "lessons_learned": lessons,
            "best_practices": best_practices,
            "common_mistakes": common_mistakes,
            "bug_clues": bug_clues,
            "key_decisions": key_decisions,
            "raw_results": results,
        }

    def get_sprint_context(self, company_id: str, sprint: int, limit: int = 20) -> Dict:
        collection_name = f"company_{company_id}"

        from qdrant_client.models import Filter, FieldCondition, MatchValue

        results = self.client.scroll(
            collection_name=collection_name,
            scroll_filter=Filter(
                must=[FieldCondition(key="sprint", match=MatchValue(value=sprint))]
            ),
            limit=limit,
        )[0]

        return {
            "formatted_context": self.format_results(results),
            "raw_results": results,
        }

    def get_by_source(self, company_id: str, source: str, limit: int = 10) -> List:
        collection_name = f"company_{company_id}"

        from qdrant_client.models import Filter, FieldCondition, MatchValue

        results = self.client.scroll(
            collection_name=collection_name,
            scroll_filter=Filter(
                must=[FieldCondition(key="source", match=MatchValue(value=source))]
            ),
            limit=limit,
        )[0]

        return results

    def list_companies(self) -> List[str]:
        collections = self.client.get_collections().collections
        companies = [
            c.name.replace("company_", "")
            for c in collections
            if c.name.startswith("company_")
        ]
        return companies
