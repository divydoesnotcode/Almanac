"""
Almanac — Database Connection Verifier

Run this standalone script to test your PostgreSQL / Supabase connection:
    python scripts/test_db_connection.py
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables from .env
load_dotenv()

def test_connection():
    # 1. Check for full DATABASE_URL or individual variables
    raw_url = os.getenv("DATABASE_URL")

    if not raw_url:
        user = os.getenv("user") or os.getenv("USER")
        password = os.getenv("password") or os.getenv("PASSWORD")
        host = os.getenv("host") or os.getenv("HOST")
        port = os.getenv("port") or os.getenv("PORT") or "6543"
        dbname = os.getenv("dbname") or os.getenv("DBNAME") or "postgres"

        if user and password and host:
            raw_url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}?sslmode=require"
        else:
            print("❌ No DATABASE_URL or host/user/password credentials found in .env")
            sys.exit(1)

    # 2. Normalize to psycopg3 synchronous driver for test script
    # (FastAPI backend uses psycopg3 async engine)
    sync_url = raw_url
    if sync_url.startswith("postgresql+psycopg2://"):
        sync_url = sync_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    elif sync_url.startswith("postgresql://"):
        sync_url = sync_url.replace("postgresql://", "postgresql+psycopg://", 1)

    masked_url = sync_url.split("@")[-1] if "@" in sync_url else sync_url
    print(f"Connecting to: ...@{masked_url}")

    try:
        engine = create_engine(sync_url, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print(" Connection successful!")
            print(f"PostgreSQL Version: {result}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        print("\nTroubleshooting tips:")
        print("1. Verify your password in .env has no unencoded special characters.")
        print("2. For Supabase, use port 6543 (session pooler) with ?sslmode=require.")
        print("3. Ensure your IP is not blocked by firewall rules.")

if __name__ == "__main__":
    test_connection()
