import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()


class UserManager:
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["donna"]
        self.collection = self.db["users"]

    def create_user(self, name: str, email: str) -> Dict:
        existing = self.collection.find_one({"email": email})
        if existing:
            return {
                "success": True,
                "user_id": existing["user_id"],
                "message": "User already exists",
                "existing": True,
            }

        user_id = str(uuid.uuid4())
        user = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "created_at": datetime.utcnow(),
        }

        self.collection.insert_one(user)
        return {
            "success": True,
            "user_id": user_id,
            "message": "User created successfully",
            "existing": False,
        }

    def get_user(self, user_id: str) -> Optional[Dict]:
        user = self.collection.find_one({"user_id": user_id}, {"_id": 0})
        return user

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        user = self.collection.find_one({"email": email}, {"_id": 0})
        return user


class CompanyMetadata:
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["donna"]
        self.collection = self.db["company_metadata"]

    def get_all_companies(self) -> List[Dict]:
        companies = list(self.collection.find({}, {"_id": 0}))
        return [
            {
                "company_id": c["company_id"],
                "name": c["name"],
                "short_summary": c["short_summary"],
            }
            for c in companies
        ]

    def get_company_metadata(self, company_id: str) -> Optional[Dict]:
        result = self.collection.find_one({"company_id": company_id}, {"_id": 0})
        return result

    def insert_metadata(self, metadata: Dict) -> str:
        result = self.collection.insert_one(metadata)
        return str(result.inserted_id)

    def create_company(
        self,
        company_id: str,
        name: str,
        user_id: str,
        short_summary: str = "",
        long_summary: str = "",
        suggested_questions: List[str] = None,
    ) -> Dict:
        existing = self.collection.find_one({"company_id": company_id})
        if existing:
            return {"success": False, "error": "Company already exists"}

        metadata = {
            "company_id": company_id,
            "name": name,
            "user_id": user_id,
            "short_summary": short_summary,
            "long_summary": long_summary,
            "suggested_questions": suggested_questions or [],
            "created_at": datetime.utcnow(),
        }

        self.collection.insert_one(metadata)
        return {"success": True, "company_id": company_id}

    def get_user_companies(self, user_id: str) -> List[Dict]:
        companies = list(
            self.collection.find({"user_id": user_id}, {"_id": 0}).sort(
                "created_at", -1
            )
        )
        return companies

    def seed_demo_companies(self):
        existing = self.collection.count_documents({})
        if existing > 0:
            print(f"Company metadata already seeded ({existing} companies)")
            return

        companies_data = [
            {
                "company_id": "autoscaling_tech",
                "name": "AutoScale Tech",
                "short_summary": "AutoScale Tech faced a critical performance issue where autoscaling cooldown periods were misconfigured, causing latency spikes during traffic bursts. The 5-minute cooldown prevented rapid scale-up during flash sales, degrading user experience for months before discovery.",
                "long_summary": """AutoScale Tech initially deployed autoscaling with a uniform 5-minute cooldown for both scale-up and scale-down events, following what they believed were industry best practices. During the first few months, traffic patterns were predictable and gradual, masking the configuration flaw.

As the user base grew and marketing campaigns introduced sudden traffic spikes, the system began showing symptoms. The 5-minute cooldown prevented immediate scale-up when CPU spiked from 40% to 95% in under 20 seconds during mobile app push notifications. Meanwhile, premature scale-down after brief traffic bursts left the system under-provisioned when subsequent spikes arrived.

Engineering teams initially misdiagnosed the issue, attributing latency spikes to database connection pooling, application code inefficiency, and network problems. They spent months optimizing the wrong layers while the root cause remained hidden in infrastructure configuration that was set once and never revisited.

The breakthrough came during a major marketing campaign when continuous oscillation became severe enough to trigger executive attention. Correlation analysis finally revealed that latency spikes occurred exactly 60-120 seconds after scale-in events, and 30-90 seconds after high CPU detection during scale-out attempts.

The fix required separating scale-up cooldown (reduced to 20 seconds) from scale-down cooldown (increased to 900 seconds with additional sustained-low-CPU requirements), plus implementing multi-metric scaling policies. This reduced latency incidents by 94%.

The incident highlighted how initial validation under artificial conditions can mask real-world failure modes, and how 'working as designed' doesn't mean 'working correctly' when design assumptions prove invalid.""",
                "suggested_questions": [
                    "What went wrong with the autoscaling cooldown configuration?",
                    "How long did it take to discover the autoscaling issue?",
                    "What were the symptoms of the cooldown misconfiguration?",
                    "Why did the team initially miss the autoscaling problem?",
                    "What is the correct way to configure scale-up vs scale-down cooldowns?",
                    "How can I avoid similar autoscaling issues in my infrastructure?",
                    "What testing approach would have caught this earlier?",
                    "What were the key lessons learned from this incident?",
                ],
                "created_at": datetime.utcnow(),
            },
            {
                "company_id": "database_solutions",
                "name": "DataFlow Solutions",
                "short_summary": "DataFlow Solutions built a compliance reporting system that worked perfectly during initial testing but progressively slowed down as data accumulated. A missing composite index on the audit log table caused full table scans, eventually making quarterly reports take over 12 hours to generate.",
                "long_summary": """DataFlow Solutions launched their compliance reporting feature in Q1 with extensive testing on sample datasets containing approximately 50,000 audit records. All queries completed in under 2 seconds, and the team considered the feature production-ready. The database schema included basic indexes on primary keys and timestamp fields, which seemed adequate.

By Q2, with 500,000 records accumulated, users began noticing slower report generation times of 15-30 seconds. The team attributed this to expected database growth and deprioritized investigation. The query pattern involved filtering by user_id, date_range, and action_type simultaneously—a combination that wasn't indexed as a composite.

As the system grew to 2 million records by Q3, the quarterly compliance report began timing out. The database was performing sequential scans across the entire audit_log table for each filtered query. What started as acceptable performance degraded exponentially because the team had tested with datasets orders of magnitude smaller than production reality.

The issue reached crisis point during Q4 audit preparation when the report took over 12 hours to run and consumed 90% of database CPU, impacting other services. Database profiling revealed the full table scan pattern. The audit_log table had grown to 8 million rows, and each compliance query was reading all of them.

The solution required adding a composite index on (user_id, action_type, created_at), reducing query time from hours to milliseconds. The team also implemented query result caching and incremental report generation. Database load dropped by 85%.

This incident demonstrated that performance testing must use production-scale data volumes, and that index design should be driven by actual query patterns rather than assumptions. Small-scale testing can validate logic but completely miss scalability problems that only emerge with real-world data growth.""",
                "suggested_questions": [
                    "What caused the progressive slowdown in DataFlow's reporting system?",
                    "How did the missing index go undetected during initial testing?",
                    "What were the signs that database performance was degrading?",
                    "Why did the problem get worse over time instead of staying constant?",
                    "What is a composite index and when should it be used?",
                    "How can I test for database performance issues before they reach production?",
                    "What monitoring would have caught this problem earlier?",
                    "What are best practices for indexing audit log tables?",
                ],
                "created_at": datetime.utcnow(),
            },
            {
                "company_id": "storage_systems",
                "name": "CloudStore Systems",
                "short_summary": "CloudStore Systems implemented an S3 lifecycle policy to reduce storage costs, but accidentally configured it to delete compliance audit logs after 90 days. The mistake went unnoticed for eight months until a regulatory audit requested historical data that no longer existed, resulting in compliance violations and financial penalties.",
                "long_summary": """CloudStore Systems faced increasing AWS bills due to exponential growth in stored files. In January, a junior DevOps engineer was tasked with implementing lifecycle policies to automatically transition old data to cheaper storage tiers and delete temporary files. The engineer created a policy targeting the company's main S3 bucket with rules to delete objects older than 90 days in folders matching pattern 'logs/*'.

The policy was tested in a staging environment and successfully deleted old application logs and temporary debug files, saving significant costs. It was promoted to production without additional review. What the team missed was that the 'logs/*' pattern also matched 'audit_logs/*'—a critical compliance folder containing regulatory records that legally required 7-year retention.

For eight months, the lifecycle policy silently deleted audit logs older than 90 days. No alerts triggered because the deletions were intentional from AWS's perspective. The engineering team celebrated cost savings of $3,200 monthly. No one accessed the old audit logs during this period, so the deletion went completely unnoticed.

In September, during a routine compliance audit, regulators requested transaction records from the previous fiscal year for review. The compliance team confidently submitted the request to engineering, expecting immediate retrieval. Instead, they discovered that all audit logs from before June had been permanently deleted, leaving an eight-month gap in compliance records.

The investigation revealed that retention policies were never formally documented, audit log access was never monitored or tested, and lifecycle rules were implemented without legal/compliance review. The company faced regulatory fines, had to implement emergency backup restoration procedures (which only recovered 40% of deleted logs from secondary sources), and completely restructured their data governance processes.

The fix required separating audit logs into dedicated buckets with explicit retention policies, implementing S3 Object Lock for compliance data, adding bucket policy guards against lifecycle deletion, and establishing a compliance review gate for all infrastructure changes affecting data retention. The incident cost $180,000 in fines and remediation.""",
                "suggested_questions": [
                    "How did the S3 lifecycle policy delete the wrong data?",
                    "Why didn't anyone notice the audit logs were being deleted for 8 months?",
                    "What testing was done before the lifecycle policy went to production?",
                    "How should compliance data be protected from accidental deletion?",
                    "What is S3 Object Lock and when should it be used?",
                    "What monitoring and alerting would have prevented this issue?",
                    "How can I ensure lifecycle policies don't affect critical data?",
                    "What are best practices for data retention and governance in cloud storage?",
                ],
                "created_at": datetime.utcnow(),
            },
            {
                "company_id": "distributed_apps",
                "name": "MicroServe Apps",
                "short_summary": "MicroServe Apps implemented aggressive retry logic in their payment microservice to handle transient network failures, but the implementation failed to distinguish between temporary and permanent errors. This caused legitimate payment failures to be masked by endless retries, leading to customer complaints and financial discrepancies.",
                "long_summary": """MicroServe Apps built their payment processing system with resilience as a top priority. The architecture included a retry mechanism with exponential backoff to handle transient network issues, temporary payment gateway unavailability, and intermittent database connection problems. The implementation was straightforward: catch any exception from the payment gateway, wait with exponential backoff, retry up to 10 times.

During initial deployment and load testing, the retry logic worked beautifully. Simulated network failures and gateway timeouts were automatically resolved through retries, and the system appeared highly resilient. The team celebrated avoiding manual intervention for transient issues. However, the implementation had a critical flaw: it treated all errors identically.

In production, when users had legitimate payment failures—insufficient funds, expired cards, blocked accounts—the system would retry these operations 10 times over several minutes. From the payment gateway's perspective, this looked like duplicate payment attempts. From the user's perspective, the app showed a perpetual loading spinner before eventually failing without clear feedback.

The real problem emerged when customers reported being charged multiple times for single purchases. The retry logic, combined with eventual consistency issues, occasionally resulted in multiple successful charges for what should have been a single declined transaction. Customer support tickets accumulated, but the engineering team couldn't reproduce the issue in their test environment because they only tested with valid payment methods.

The breakthrough came during a finance reconciliation when accountants discovered thousands of small discrepancies between attempted payments and recorded transactions. Payment gateway logs revealed that 15% of all payment requests were unnecessary retries, and 0.3% resulted in duplicate charges that required manual refunds.

The fix required classifying payment gateway responses into retryable (timeouts, 503 errors) and non-retryable (invalid card, insufficient funds, authorization declined) categories. Permanent failures were immediately surfaced to users with clear error messages. Retry logic was restricted to confirmed transient issues with distributed idempotency keys to prevent duplicates. The system also implemented circuit breakers to fail fast when the payment gateway reported degraded status.

This incident illustrated that retry logic is not a universal solution—it must understand error semantics. Resilience patterns designed for infrastructure failures can mask application-level problems and create new failure modes when applied indiscriminately.""",
                "suggested_questions": [
                    "What went wrong with MicroServe's payment retry logic?",
                    "How did aggressive retries cause duplicate charges?",
                    "Why didn't testing catch the retry logic problems?",
                    "What types of payment errors should be retried vs failed immediately?",
                    "How can I implement idempotent payment processing?",
                    "What is a circuit breaker and when should it be used?",
                    "How should error handling differ between transient and permanent failures?",
                    "What monitoring and alerting would have caught this issue earlier?",
                ],
                "created_at": datetime.utcnow(),
            },
        ]

        self.collection.insert_many(companies_data)
        print(f"Seeded {len(companies_data)} demo companies")


