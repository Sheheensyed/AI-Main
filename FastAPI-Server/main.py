# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel, Field
# from typing import List, Optional
# from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
# from bson import ObjectId
# from datetime import datetime
# import base64
# import os
# import json
# from dotenv import load_dotenv
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import JSONResponse
# import google.generativeai as genai
# from hapi_prompt import prompt_template

# # --- Load environment variables ---
# load_dotenv()
# mongo_url = os.getenv("DATABASE")
# gemini_api_key = os.getenv("GEMINI_API_KEY")

# # --- Gemini configuration ---
# genai.configure(api_key=gemini_api_key)

# # --- MongoDB setup ---
# client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# db = client["TestAutomation"]

# # --- Ensure 'images' collection exists ---
# if "images" not in db.list_collection_names():
#     db.create_collection("images")
#     print("✅ Created 'images' collection manually")

# cases_collection = db["cases"]
# templates_collection = db["templates"]
# images_collection = db["images"]

# # --- Template constant ---
# TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")

# # --- FastAPI setup ---
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Adjust for production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- Serve static images ---
# IMAGES_DIR = "images"
# os.makedirs(IMAGES_DIR, exist_ok=True)
# app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# # --- ObjectId Pydantic adapter ---
# class PyObjectId(ObjectId):
#     @classmethod
#     def _get_validators_(cls):
#         yield cls.validate

#     @classmethod
#     def validate(cls, v, info):
#         if not ObjectId.is_valid(v):
#             raise ValueError("Invalid ObjectId")
#         return ObjectId(v)

#     @classmethod
#     def _get_pydantic_json_schema_(cls, core_schema, handler):
#         schema = handler(core_schema)
#         schema.update(type="string")
#         return schema

# # --- Pydantic Models ---
# class MappingRequest(BaseModel):
#     steps: List[str]
#     case_id: str

# class CaptureRequest(BaseModel):
#     base64_image: str
#     step: str
#     case_id: str

# class ImageDocument(BaseModel):
#     id: Optional[PyObjectId] = Field(default=None, alias="_id")
#     case_id: PyObjectId
#     step: str
#     filename: str
#     created_at: Optional[str]
#     device: Optional[str]  # ✅ Added device field

#     model_config = {
#         "validate_by_name": True,
#         "arbitrary_types_allowed": True,
#         "json_encoders": {ObjectId: str},
#         "from_attributes": True
#     }

# # --- Endpoint: Generate mapped steps ---
# @app.post("/generate-mapped-steps")
# def generate_mapped_steps(data: MappingRequest):
#     try:
#         print(f"📥 Received steps for case_id: {data.case_id}")

#         case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
#         if not case:
#             raise HTTPException(status_code=404, detail="Case not found")

#         device = case.get("device")
#         if not device:
#             raise HTTPException(status_code=400, detail="Device not in case")

#         steps_text = "\n".join(data.steps)
#         prompt = prompt_template.format(device=device, steps=steps_text)

#         model = genai.GenerativeModel("gemini-2.0-flash-exp")
#         response = model.generate_content(prompt)
#         raw_output = response.text.strip()
#         print("🧠 Gemini Output:\n", raw_output)

#         mapped_steps = []
#         for line in raw_output.splitlines():
#             try:
#                 mapped_steps.append(json.loads(line))
#             except json.JSONDecodeError:
#                 print("⚠ Malformed step line skipped:", line)

#         if not mapped_steps:
#             raise HTTPException(status_code=500, detail="No valid steps parsed")

#         template_doc = templates_collection.find_one({"_id": TEMPLATE_OBJECT_ID})
#         if not template_doc:
#             raise HTTPException(status_code=500, detail="Template not found")

#         dut_key = template_doc["DUTS"][0]
#         template_dut = template_doc[dut_key]
#         screens = template_dut.get("SCREENS", {})
#         screen_key = list(screens.keys())[0]
#         screen_data = screens.get(screen_key, {})
#         elements = screen_data.get("elements", {})
#         ocr_fields = screen_data.get("ocr", {})

#         for step in mapped_steps:
#             param = step.get("parameter")
#             if not param:
#                 continue

#             if param.endswith("_icon"):
#                 image_data = elements.get(param, [None, None, None, None])[3]
#                 if not image_data:
#                     icon_key = param.replace("_icon", "")
#                     image_data = elements.get(icon_key, [None, None, None, None])[3]
#                 if image_data:
#                     step["image"] = image_data
#             elif param in ocr_fields:
#                 step[param] = ocr_fields[param]

