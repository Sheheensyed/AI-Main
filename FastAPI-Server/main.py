# # from fastapi import FastAPI, HTTPException
# # from pydantic import BaseModel
# # from typing import List
# # from fastapi.middleware.cors import CORSMiddleware
# # from pymongo import MongoClient
# # from bson import ObjectId
# # import os
# # from dotenv import load_dotenv
# # import google.generativeai as genai
# # from hapi_prompt import prompt_template
# # import json

# # # Load env and setup
# # load_dotenv()
# # mongo_url = os.getenv("DATABASE")
# # gemini_api_key = os.getenv("GEMINI_API_KEY")
# # genai.configure(api_key=gemini_api_key)

# # client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# # db = client["TestAutomation"]
# # cases_collection = db["cases"]

# # app = FastAPI()

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
# # )

# # class MappingRequest(BaseModel):
# #     steps: List[str]
# #     case_id: str

# # @app.post("/generate-mapped-steps")
# # def generate_mapped_steps(data: MappingRequest):
# #     try:
# #         print(f"Received case_id: {data.case_id}")
# #         print(f"Received steps: {data.steps}")

# #         # ✅ Fetch device name from DB
# #         case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
# #         if not case:
# #             raise HTTPException(status_code=404, detail="Case not found")

# #         device = case.get("device")
# #         if not device:
# #             raise HTTPException(status_code=400, detail="Device not found in case")

# #         print(f"Found device: {device}")

# #         # ✅ Prepare the Gemini prompt
# #         steps_text = "\n".join(data.steps)
# #         prompt = prompt_template.format(device=device, steps=steps_text)

# #         model = genai.GenerativeModel("gemini-2.0-flash-exp")
# #         response = model.generate_content(prompt)
# #         raw_output = response.text.strip()
# #         print("🧠 Gemini Raw Output:\n", raw_output)

# #         # ✅ Parse each line of Gemini output into list of dicts
# #         mapped_steps = []
# #         for line in raw_output.splitlines():
# #             try:
# #                 mapped_steps.append(json.loads(line))
# #             except json.JSONDecodeError:
# #                 print(f"⚠️ Skipping malformed line: {line}")

# #         if not mapped_steps:
# #             raise HTTPException(status_code=500, detail="Failed to parse mapped steps")

# #         # ✅ Save to DB
# #         result = cases_collection.update_one(
# #             {"_id": ObjectId(data.case_id)},
# #             {"$set": {"mapped_steps": mapped_steps}}
# #         )

# #         return {
# #             "case_id": data.case_id,
# #             "mapped_steps": mapped_steps
# #         }

# #     except Exception as e:
# #         print("🔥 Internal server error:", e)
# #         raise HTTPException(status_code=500, detail=str(e))



# # from fastapi import FastAPI, HTTPException, Request
# # from fastapi.middleware.cors import CORSMiddleware
# # from pydantic import BaseModel
# # from typing import List
# # from pymongo import MongoClient
# # from bson import ObjectId
# # from dotenv import load_dotenv
# # import google.generativeai as genai
# # from hapi_prompt import prompt_template
# # import json
# # import re
# # import os

# # # Load environment variables
# # load_dotenv()
# # mongo_url = os.getenv("DATABASE")
# # gemini_api_key = os.getenv("GEMINI_API_KEY")
# # genai.configure(api_key=gemini_api_key)

# # # MongoDB setup
# # client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# # db = client["TestAutomation"]
# # cases_collection = db["cases"]
# # templates_collection = db["Templates"]

# # # FastAPI app
# # app = FastAPI()

# # # Enable CORS
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"]
# # )

# # # ----------- Models -----------
# # class MappingRequest(BaseModel):
# #     steps: List[str]
# #     case_id: str

# # # ----------- Route: Gemini Mapping -----------
# # @app.post("/generate-mapped-steps")
# # def generate_mapped_steps(data: MappingRequest):
# #     try:
# #         print(f"🔍 Mapping steps for case_id: {data.case_id}")

# #         # 1. Fetch the case
# #         case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
# #         if not case:
# #             raise HTTPException(status_code=404, detail="Case not found")

# #         device = case.get("device")
# #         if not device:
# #             raise HTTPException(status_code=400, detail="Device not found in case")

# #         # 2. Generate mapped steps using Gemini
# #         steps_text = "\n".join(data.steps)
# #         prompt = prompt_template.format(device=device, steps=steps_text)

