from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
MISTRAL_API_KEY = os.environ["MISTRAL_API_KEY"]
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "snapshots")
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

if not all([SUPABASE_URL, SUPABASE_KEY, MISTRAL_API_KEY, SUPABASE_BUCKET]):
    raise RuntimeError("Missing required environment variables. Check your .env file.")