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
from exe_prompt import prompt_template_exe
from function import abort, swipe,capture_screen,tap,get_text  
from db import templates_collection, cases_collection
from PIL import Image
import io


# --- Load environment variables ---
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")
capture_url = os.getenv("CAPTURE_SCREEN_URL")

# --- Configure Gemini ---
genai.configure(api_key=gemini_api_key)

# --- MongoDB setup ---
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]
cases_collection = db["cases"]
templates_collection = db["templates"]
images_collection = db["images"]

# TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")
# TEMPLATE_OBJECT_ID = ObjectId("686e44b08215320aecea7422")
TEMPLATE_OBJECT_ID = ObjectId("686f4970eb331def8f8c6ae1")

# --- FastAPI setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve static images ---
IMAGES_DIR = "images"
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# --- ObjectId Adapter ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

class StepExecutionRequest(BaseModel):
    case_id: str
    step: str
# --- Pydantic Models ---
class MappingRequest(BaseModel):
    steps: List[str]
    case_id: str

class CaptureRequest(BaseModel):
    base64_image: str
    step: str
    case_id: str

class ManualExecutionRequest(BaseModel):
    case_id:str 

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

def safe_text(text):
    return str(text).encode("utf-8","replace").decode("utf-8")


def get_action_history(case_id: str, step: str):
     previous_docs = images_collection.find({
        "case_id": ObjectId(case_id),
        "step": step,
        "action_result.status": {"$exists": True}
    }).sort("created_at", -1)
     
     history_lines = []
     for doc in previous_docs:
        action = doc.get("action_result", {}).get("step") or doc.get("action_result", {}).get("action")
        result = doc.get("action_result", {}).get("status")
        if action and result:
            # Ensure both are strings and UTF-8 safe
            safe_action = safe_text(action)
            safe_result = safe_text(result)
            history_lines.append(f"- {safe_action}: {safe_result}")

     if not history_lines:
         return "- No prior actions attempted."

     return "\n".join(history_lines)



# --- Gemini Helper ---
def get_action_recommendation(device: str, step: str, image_path: str,case_id:str):
    if not os.path.exists(image_path):
        return {"error": "Image not found", "path": image_path}

    try:
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
            image = Image.open(io.BytesIO(image_bytes))

# Get Action History string
        action_history=get_action_history(case_id=case_id,step=step)

# Format Prompt
        prompt = prompt_template_exe.format(
            device=device, step=step,
            action_history=action_history
            )

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(
            [prompt, image],
            generation_config={"temperature": 0.4}
        )

        raw_text = response.text.strip()

        # Cleanup
        if raw_text.lower().startswith("json"):
            raw_text = raw_text[4:].strip()
        elif raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.replace("```", "").strip()

        try:
            result = json.loads(raw_text)
        except json.JSONDecodeError as e:
            result = {
                "error": f"Failed to parse Gemini response: {e}",
                "raw_response": response.text
            }

        return result

    except Exception as e:
        return {"error": str(e)}

# def get_latest_base64_image(case_id: str) -> str:
#     # Find the most recent image for this case
#     doc = images_collection.find_one(
#         {"case_id": ObjectId(case_id)},
#         sort=[("created_at", -1)]
#     )
#     if not doc:
#         raise ValueError("No images found for case.")

#     image_path = os.path.join(IMAGES_DIR, doc["filename"])
#     if not os.path.exists(image_path):
#         raise FileNotFoundError(f"Image not found: {image_path}")

#     with open(image_path, "rb") as img_file:
#         encoded = base64.b64encode(img_file.read()).decode("utf-8")
#         return encoded
def fetch_fresh_screenshot():
    try:
        img_base64 = capture_screen()
        print("✅ Screenshot captured successfully.")
        return img_base64
    except Exception as e:
        print("❌ Error:", e)
        raise


def get_latest_base64_image(case_id: str, exclude_image_id: ObjectId) -> str:
    doc = images_collection.find_one(
        {
            "case_id": ObjectId(case_id),
            "_id": {"$ne": exclude_image_id}
        },
        sort=[("created_at", -1)]
    )
    if not doc:
        raise ValueError("No newer images found for case.")

    image_path = os.path.join(IMAGES_DIR, doc["filename"])
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")

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

        # ✅ Always use the latest steps directly from DB:
        steps_text = "\n".join(case.get("steps", []))
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

            # ✅ Handle _icon and _option parameters
            if param.endswith("_icon") or param.endswith("_option"):
                image_data = elements.get(param, [None, None, None, None])[3]
                if not image_data:
                    fallback_key = param.replace("_icon", "").replace("_option", "")
                    image_data = elements.get(fallback_key, [None, None, None, None])[3]
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