class ChatHistory:
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["donna"]
        self.collection = self.db["chat_history"]

    def create_session(self, user_id: str, company_id: str) -> str:
        session_id = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "company_id": company_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self.collection.insert_one(session)
        return session_id

    def add_message(
        self, session_id: str, role: str, content: str, context_used: List[Dict] = None
    ) -> Dict:
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow(),
        }

        if context_used:
            message["context_used"] = context_used

        result = self.collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        if result.modified_count > 0:
            return {"success": True, "session_id": session_id}
        return {"success": False, "error": "Session not found"}

    def get_session(self, session_id: str) -> Optional[Dict]:
        session = self.collection.find_one({"session_id": session_id}, {"_id": 0})
        return session

    def get_user_sessions(
        self, user_id: str, company_id: Optional[str] = None, limit: int = 50
    ) -> List[Dict]:
        query = {"user_id": user_id}
        if company_id:
            query["company_id"] = company_id

        sessions = list(
            self.collection.find(query, {"_id": 0})
            .sort("updated_at", -1)
            .limit(limit)
        )
        return sessions

    def get_session_messages(self, session_id: str) -> List[Dict]:
        session = self.collection.find_one(
            {"session_id": session_id}, {"_id": 0, "messages": 1}
        )
        if session:
            return session.get("messages", [])
        return []


