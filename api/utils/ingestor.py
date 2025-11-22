import os
import json
import ollama
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from tqdm import tqdm


class DataIngestor:
    def __init__(self):
        self.client = QdrantClient("http://localhost:6333")
        self.embedding_model = "nomic-embed-text"

    def setup_company(self, company_id: str):
        collection_name = f"company_{company_id}"

        try:
            self.client.get_collection(collection_name)
            print(f"{collection_name} exists")
        except:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            print(f"{collection_name} created")

        return collection_name

    def embed(self, text: str):
        result = ollama.embeddings(model=self.embedding_model, prompt=text)
        return result["embedding"]

    def extract_content(self, item: dict) -> str:
        parts = []

        for key in [
            "title",
            "thread_title",
            "description",
            "content",
            "message",
            "commit_hash",
        ]:
            if key in item:
                parts.append(str(item[key]))

        if "messages" in item:
            for msg in item["messages"]:
                parts.append(msg.get("text", ""))

        if "comments" in item:
            comments = item["comments"]
            if isinstance(comments, list):
                for comment in comments:
                    if isinstance(comment, dict):
                        parts.append(comment.get("text", str(comment)))
                    else:
                        parts.append(str(comment))
            else:
                parts.append(str(comments))

        if "action_items" in item:
            items = item["action_items"]
            if isinstance(items, list):
                parts.extend(items)
            else:
                parts.append(str(items))

        if "decisions_made" in item:
            decisions = item["decisions_made"]
            if isinstance(decisions, list):
                parts.extend(decisions)
            else:
                parts.append(str(decisions))

        for key in [
            "lessons_learned",
            "warnings",
            "key_decisions",
            "best_practices",
            "common_mistakes",
            "bug_related",
            "bug_clues",
            "bug_connection",
            "bug_mentions",
            "files_changed",
            "related_incidents",
            "tags",
        ]:
            if key in item:
                val = item[key]
                if isinstance(val, list):
                    parts.extend([str(v) for v in val])
                else:
                    parts.append(str(val))

        return " | ".join(filter(None, parts))

    def ingest_company(self, company_id: str, directory: str):
        collection_name = self.setup_company(company_id)

        files = [f for f in os.listdir(directory) if f.endswith(".json")]
        print(f"[{company_id}] {len(files)} files found")

        point_id = 0

        for file in tqdm(files, desc=f"Ingesting {company_id}"):
            path = os.path.join(directory, file)

            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if isinstance(data, dict):
                if "data" in data:
                    items = data["data"]
                elif any(
                    k in data
                    for k in ["github_commits", "slack_conversations", "jira_tickets"]
                ):
                    items = []
                    for section in [
                        "github_commits",
                        "slack_conversations",
                        "jira_tickets",
                        "confluence_docs",
                        "google_docs",
                    ]:
                        if section in data:
                            section_items = (
                                data[section]
                                if isinstance(data[section], list)
                                else [data[section]]
                            )
                            items.extend(section_items)
                else:
                    items = [data]
            elif isinstance(data, list):
                items = data
            else:
                items = [data]

            points = []
            for item in items:
                content = self.extract_content(item)
                embedding = self.embed(content)

                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "company_id": company_id,
                            "source": item.get("source", "unknown"),
                            "sprint": item.get("sprint", 0),
                            "sprint_focus": item.get("sprint_focus", ""),
                            "bug_stage": item.get("bug_stage", ""),
                            "content": content[:1000],
                            "full_data": item,
                        },
                    )
                )
                point_id += 1

            if points:
                self.client.upsert(collection_name=collection_name, points=points)

        print(f"[{company_id}] {point_id} items ingested")
        return collection_name

    def ingest_data(self, company_id: str, data: list) -> dict:
        collection_name = self.setup_company(company_id)

        if not isinstance(data, list):
            data = [data]

        point_id_start = self._get_next_point_id(collection_name)
        point_id = point_id_start

        points = []
        for item in data:
            if not isinstance(item, dict):
                continue

            content = self.extract_content(item)
            if not content.strip():
                continue

            embedding = self.embed(content)

            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "company_id": company_id,
                        "source": item.get("source", "custom"),
                        "sprint": item.get("sprint", 0),
                        "sprint_focus": item.get("sprint_focus", ""),
                        "bug_stage": item.get("bug_stage", ""),
                        "content": content[:1000],
                        "full_data": item,
                    },
                )
            )
            point_id += 1

        if points:
            self.client.upsert(collection_name=collection_name, points=points)

        items_ingested = point_id - point_id_start
        return {
            "success": True,
            "company_id": company_id,
            "items_ingested": items_ingested,
            "collection_name": collection_name,
        }

    def _get_next_point_id(self, collection_name: str) -> int:
        try:
            result = self.client.scroll(
                collection_name=collection_name, limit=1, with_payload=False
            )
            if result[0]:
                max_id = max([point.id for point in result[0]])
                return max_id + 1
            return 0
        except:
            return 0
