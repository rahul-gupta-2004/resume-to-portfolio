import json
import re
from apify_client import ApifyClient
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Initialize Client
api_key = os.getenv("APIFY_API_TOKEN")
client = ApifyClient(api_key)

def extract_username(url):
    """Extracts the username from a LinkedIn URL using regex."""
    match = re.search(r"linkedin\.com/in/([^/?#]+)", url)
    if match:
        return match.group(1).strip('/')
    return None

def main():
    # 2. Get User Input
    profile_url = input("Enter LinkedIn Profile URL: ").strip()
    
    username = extract_username(profile_url)
    
    if not username:
        print("Error: Invalid LinkedIn URL.")
        return

    print(f"Extracted Username: {username}")
    print(f"Fetching data for {username}... Please wait.")

    try:
        # 3. Prepare Input
        # Setting both 'usernames' and 'username' ensures the actor uses the correct profile
        run_input = {
            "usernames": [username],
            "username": username,
            "proxy": { "useApifyProxy": True }
        }

        # 4. Run the Apify Actor
        run = client.actor("apimaestro/linkedin-profile-detail").call(run_input=run_input)

        # 5. Fetch Results from Dataset
        dataset_items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

        if dataset_items:
            # Get the first item from the results
            profile_data = dataset_items[0]
            
            # Print the formatted JSON data to the console
            print("\n--- Profile Data Found ---")
            print(json.dumps(profile_data, indent=4))
            
        else:
            print("No data found. The profile might be private or the URL is incorrect.")

    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    main()