# #         model = genai.GenerativeModel("gemini-2.0-flash-exp")
# #         response = model.generate_content(prompt)
# #         raw_output = response.text.strip()
# #         print("🧠 Gemini Output:\n", raw_output)

# #         # 3. Parse JSON objects from Gemini output
# #         json_objects = re.findall(r'\{.*?\}', raw_output, re.DOTALL)
# #         mapped_steps = []
# #         for obj in json_objects:
# #             try:
# #                 mapped_steps.append(json.loads(obj))
# #             except json.JSONDecodeError:
# #                 print("⚠️ Skipping invalid JSON:", obj)

# #         if not mapped_steps:
# #             raise HTTPException(status_code=500, detail="No valid mapped steps from Gemini")

# #         # 4. Fetch static template
# #         template = templates_collection.find_one({"_id": ObjectId("685cf3bb448535c5f96b1dd7")})
# #         if not template:
# #             raise HTTPException(status_code=404, detail="Template not found")

# #         screen = template.get("final", {}).get("SCREENS", {}).get("sall", {})
# #         elements = {k.lower(): v for k, v in screen.get("elements", {}).items()}
# #         ocr_data = {k.lower(): v for k, v in screen.get("ocr", {}).items()}

# #         # 5. Enrich mapped steps with image and OCR
# #         enriched_steps = []
# #         for step in mapped_steps:
# #             param_raw = step.get("parameter", "")
# #             param = param_raw.strip().lower()

# #             enriched = {
# #                 "step": step.get("step"),
# #                 "api": step.get("api"),
# #                 "parameter": param_raw
# #             }

# #             if param in elements:
# #                 enriched["image"] = elements[param].get("image", "")
# #                 print(f"🖼️ Image added for: {param}")

# #             if param in ocr_data:
# #                 enriched["ocr"] = ocr_data[param].get("text", "")
# #                 print(f"📖 OCR added for: {param}")

# #             enriched_steps.append(enriched)

# #         # 6. Update DB
# #         cases_collection.update_one(
# #             {"_id": ObjectId(data.case_id)},
# #             {"$set": {"mapped_steps": enriched_steps}}
# #         )

# #         return {
# #             "case_id": data.case_id,
# #             "mapped_steps": enriched_steps
# #         }

# #     except Exception as e:
# #         print("🔥 Gemini Mapping error:", e)
# #         raise HTTPException(status_code=500, detail=str(e))

# # # ----------- Route: Fallback HAPI Mapping -----------
# # @app.post("/hapi_mapping")
# # async def hapi_mapping(request: Request):
# #     try:
# #         body = await request.json()
# #         case_id = body.get("case_id")
# #         if not case_id:
# #             raise HTTPException(status_code=400, detail="Missing case_id")

# #         case_data = cases_collection.find_one({"_id": ObjectId(case_id)})
# #         if not case_data:
# #             raise HTTPException(status_code=404, detail="Case not found")

# #         template_id = case_data.get("template_id")
# #         if not template_id:
# #             raise HTTPException(status_code=400, detail="template_id missing in case")

# #         template = templates_collection.find_one({"_id": ObjectId(template_id)})
# #         if not template:
# #             raise HTTPException(status_code=404, detail="Template not found")

# #         # ✅ Correctly access nested elements and OCR data
# #         screen = template.get("final", {}).get("SCREENS", {}).get("sall", {})
# #         elements = screen.get("elements", {})
# #         ocr = screen.get("ocr", {})

# #         mapped_steps = []

# #         for step in case_data.get("steps", []):
# #             api = ""
# #             parameter = ""

# #             # Mapping logic
# #             if "tap" in step.lower():
# #                 api = "touch_by_icon"
# #                 match = re.search(r'(\w+_icon)', step.lower())
# #                 parameter = match.group(1) if match else ""

# #             elif "find" in step.lower() and "version" in step.lower():
# #                 api = "ocr"
# #                 match = re.search(r'(\w+_ocr_field)', step.lower())
# #                 parameter = match.group(1) if match else ""

# #             enriched_step = {
# #                 "step": step,
# #                 "api": api,
# #                 "parameter": parameter
# #             }

# #             # Add image or OCR if available
# #             if parameter in elements:
# #                 enriched_step["image"] = elements[parameter][-1]  # base64 image
# #             elif parameter in ocr:
# #                 enriched_step["ocr"] = ocr[parameter]

