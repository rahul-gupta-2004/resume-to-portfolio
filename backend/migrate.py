import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate():
    print("Checking database schema...")
    try:
        # Check if tier exists
        res = supabase.table("profiles").select("tier").limit(1).execute()
        print("Column 'tier' exists.")
    except Exception as e:
        print(f"Error checking 'tier': {e}")
        print("You might need to manually add 'tier' (text, default 'free') to 'profiles' table in Supabase SQL editor.")

    try:
        # Check if custom_slug exists
        res = supabase.table("profiles").select("custom_slug").limit(1).execute()
        print("Column 'custom_slug' exists.")
    except Exception as e:
        print(f"Error checking 'custom_slug': {e}")
        print("You might need to manually add 'custom_slug' (text, unique) to 'profiles' table in Supabase SQL editor.")

    try:
        # Try to add columns if they don't exist (if RPC exists or via raw SQL if enabled)
        # Note: Supabase doesn't allow alter table via anon/service_role keys via HTTP easily without RPC.
        # But we'll try to insert a test record with these fields to see if it works.
        pass
    except:
        pass

if __name__ == "__main__":
    migrate()
