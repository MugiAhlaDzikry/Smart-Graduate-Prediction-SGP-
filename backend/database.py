import os

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase = None

def get_supabase():
    """Lazy-load Supabase client to avoid import errors if package is missing."""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables. Check backend/.env")
        from supabase import create_client  # type: ignore
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase
