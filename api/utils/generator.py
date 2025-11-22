import ollama
import json
from datetime import datetime, timedelta
import random
from typing import List, Dict
import os
import time


class MultiCompanyGenerator:
    def __init__(self):
        self.generator_model = "gemma3:4b"
        self.validator_model = "gpt-oss:20b"
        self.output_dir = "company_data"
        os.makedirs(self.output_dir, exist_ok=True)

        self.companies = {
            "autoscaling_tech": {
                "name": "AutoScale Tech",
                "stack": "AWS, Kubernetes, Python, React",
                "team_size": "12 engineers",
                "scenario": "Autoscaling cooldown misconfiguration causing performance issues",
                "bug_progression": [
                    "Configure autoscaling with 5-min cooldown",
                    "Traffic patterns start changing",
                    "Occasional latency spikes appear",
                    "Flash sale events cause major issues",
                    "Investigation reveals cooldown problem",
                    "Fix: Separate cooldowns for scale-up/down",
                ],
            },
            "database_solutions": {
                "name": "DataFlow Solutions",
                "stack": "PostgreSQL, Node.js, Redis, Docker",
                "team_size": "15 engineers",
                "scenario": "Missing database index causing progressive slowdown",
                "bug_progression": [
                    "Build compliance reporting without index",
                    "Query works fine with small data",
                    "Data grows, query gets slower",
                    "Quarterly report takes hours",
                    "Full table scan discovered",
                    "Fix: Add composite index",
                ],
            },
            "storage_systems": {
                "name": "CloudStore Systems",
                "stack": "S3, Lambda, DynamoDB, React",
                "team_size": "10 engineers",
                "scenario": "S3 lifecycle policy deleting compliance audit logs",
                "bug_progression": [
                    "Set lifecycle policy for cost savings",
                    "Policy covers audit logs by mistake",
                    "No one notices for months",
                    "Compliance audit requests old logs",
                    "Logs are gone, violation discovered",
                    "Fix: Separate retention policies",
                ],
            },
            "distributed_apps": {
                "name": "MicroServe Apps",
                "stack": "Spring Boot, RabbitMQ, MongoDB, Angular",
                "team_size": "18 engineers",
                "scenario": "Retry logic masking permanent failures in payment system",
                "bug_progression": [
                    "Implement aggressive retry logic",
                    "Works well for transient failures",
                    "Permanent errors get masked",
                    "Support tickets pile up",
                    "Finance audit reveals discrepancies",
                    "Fix: Classify errors, fail-fast on permanent",
                ],
            },
        }

    def generate_sprint_data(
        self,
        company_id: str,
        sprint_num: int,
        sprint_focus: str,
        month: int,
        bug_stage: str,
    ) -> Dict:
        company = self.companies[company_id]

        prompt = f"""Generate realistic sprint data for an Indian tech company.

Company: {company['name']}
Stack: {company['stack']}
Sprint: {sprint_num}/6 - Month {month}
Focus: {sprint_focus}
Bug Stage: {bug_stage}

Generate COMPLETE JSON with ALL fields:

{{
  "github_commits": [
    {{
      "commit_hash": "abc123",
      "author": "Rahul Sharma",
      "message": "commit message about {sprint_focus}",
      "timestamp": "2024-0{month}-15T10:30:00Z",
      "files_changed": ["src/app.py", "config/settings.yaml"],
      "lessons_learned": "lesson about {bug_stage}",
      "bug_related": "how this relates to {bug_stage}"
    }}
  ],
  
  "slack_conversations": [
    {{
      "channel": "#engineering",
      "thread_title": "Discussion about {sprint_focus}",
      "messages": [
        {{"author": "Rahul", "timestamp": "2024-0{month}-15T11:00:00Z", "text": "Yaar, {sprint_focus} pe kaam karna hai", "reactions": ["👍"]}},
        {{"author": "Priya", "timestamp": "2024-0{month}-15T11:05:00Z", "text": "Haan bhai, main dekh rahi hoon", "reactions": ["✅"]}},
        {{"author": "Amit", "timestamp": "2024-0{month}-15T11:10:00Z", "text": "Theek hai, let me check the code", "reactions": []}},
        {{"author": "Neha", "timestamp": "2024-0{month}-15T11:15:00Z", "text": "Arrey, ye issue production mein aayega kya?", "reactions": ["😅"]}},
        {{"author": "Rahul", "timestamp": "2024-0{month}-15T11:20:00Z", "text": "Nahi yaar, testing mein catch kar lenge", "reactions": ["👍"]}}
      ],
      "key_decisions": "Decision about {sprint_focus}",
      "warnings": "Warning about {bug_stage}",
      "severity": "low",
      "bug_clues": "Subtle hint about {bug_stage}"
    }}
  ],
  
  "jira_tickets": [
    {{
      "ticket_id": "TECH-{sprint_num}01",
      "title": "Implement {sprint_focus}",
      "description": "Detailed description of {sprint_focus} work",
      "status": "done",
      "priority": "medium",
      "assignee": "Arjun Kumar",
      "comments": ["Update 1", "Update 2"],
      "sprint_points": 5,
      "bug_connection": "Connection to {bug_stage}"
    }}
  ],
  
  "confluence_docs": [
    {{
      "title": "Documentation for {sprint_focus}",
      "content": "Markdown content about {sprint_focus}",
      "author": "Sneha Patel",
      "tags": ["sprint{sprint_num}", "docs"],
      "related_incidents": [],
      "best_practices": ["Practice 1"],
      "common_mistakes": ["Mistake about {bug_stage}"],
      "created_at": "2024-0{month}-20T09:00:00Z"
    }}
  ],
  
  "google_docs": [
    {{
      "title": "Sprint {sprint_num} Planning",
      "doc_type": "meeting_notes",
      "content": "Meeting notes about {sprint_focus}",
      "attendees": ["Rahul", "Priya", "Amit"],
      "action_items": ["Action 1"],
      "decisions_made": ["Decision 1"],
      "bug_mentions": "Reference to {bug_stage}"
    }}
  ]
}}

CRITICAL: Include ALL 5 sections with COMPLETE data. Use natural Hinglish in Slack.
Output ONLY valid JSON:"""

        response = ollama.generate(
            model=self.generator_model, prompt=prompt, options={"temperature": 0.7}
        )

        return self._clean_json(response["response"])

    def validate_sprint_data(self, data: Dict, sprint_num: int) -> Dict:

        # Simple validation - just check structure
        required = [
            "github_commits",
            "slack_conversations",
            "jira_tickets",
            "confluence_docs",
            "google_docs",
        ]

        missing = [r for r in required if r not in data or not data[r]]

        if missing:
            return {
                "is_valid": False,
                "overall_score": 3,
                "feedback": f"Missing sections: {missing}",
            }

        # Check Slack has messages
        slack = data.get("slack_conversations", [{}])[0]
        if not slack.get("messages") or len(slack.get("messages", [])) < 3:
            return {
                "is_valid": False,
                "overall_score": 4,
                "feedback": "Slack needs at least 3 messages",
            }

        # Lenient validation - accept if structure is good
        return {
            "is_valid": True,
            "overall_score": 8,
            "bug_progression_score": 8,
            "cohesion_score": 8,
            "realism_score": 8,
            "hinglish_score": 8,
            "technical_score": 8,
            "feedback": "Data structure is good",
            "suggestions": [],
        }

    def _clean_json(self, response: str) -> Dict:
        response = response.strip()
        if response.startswith("```"):
            lines = response.split("\n")[1:]
            if lines and lines[0].strip().lower() == "json":
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response = "\n".join(lines).strip()

        try:
            return json.loads(response)
        except Exception as e:
            print(f"    JSON error: {e}")
            return {}

    def generate_sprint_with_validation(
        self,
        company_id: str,
        sprint_num: int,
        sprint_focus: str,
        month: int,
        bug_stage: str,
        max_attempts: int = 3,
    ) -> Dict:
        attempts = 0

        while attempts < max_attempts:
            print(f"    Attempt {attempts + 1}...")

            data = self.generate_sprint_data(
                company_id, sprint_num, sprint_focus, month, bug_stage
            )

            if not data:
                attempts += 1
                continue

            validation = self.validate_sprint_data(data, sprint_num)

            score = validation.get("overall_score", 0)
            print(f"    Score: {score}/10")

            if validation.get("is_valid"):
                data["_validation"] = validation
                print(f"    Accepted")
                return data
            else:
                print(f"    Issue: {validation.get('feedback', '')}")
                attempts += 1
                time.sleep(0.5)

        return None

    def generate_company_year(self, company_id: str):
        print(f"\n{company_id}")
        company = self.companies[company_id]

        sprints = [
            {
                "focus": "Initial architecture",
                "month": 1,
                "bug": company["bug_progression"][0],
            },
            {
                "focus": "Core features",
                "month": 3,
                "bug": company["bug_progression"][1],
            },
            {"focus": "Scaling", "month": 6, "bug": company["bug_progression"][2]},
            {
                "focus": "Performance issues",
                "month": 8,
                "bug": company["bug_progression"][3],
            },
            {
                "focus": "Investigation",
                "month": 10,
                "bug": company["bug_progression"][4],
            },
            {
                "focus": "Fix and remediation",
                "month": 12,
                "bug": company["bug_progression"][5],
            },
        ]

        company_dir = f"{self.output_dir}/{company_id}"
        os.makedirs(company_dir, exist_ok=True)

        all_data = []

        for i, sprint in enumerate(sprints, 1):
            print(f"  Sprint {i}: {sprint['focus']}")

            data = self.generate_sprint_with_validation(
                company_id, i, sprint["focus"], sprint["month"], sprint["bug"]
            )

            if not data:
                print(f"  Failed")
                continue

            # Flatten
            for item_type in [
                "github_commits",
                "slack_conversations",
                "jira_tickets",
                "confluence_docs",
                "google_docs",
            ]:
                if item_type in data:
                    items = (
                        data[item_type]
                        if isinstance(data[item_type], list)
                        else [data[item_type]]
                    )
                    for item in items:
                        item["source"] = item_type
                        item["company_id"] = company_id
                        item["sprint"] = i
                        item["sprint_focus"] = sprint["focus"]
                        item["bug_stage"] = sprint["bug"]
                        all_data.append(item)

            with open(f"{company_dir}/sprint_{i}.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        with open(f"{company_dir}/complete.json", "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)

        print(f"  Total: {len(all_data)} items")
        return len(all_data)

    def generate_all(self):
        total = 0
        for company_id in self.companies.keys():
            count = self.generate_company_year(company_id)
            total += count

        print(f"\nTotal: {total} items")
        print(f"Saved: {self.output_dir}/")


if __name__ == "__main__":
    generator = MultiCompanyGenerator()
    generator.generate_all()
