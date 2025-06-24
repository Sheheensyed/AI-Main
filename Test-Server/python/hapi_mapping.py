import os
from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv
import json
from hapi_prompt import prompt_template

# Load env
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

# Get device and user query from MongoDB
def get_device_steps():
    client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
    db = client["TestAutomation"]
    collection = db["cases"]    
    latest = collection.find_one(sort=[("_id", -1)])

    device = latest.get("device", "").strip()
    # user_query = latest.get("user_query", "").strip()
    steps=latest.get("steps",[])

    client.close()  
    return device, steps

# Step mapping only
def step_mapping(device, steps):
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    steps_text = "\n".join(steps)
    final_prompt = prompt_template.format(
        device_name=device,
        steps=steps_text
    )

    response = model.generate_content(final_prompt)
    mapped_steps = response.text

    return mapped_steps

# Main
if __name__ == "__main__":
    device, steps = get_device_steps()

    if steps:
        mapped_steps = step_mapping(device, steps)
        print(mapped_steps)
    else:
        print("No steps found in MongoDB.")