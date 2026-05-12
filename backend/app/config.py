from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "snapshots")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, SUPABASE_BUCKET]):
    raise RuntimeError("Missing required environment variables. Check your .env file.")