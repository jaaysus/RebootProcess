import requests

# 1. Base URL for your API
BASE_URL = "http://localhost:5148/api/Epn/code/"

# 2. Your list of codes
codes_to_check = [
    "_CHCT-14489-KAA",
    "_HHCT-14A464-HA_CLOSE",
    "32165K5W8",
    "3216681V4",
    "3216721D9",
    "3216727P6",
    "3216766J1",
    "321679912",
    "E04703000",
    "E11426600",
    "E11446701",
    "E11447801",
    "E41595900"
]

print("--- STARTING API REQUESTS ---\n")

# 3. Loop through each code and hit the API
for code in codes_to_check:
    # Construct the full URL for the specific code
    url = f"{BASE_URL}{code}"
    
    try:
        # Make the GET request
        response = requests.get(url)
        
        print(f"Code: {code}")
        print(f"URL:  {url}")
        print(f"Status: {response.status_code}")
        
        # Try to print as formatted JSON, fallback to plain text if it's not JSON
        try:
            print("Response:", response.json())
        except ValueError:
            print("Response:", response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to API for code {code}: {e}")
        
    print("-" * 50)  # Visual separator between requests