from ingestor import DataIngestor
import os


def db_init():
    ingestor = DataIngestor()
    base_dir = "company_data"

    companies = [
        d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))
    ]

    print("Ingesting data")

    for company in companies:
        company_path = os.path.join(base_dir, company)
        ingestor.ingest_company(company, company_path)


db_init()
