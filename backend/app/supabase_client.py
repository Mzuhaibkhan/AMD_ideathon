import os
from supabase import create_client, Client
import re
import supabase.client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Bypass supabase-py JWT validation for new 'sb_' opaque tokens
_original_match = supabase.client.re.match
def _mock_match(pattern, string, flags=0):
    if isinstance(string, str) and string.startswith("sb_"):
        return True
    return _original_match(pattern, string, flags)
supabase.client.re.match = _mock_match

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _supabase = create_client(url, key)
    return _supabase


supabase = get_supabase()