class CompanyDataStore:
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["donna"]
        self.collection = self.db["company_data"]

    def store_data(self, company_id: str, data_items: List[Dict]) -> Dict:
        if not isinstance(data_items, list):
            data_items = [data_items]

        documents = []
        for item in data_items:
            if not isinstance(item, dict):
                continue

            doc = {
                "company_id": company_id,
                "source": item.get("source", "custom"),
                "data": item,
                "ingested_at": datetime.utcnow(),
            }
            documents.append(doc)

        if documents:
            result = self.collection.insert_many(documents)
            return {
                "success": True,
                "items_stored": len(result.inserted_ids),
                "inserted_ids": [str(id) for id in result.inserted_ids],
            }

        return {"success": False, "error": "No valid documents to store"}

    def get_company_data(
        self, company_id: str, source: Optional[str] = None, limit: int = 100
    ) -> List[Dict]:
        query = {"company_id": company_id}
        if source:
            query["source"] = source

        results = list(
            self.collection.find(query, {"_id": 0}).sort("ingested_at", -1).limit(limit)
        )
        return results

    def get_data_stats(self, company_id: str) -> Dict:
        pipeline = [
            {"$match": {"company_id": company_id}},
            {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        ]

        stats = list(self.collection.aggregate(pipeline))
        total = sum(s["count"] for s in stats)

        return {
            "company_id": company_id,
            "total_items": total,
            "by_source": {s["_id"]: s["count"] for s in stats},
        }


if __name__ == "__main__":
    metadata = CompanyMetadata()
    metadata.seed_demo_companies()
