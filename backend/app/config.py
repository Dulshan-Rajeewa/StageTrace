from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "snapshots")

print([SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY, SUPABASE_BUCKET])

if not all([SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY, SUPABASE_BUCKET]):
    raise RuntimeError("Missing required environment variables. Check your .env file.")