@app.post("/execute_with_gemini")
async def execute_with_gemini(data: CaptureRequest):
    try:
        print(f"\U0001F4F8 Starting action loop for step: {data.step}")

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        device = case.get("device", "Unknown")

        attempt = 1
        final_response = None

        while True:
            print(f"🔁 Attempt #{attempt} for step: {data.step}")

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
                created_at=datetime.utcnow().isoformat(),
                device=device
            )
            img_result = images_collection.insert_one(image_doc.dict(by_alias=True, exclude_none=True))

            ai_result = get_action_recommendation(
                device=device,
                step=data.step,
                image_path=image_path,
                case_id=data.case_id
            )

            action_result = {}
            action_name = ai_result.get("next_api", "").lower()

            ACTION_HANDLERS = {
                "abort": abort,
                "swipe_up": swipe,
                "swipe_down": swipe,
                "swipe_left": swipe,
                "swipe_right": swipe,
                "detect_and_tap": tap
            }

            if action_name in ["complete", "abort"]:
                print(f"✅ Step ended with action: {action_name}")
                action_result = {
                    "status": "done" if action_name == "complete" else "error",
                    "step": data.step,
                    "message": f"Step {action_name}ed successfully",
                    "action": action_name
                }
                final_response = {
                    "image_url": f"http://localhost:8000/images/{filename}",
                    "ai_result": ai_result,
                    "action_result": action_result
                }
                break

            if action_name in ACTION_HANDLERS:
                action_input = {
                    "step": action_name,
                    "case_id": data.case_id
                }
                action_result = ACTION_HANDLERS[action_name](action_input)

                if "swipe" in action_name and "direction" not in action_result:
                    action_result["action"] = "swipe"
                    action_result["direction"] = action_name

            update_data = {
                "gemini_response": ai_result,
                "action_result": action_result
            }
            if "coordinates" in action_result:
                update_data["coordinates"] = action_result["coordinates"]

            images_collection.update_one(
                {"_id": img_result.inserted_id},
                {"$set": update_data}
            )

            print("🔄 Re-capturing next screen after action...")
            data.base64_image = fetch_fresh_screenshot()



            attempt += 1

        return final_response

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute_with_gemini")
async def execute_with_gemini(data: CaptureRequest):
    try:
        print(f"\U0001F4F8 Starting action loop for step: {data.step}")

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        device = case.get("device", "Unknown")

        attempt = 1
        final_response = None

        while True:
            print(f"🔁 Attempt #{attempt} for step: {data.step}")

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
                created_at=datetime.utcnow().isoformat(),
                device=device
            )
            img_result = images_collection.insert_one(image_doc.dict(by_alias=True, exclude_none=True))

            ai_result = get_action_recommendation(
                device=device,
                step=data.step,
                image_path=image_path,
                case_id=data.case_id
            )

            action_result = {}
            action_name = ai_result.get("next_api", "").lower()

            ACTION_HANDLERS = {
                "abort": abort,
                "swipe_up": swipe,
                "swipe_down": swipe,
                "swipe_left": swipe,
                "swipe_right": swipe,
                "detect_and_tap": tap
            }

            if action_name in ["complete", "abort"]:
                print(f"✅ Step ended with action: {action_name}")
                action_result = {
                    "status": "done" if action_name == "complete" else "error",
                    "step": data.step,
                    "message": f"Step {action_name}ed successfully",
                    "action": action_name
                }
                final_response = {
                    "image_url": f"http://localhost:8000/images/{filename}",
                    "ai_result": ai_result,
                    "action_result": action_result
                }
                break

            if action_name in ACTION_HANDLERS:
                action_input = {
                    "step": action_name,
                    "case_id": data.case_id
                }
                action_result = ACTION_HANDLERS[action_name](action_input)

                if "swipe" in action_name and "direction" not in action_result:
                    action_result["action"] = "swipe"
                    action_result["direction"] = action_name

            update_data = {
                "gemini_response": ai_result,
                "action_result": action_result
            }
            if "coordinates" in action_result:
                update_data["coordinates"] = action_result["coordinates"]

            images_collection.update_one(
                {"_id": img_result.inserted_id},
                {"$set": update_data}
            )

            print("🔄 Re-capturing next screen after action...")
            data.base64_image = fetch_fresh_screenshot()



            attempt += 1

        return final_response

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/execute_manual_step")
async def execute_manual_step(data: StepExecutionRequest):  # expects case_id + step_name
    try:
        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        mapped_steps = case.get("mapped_steps", [])
        step_info = next((step for step in mapped_steps if step.get("step") == data.step), None)

        if not step_info:
            raise HTTPException(status_code=404, detail="Step not found in mapped steps")

        ACTION_HANDLERS = {
            "touch_by_icon": tap,
            "abort": abort,
            "swipe_up": swipe,
            "swipe_down": swipe,
            "swipe_left": swipe,
            "swipe_right": swipe,
            "ocr": get_text
        }

        step_name = step_info.get("step")
        api_type = step_info.get("api", "").lower()
        parameter = step_info.get("parameter", "")
        base64_img = step_info.get("image", "")

        if api_type not in ACTION_HANDLERS:
            return {
                "step": step_name,
                "status": "skipped",
                "reason": f"Unsupported api type: {api_type}"
            }

        print(f"🚀 Executing step: {step_name} ({api_type})")

        if api_type == "ocr":
            ocr_result = get_text()
            return {
                "step": step_name,
                "status": "completed" if ocr_result.get("status") == "success" else "failed",
                "ocr_result": ocr_result,
                "extracted_value": ocr_result.get("extracted_value", "")
            }

        if not base64_img or len(base64_img) < 100:
            return {
                "step": step_name,
                "status": "skipped",
                "reason": "No valid base64 image found"
            }

        action_input = {
            "step": step_name,
            "case_id": data.case_id
        }

        attempt = 0
        all_attempts = []
        success = False
        MAX_RETRIES = 5

        while attempt < MAX_RETRIES:
            attempt += 1
            print(f"🔁 Attempt #{attempt}: tap")

            tap_result = tap(action_input)
            all_attempts.append({"attempt": attempt, "type": "tap", "result": tap_result})

            response_data = tap_result.get("response_data", "").upper()
            if response_data == "FOUND":
                success = True
                break

            direction = "swipe_left" if parameter.endswith("_icon") else "swipe_up"
            print(f"👈 Tap failed. Swiping {direction}...")

            swipe_result = swipe({
                "step": direction,
                "case_id": data.case_id
            })
            all_attempts.append({"attempt": attempt, "type": direction, "result": swipe_result})

        return {
            "step": step_name,
            "status": "completed" if success else "failed",
            "attempts": all_attempts
        }

    except Exception as e:
        print("🔥 Step execution error:", e)
        raise HTTPException(status_code=500, detail=str(e))
