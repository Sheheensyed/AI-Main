from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import base64
import os
import json
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import google.generativeai as genai
from hapi_prompt import prompt_template

# --- Load environment variables ---
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")

# --- Gemini configuration ---
genai.configure(api_key=gemini_api_key)

# --- MongoDB setup ---
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]

# --- Ensure 'images' collection exists ---
if "images" not in db.list_collection_names():
    db.create_collection("images")
    print("✅ Created 'images' collection manually")

cases_collection = db["cases"]
templates_collection = db["templates"]
images_collection = db["images"]

# --- Template constant ---
TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")

# --- FastAPI setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve static images ---
IMAGES_DIR = "images"
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# --- ObjectId Pydantic adapter ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# --- Pydantic Models ---
class MappingRequest(BaseModel):
    steps: List[str]
    case_id: str

class CaptureRequest(BaseModel):
    base64_image: str
    step: str
    case_id: str

class ImageDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    case_id: PyObjectId
    step: str
    filename: str
    created_at: Optional[str]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        orm_mode = True

# --- Endpoint: Generate mapped steps (same as before) ---
@app.post("/generate-mapped-steps")
def generate_mapped_steps(data: MappingRequest):
    try:
        print(f"📥 Received steps for case_id: {data.case_id}")

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        device = case.get("device")
        if not device:
            raise HTTPException(status_code=400, detail="Device not in case")

        steps_text = "\n".join(data.steps)
        prompt = prompt_template.format(device=device, steps=steps_text)

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        print("🧠 Gemini Output:\n", raw_output)

        mapped_steps = []
        for line in raw_output.splitlines():
            try:
                mapped_steps.append(json.loads(line))
            except json.JSONDecodeError:
                print("⚠️ Malformed step line skipped:", line)

        if not mapped_steps:
            raise HTTPException(status_code=500, detail="No valid steps parsed")

        template_doc = templates_collection.find_one({"_id": TEMPLATE_OBJECT_ID})
        if not template_doc:
            raise HTTPException(status_code=500, detail="Template not found")

        dut_key = template_doc["DUTS"][0]
        template_dut = template_doc[dut_key]
        screens = template_dut.get("SCREENS", {})
        screen_key = list(screens.keys())[0]
        screen_data = screens.get(screen_key, {})
        elements = screen_data.get("elements", {})
        ocr_fields = screen_data.get("ocr", {})

        for step in mapped_steps:
            param = step.get("parameter")
            if not param:
                continue

            if param.endswith("_icon"):
                image_data = elements.get(param, [None, None, None, None])[3]
                if not image_data:
                    icon_key = param.replace("_icon", "")
                    image_data = elements.get(icon_key, [None, None, None, None])[3]
                if image_data:
                    step["image"] = image_data
            elif param in ocr_fields:
                step[param] = ocr_fields[param]

        cases_collection.update_one(
            {"_id": ObjectId(data.case_id)},
            {"$set": {"mapped_steps": mapped_steps}}
        )

        return {"case_id": data.case_id, "mapped_steps": mapped_steps}

    except Exception as e:
        print("🔥 Step generation error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# --- Endpoint: Save captured image ---
@app.post("/capture_screen")
async def capture_screen(data: CaptureRequest):
    try:
        print(f"📸 Capturing image for step: {data.step}")

        if not data.base64_image or len(data.base64_image) < 100:
            raise HTTPException(status_code=400, detail="Invalid or empty base64 image")

        try:
            image_data = base64.b64decode(data.base64_image)
        except Exception as decode_err:
            raise HTTPException(status_code=400, detail=f"Base64 decode failed: {decode_err}")

        filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        image_path = os.path.join(IMAGES_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(image_data)

        image_doc = ImageDocument(
            case_id=ObjectId(data.case_id),
            step=data.step,
            filename=filename,
            created_at=datetime.utcnow().isoformat()
        )

        try:
            result = images_collection.insert_one(image_doc.dict(by_alias=True))
            print(f"✅ Inserted image to MongoDB with _id: {result.inserted_id}")
        except Exception as insert_err:
            print("❌ MongoDB insert failed:", insert_err)
            raise HTTPException(status_code=500, detail="Insert to Mongo failed")

        image_url = f"http://localhost:8000/images/{filename}"
        return {"image_url": image_url}

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))
