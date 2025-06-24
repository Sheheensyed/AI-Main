from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import google.generativeai as genai
from hapi_prompt import prompt_template
import json

# Load env and setup
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]
cases_collection = db["cases"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

class MappingRequest(BaseModel):
    steps: List[str]
    case_id: str

@app.post("/generate-mapped-steps")
def generate_mapped_steps(data: MappingRequest):
    try:
        print(f"Received case_id: {data.case_id}")
        print(f"Received steps: {data.steps}")

        # ✅ Fetch device name from DB
        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        device = case.get("device")
        if not device:
            raise HTTPException(status_code=400, detail="Device not found in case")

        print(f"Found device: {device}")

        # ✅ Prepare the Gemini prompt
        steps_text = "\n".join(data.steps)
        prompt = prompt_template.format(device=device, steps=steps_text)

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        print("🧠 Gemini Raw Output:\n", raw_output)

        # ✅ Parse each line of Gemini output into list of dicts
        mapped_steps = []
        for line in raw_output.splitlines():
            try:
                mapped_steps.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"⚠️ Skipping malformed line: {line}")

        if not mapped_steps:
            raise HTTPException(status_code=500, detail="Failed to parse mapped steps")

        # ✅ Save to DB
        result = cases_collection.update_one(
            {"_id": ObjectId(data.case_id)},
            {"$set": {"mapped_steps": mapped_steps}}
        )

        return {
            "case_id": data.case_id,
            "mapped_steps": mapped_steps
        }

    except Exception as e:
        print("🔥 Internal server error:", e)
        raise HTTPException(status_code=500, detail=str(e))