#         cases_collection.update_one(
#             {"_id": ObjectId(data.case_id)},
#             {"$set": {"mapped_steps": mapped_steps}}
#         )

#         return {"case_id": data.case_id, "mapped_steps": mapped_steps}

#     except Exception as e:
#         print("🔥 Step generation error:", e)
#         raise HTTPException(status_code=500, detail=str(e))

# # --- Endpoint: Save captured image ---
# @app.post("/capture_screen")
# async def capture_screen(data: CaptureRequest):
#     try:
#         print(f"📸 Capturing image for step: {data.step}")

#         if not data.base64_image or len(data.base64_image) < 100:
#             raise HTTPException(status_code=400, detail="Invalid or empty base64 image")

#         try:
#             image_data = base64.b64decode(data.base64_image)
#         except Exception as decode_err:
#             raise HTTPException(status_code=400, detail=f"Base64 decode failed: {decode_err}")

#         # --- Get device name from case ---
#         case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
#         if not case:
#             raise HTTPException(status_code=404, detail="Case not found")
#         device = case.get("device", "Unknown")

#         # --- Save image to disk ---
#         filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
#         image_path = os.path.join(IMAGES_DIR, filename)
#         with open(image_path, "wb") as f:
#             f.write(image_data)

#         # --- Save to MongoDB ---
#         image_doc = ImageDocument(
#             case_id=ObjectId(data.case_id),
#             step=data.step,
#             filename=filename,
#             created_at=datetime.utcnow().isoformat(),
#             device=device  # ✅ Save device name
#         )

#         try:
#             result = images_collection.insert_one(image_doc.dict(by_alias=True, exclude_none=True))
#             print(f"✅ Inserted image to MongoDB with _id: {result.inserted_id}")
#         except Exception as insert_err:
#             print("❌ MongoDB insert failed:", insert_err)
#             raise HTTPException(status_code=500, detail="Insert to Mongo failed")

#         image_url = f"http://localhost:8000/images/{filename}"
#         return {"image_url": image_url}

#     except Exception as e:
#         print("🔥 Image capture error:", e)
#         raise HTTPException(status_code=500, detail=str(e))
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
import google.generativeai as genai
from hapi_prompt import prompt_template
from exe_prompt import prompt_template_exe  # Make sure this file exists

from PIL import Image
import io

# --- Load environment variables ---
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")

# --- Configure Gemini ---
genai.configure(api_key=gemini_api_key)

# --- MongoDB setup ---
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]

cases_collection = db["cases"]
templates_collection = db["templates"]
images_collection = db["images"]

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

# --- ObjectId adapter ---
class PyObjectId(ObjectId):
    @classmethod
    def _get_validators_(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def _get_pydantic_json_schema_(cls, core_schema, handler):
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

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
    device: Optional[str]

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "from_attributes": True
    }

# --- Gemini AI helper ---
def get_action_recommendation(device: str, step: str, image_path: str):
    if not os.path.exists(image_path):
        return {"error": "Image not found", "path": image_path}

    try:
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
            image = Image.open(io.BytesIO(image_bytes))  # ✅ Convert to PIL Image

        prompt = prompt_template_exe.format(
            device=device,
            step=step
        )

        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        response = model.generate_content(
            [prompt, image],
            generation_config={"temperature": 0.4}
        )

        try:
            result = json.loads(response.text)
        except json.JSONDecodeError:
            result = {
                "error": "Failed to parse Gemini response",
                "raw_response": response.text
            }

        return result

    except Exception as e:
        return {"error": str(e)}

# --- Endpoint: Generate mapped steps ---
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
                print("⚠ Malformed step line skipped:", line)

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

# --- Endpoint: Capture screen and run Gemini ---
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

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        device = case.get("device", "Unknown")

        filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        image_path = os.path.join(IMAGES_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(image_data)

        image_doc = ImageDocument(
            case_id=PyObjectId(data.case_id),
            step=data.step,
            filename=filename,
            created_at=datetime.utcnow().isoformat(),
            device=device
)

        try:
            result = images_collection.insert_one(image_doc.dict(by_alias=True, exclude_none=True))
            print(f"✅ Inserted image to MongoDB with _id: {result.inserted_id}")
        except Exception as insert_err:
            print("❌ MongoDB insert failed:", insert_err)
            raise HTTPException(status_code=500, detail="Insert to Mongo failed")

        image_url = f"http://localhost:8000/images/{filename}"

        ai_result = get_action_recommendation(
            device=device,
            step=data.step,
            image_path=image_path
        )

        images_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"gemini_response": ai_result}}
        )

        return {
            "image_url": image_url,
            "ai_result": ai_result
        }

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))