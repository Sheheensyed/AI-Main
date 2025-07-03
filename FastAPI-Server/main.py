from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import google.generativeai as genai
from hapi_prompt import prompt_template  # Make sure you define this elsewhere
import json
from fastapi.responses import JSONResponse
from datetime import datetime
from fastapi.staticfiles import StaticFiles 
import base64

# Load environment variables
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")

# Configure Gemini
genai.configure(api_key=gemini_api_key)

# MongoDB setup
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]
cases_collection = db["cases"]
templates_collection = db["templates"]
images_collection = db["images"]  # NEW collection for images

# Fixed template ID (replace this with your actual template ObjectId)
TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")

# FastAPI setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGES_DIR="images"
os.makedirs(IMAGES_DIR,exist_ok=True)
app.mount("/images",StaticFiles(directory=IMAGES_DIR),name="images")

# Request model
class MappingRequest(BaseModel):
    steps: List[str]
    case_id: str

# Capture request model
class CaptureRequest(BaseModel):
    base64_image: str
    step: str
    case_id: str

@app.post("/generate-mapped-steps")
def generate_mapped_steps(data: MappingRequest):
    try:
        print(f"Received case_id: {data.case_id}")
        print(f"Received steps: {data.steps}")

        # Step 1: Get the case
        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        device = case.get("device")
        if not device:
            raise HTTPException(status_code=400, detail="Device not found in case")

        print(f"Found device: {device}")

        # Step 2: Generate content using Gemini
        steps_text = "\n".join(data.steps)
        prompt = prompt_template.format(device=device, steps=steps_text)

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        print("🧠 Gemini Raw Output:\n", raw_output)

        # Step 3: Parse Gemini output
        mapped_steps = []
        for line in raw_output.splitlines():
            try:
                mapped_steps.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"⚠️ Skipping malformed line: {line}")

        if not mapped_steps:
            raise HTTPException(status_code=500, detail="Failed to parse mapped steps")

        # Step 4: Load template data
        template_doc = templates_collection.find_one({"_id": TEMPLATE_OBJECT_ID})
        if not template_doc:
            raise HTTPException(status_code=500, detail="Template not found")

        dut_key = template_doc["DUTS"][0]
        template_dut = template_doc[dut_key]

        # Dynamically get the first screen key in SCREENS
        screens = template_dut.get("SCREENS", {})
        if not screens:
            raise HTTPException(status_code=500, detail="No SCREENS in template")

        screen_key = list(screens.keys())[0]
        screen_data = screens.get(screen_key, {})

        elements = screen_data.get("elements", {})
        ocr_fields = screen_data.get("ocr", {})

        # Step 5: Enrich mapped_steps with images and OCR fields
        for step in mapped_steps:
            param = step.get("parameter")
            if not param:
                continue

            # If it's an icon param ending with "_icon"
            if param.endswith("_icon"):
                # param may be like "settings_icon"
                # But your elements keys also seem to have "_icon" suffix
                # So let's try direct lookup first
                image_data = elements.get(param, [None, None, None, None])[3]
                if not image_data:
                    # fallback: try removing '_icon' suffix if direct key missing
                    icon_key = param.replace("_icon", "")
                    image_data = elements.get(icon_key, [None, None, None, None])[3]

                if image_data:
                    step["image"] = image_data

            # If param matches an OCR field key
            elif param in ocr_fields:
                step[param] = ocr_fields[param]

        # Step 6: Save mapped_steps to DB
        cases_collection.update_one(
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


@app.post("/capture_screen")
async def capture_screen(data: CaptureRequest):
    try:
        base64_image = data.base64_image

        # Decode base64
        image_data = base64.b64decode(base64_image)

        # Save to file
        filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        image_path = os.path.join(IMAGES_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(image_data)

        # Save metadata + base64 in MongoDB
        images_collection.insert_one({
            "case_id": ObjectId(data.case_id),
            "step": data.step,
            "filename": filename,
            "base64_image": base64_image,
            "created_at": datetime.utcnow()
        })

        # Return image URL
        image_url = f"http://localhost:8000/images/{filename}"
        return JSONResponse(content={"image_url": image_url})

    except Exception as e:
        print("Error saving image:", e)
        raise HTTPException(status_code=500, detail=str(e))
    try:
        # Save base64 to DB
        captured_doc = {
            "case_id": request.case_id,
            "step": request.step,
            "base64_image": request.base64_image,
        }
        captured_images_collection.insert_one(captured_doc)

        # Decode and save image to file system
        img_data = base64.b64decode(request.base64_image)
        image_filename = f"{request.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        image_path = os.path.join(IMAGES_DIR, image_filename)

        with open(image_path, "wb") as f:
            f.write(img_data)

        image_url = f"http://localhost:8000/images/{image_filename}"

        return JSONResponse(content={"image_url": image_url})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))