# #             mapped_steps.append(enriched_step)

# #         # Save mapped_steps to the DB
# #         cases_collection.update_one(
# #             {"_id": ObjectId(case_id)},
# #             {"$set": {"mapped_steps": mapped_steps}}
# #         )

# #         return {
# #             "case_id": case_id,
# #             "mapped_steps": mapped_steps
# #         }

# #     except Exception as e:
# #         print("🔥 HAPI Mapping error:", e)
# #         raise HTTPException(status_code=500, detail=str(e))


# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import List
# from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
# from bson import ObjectId
# import os
# from dotenv import load_dotenv
# import google.generativeai as genai
# from hapi_prompt import prompt_template  # Ensure this is defined elsewhere
# import json
# import re  # Added for cleaning Gemini output

# # Load environment variables
# load_dotenv()
# mongo_url = os.getenv("DATABASE")
# gemini_api_key = os.getenv("GEMINI_API_KEY")

# # Configure Gemini
# genai.configure(api_key=gemini_api_key)

# # MongoDB setup
# client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# db = client["TestAutomation"]
# cases_collection = db["cases"]
# templates_collection = db["templates"]

# # Fixed template ID (replace with your actual ObjectId)
# TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")

# # FastAPI setup
# app = FastAPI()
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Request model
# class MappingRequest(BaseModel):
#     steps: List[str]
#     case_id: str

# @app.post("/generate-mapped-steps")
# def generate_mapped_steps(data: MappingRequest):
#     try:
#         print(f"Received case_id: {data.case_id}")
#         print(f"Received steps: {data.steps}")

#         # Validate case_id format
#         if not ObjectId.is_valid(data.case_id):
#             raise HTTPException(status_code=400, detail="Invalid case_id format")

#         # Step 1: Get the case
#         case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
#         if not case:
#             raise HTTPException(status_code=404, detail="Case not found")

#         device = case.get("device")
#         if not device:
#             raise HTTPException(status_code=400, detail="Device not found in case")

#         print(f"Found device: {device}")

#         # Step 2: Generate content using Gemini
#         steps_text = "\n".join(data.steps)
#         prompt = prompt_template.format(device=device, steps=steps_text)

#         model = genai.GenerativeModel("gemini-2.0-flash-exp")
#         response = model.generate_content(prompt)
#         raw_output = response.text.strip()
#         print("🧠 Gemini Raw Output:\n", raw_output)

#         # Step 3: Clean Gemini output (remove markdown code fences)
#         cleaned_output = re.sub(r"```json|```", "", raw_output)

#         # Step 4: Parse mapped steps
#         mapped_steps = []
#         for line in cleaned_output.strip().splitlines():
#             try:
#                 mapped_steps.append(json.loads(line.strip()))
#             except json.JSONDecodeError:
#                 print(f"⚠️ Skipping malformed line: {line}")

#         if not mapped_steps:
#             raise HTTPException(status_code=500, detail="Failed to parse mapped steps")

#         # Step 5: Load template data
#         template_doc = templates_collection.find_one({"_id": TEMPLATE_OBJECT_ID})
#         if not template_doc:
#             raise HTTPException(status_code=500, detail="Template not found")

#         dut_key = template_doc["DUTS"][0]
#         template_dut = template_doc[dut_key]
#         screen_data = template_dut.get("SCREENS", {}).get("sall", {})
#         elements = screen_data.get("elements", {})
#         ocr_fields = screen_data.get("ocr", {})

#         # Step 6: Enrich mapped_steps
#         for step in mapped_steps:
#             param = step.get("parameter")
#             if not param:
#                 continue

#             if param.endswith("_icon"):
#                 icon_key = param.replace("_icon", "")
#                 image_data = elements.get(icon_key, [None, None, None, None])[3]
#                 if image_data:
#                     step["image"] = image_data

#             elif param in ocr_fields:
#                 step[param] = ocr_fields[param]

#         # Step 7: Save to DB
#         cases_collection.update_one(
#             {"_id": ObjectId(data.case_id)},
#             {"$set": {"mapped_steps": mapped_steps}}
#         )

#         return {
#             "case_id": data.case_id,
#             "mapped_steps": mapped_steps
#         }

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))
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

# Request model
class MappingRequest(BaseModel):
    steps: List[str]
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
