import os
# import logging
# from datetime import datetime
# from typing import Dict, List, Optional
from pymongo import MongoClient
# from bson import ObjectId
import google.generativeai as genai
# from dataclasses import dataclass
from dotenv import load_dotenv
import json
from prompt_temp import prompt_template

load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)



def get_device_query():
    client = MongoClient(mongo_url,
                            tls=True,
                            tlsAllowInvalidCertificates=True)

    db = client["TestAutomation"]
    collection = db["cases"]
    latest = collection.find_one(sort=[("_id", -1)])

    device= latest.get("device", "").strip()
    user_query= latest.get("user_query", "").strip()
    # model= latest.get("model", "").strip()
    client.close()  
    return device,user_query


# def step(device,user_query):
#     if user_query=="salim":
#         return "hai"
#     else
#         return "wrong"


def step(device, user_query):
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    final_prompt = prompt_template.format(device_name=device, query=user_query)

    response = model.generate_content(final_prompt)
    gemini_reply = response.text

    # Try to parse reply as list
    try:
        # Try to parse as JSON
        steps = json.loads(gemini_reply)

        if not isinstance(steps, list):
            steps = [gemini_reply]
    except Exception as e:
        steps = [gemini_reply]

    return steps


if __name__ == "__main__":
    device, user_query = get_device_query()

    if user_query:
        result = step(device,user_query)
        print(json.dumps({"steps": result}, indent=2))
    else:
        print(json.dumps({"steps": [ "No user_query found in MongoDB." ]}, indent=2))
