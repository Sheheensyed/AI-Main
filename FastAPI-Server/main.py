from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

# from pymongo import MongoClient
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
from function import abort, swipe, capture_screen, tap, get_text

# from db import templates_collection, cases_collection
from PIL import Image
import io
from sqlalchemy import create_engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from fastapi import Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Case
from schemas import (
    MappingRequest,
    StepUpdate,
    StepEdit,
    OperationCreate,OperationOut,StepCreateSchema,StepUpdateSchema
)  # create this pydantic model

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Base, Case, Step, Template, Operation
from db import engine, SessionLocal
from schemas import CaseCreate, CaseOut, ProjectNameInput
from datetime import datetime
import requests
import json
import models
from generate_steps import generate_steps
from fastapi.encoders import jsonable_encoder


import subprocess
import json


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Load environment variables ---
load_dotenv()
mongo_url = os.getenv("DATABASE")
gemini_api_key = os.getenv("GEMINI_API_KEY")
capture_url = os.getenv("CAPTURE_SCREEN_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
ACTIVE_TEMPLATE_URL = os.getenv("ACTIVE_TEMPLATE_URL")
print("🧪 Loaded URL:", ACTIVE_TEMPLATE_URL)


# --- Configure Gemini ---
genai.configure(api_key=gemini_api_key)

# --- MongoDB setup ---
# client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# db = client["TestAutomation"]
# cases_collection = db["cases"]
# templates_collection = db["templates"]
# images_collection = db["images"]


# SQL Alchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# TEMPLATE_OBJECT_ID = ObjectId("685d43b799df0ca9b740bc1f")
# TEMPLATE_OBJECT_ID = ObjectId("686e44b08215320aecea7422")
TEMPLATE_OBJECT_ID = ObjectId("686f4970eb331def8f8c6ae1")

# --- FastAPI setup ---
app = FastAPI()
Base.metadata.create_all(bind=engine)
models.Base.metadata.create_all(bind=engine)


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
        "from_attributes": True,
    }


def safe_text(text):
    return str(text).encode("utf-8", "replace").decode("utf-8")


def get_action_history(case_id: str, step: str):
    previous_docs = images_collection.find(
        {
            "case_id": ObjectId(case_id),
            "step": step,
            "action_result.status": {"$exists": True},
        }
    ).sort("created_at", -1)

    history_lines = []
    for doc in previous_docs:
        action = doc.get("action_result", {}).get("step") or doc.get(
            "action_result", {}
        ).get("action")
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
def get_action_recommendation(device: str, step: str, image_path: str, case_id: str):
    if not os.path.exists(image_path):
        return {"error": "Image not found", "path": image_path}

    try:
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
            image = Image.open(io.BytesIO(image_bytes))

        # Get Action History string
        action_history = get_action_history(case_id=case_id, step=step)

        # Format Prompt
        prompt = prompt_template_exe.format(
            device=device, step=step, action_history=action_history
        )

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(
            [prompt, image], generation_config={"temperature": 0.4}
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
                "raw_response": response.text,
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
        {"case_id": ObjectId(case_id), "_id": {"$ne": exclude_image_id}},
        sort=[("created_at", -1)],
    )
    if not doc:
        raise ValueError("No newer images found for case.")

    image_path = os.path.join(IMAGES_DIR, doc["filename"])
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")


# @app.post("/generate-steps", response_model=CaseOut)
# def generate_steps(payload: CaseCreate, db: Session = Depends(get_db)):
#     try:
#         # Step 1: Create case
#         new_case = Case(
#             project_name=payload.project_name,
#             device=payload.device,
#             model=payload.model,
#             user_query=payload.user_query,
#             createdAtFormatted=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         )
#         db.add(new_case)
#         db.commit()
#         db.refresh(new_case)

#         # Step 2: Run Python Script
#         result = run_python_script(str(new_case.id), payload.device, payload.model)

#         # Step 3: Store Steps
#         for s in result["steps"]:
#             step = Step(content=s, caseId=new_case.id)
#             db.add(step)
#         db.commit()

#         # Step 4: Return Case with Steps
#         steps = db.query(Step).filter(Step.caseId == new_case.id).all()
#         return {
#             **new_case.__dict__,
#             "steps": [s.content for s in steps]
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-steps", response_model=CaseOut)
def generate_steps_route(payload: CaseCreate, db: Session = Depends(get_db)):
    try:
        # Step 1: Fetch template to get DUTs
        template = db.query(Template).filter(Template.id == payload.template_id).first()
        if not template or not template.duts:
            raise HTTPException(
                status_code=400, detail="Template not found or missing DUTs"
            )

        dut_1 = template.duts[0] if len(template.duts) > 0 else None
        dut_2 = template.duts[1] if len(template.duts) > 1 else None

        if not dut_1:
            raise HTTPException(status_code=400, detail="No DUTs found in template")

        # Step 2: Save Case (include DUTs)
        new_case = Case(
            project_name=payload.project_name,
            device=dut_1,
            model=payload.model,
            user_query=payload.user_query,
            template_id=payload.template_id,
            dut_1=dut_1,
            dut_2=dut_2,
            createdAtFormatted=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        # Step 3: Generate steps using Gemini with dut_1 and dut_2
        device_list = [dut_1]
        if dut_2:
            device_list.append(dut_2)

        steps_list = generate_steps(payload.user_query, device_list)

        if isinstance(steps_list, dict) and "steps" in steps_list:
            steps_list = steps_list["steps"]

        # Step 4: Save operations and individual steps
        for op in steps_list:
            goal = op.get("goal")
            prerequisite = op.get("prerequisite")
            step_summary = json.dumps(op.get("step"))  # Save summary of steps

            new_operation = Operation(
                goal=goal, prerequisite=prerequisite, caseId=new_case.id
            )
            db.add(new_operation)
            db.commit()
            db.refresh(new_operation)

            # Save each sub-step (as list or single string)
            steps = op.get("step")
            if isinstance(steps, str):
                steps = [steps]
            for single_step in steps:
                db.add(
                    Step(
                        content=single_step,
                        caseId=new_case.id,
                        operationId=new_operation.id,
                    )
                )

                db.commit()

        # Step 5: Return the Case with steps
        db.refresh(new_case)
        return CaseOut.model_validate(new_case)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# main.py
@app.post("/case/{id}/operation", response_model=CaseOut)
def add_operation(id: int, op_data: OperationCreate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    new_op = Operation(
        goal=op_data.goal, prerequisite=op_data.prerequisite, caseId=case.id
    )
    db.add(new_op)
    db.commit()
    db.refresh(case)
    return case

@app.get("/case/{id}/operation", response_model=List[OperationOut])
def get_operations(id: int, db: Session = Depends(get_db)):
    return db.query(Operation).filter(Operation.caseId == id).all()


@app.delete("/operation/{operation_id}")
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    db.delete(operation)  # 👈 This will also delete related steps due to cascade
    db.commit()
    return {"message": "Operation and its steps deleted successfully"}


@app.post("/operation/{operation_id}/step")
def add_step_to_operation(operation_id: int, payload: StepCreateSchema, db: Session = Depends(get_db)):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()

    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    new_step = Step(
        content=payload.content,
        caseId=operation.caseId,
        operationId=operation.id
    )

    db.add(new_step)
    db.commit()
    db.refresh(new_step)

    return {
        "message": "Step added successfully",
        "data": {
            "id": new_step.id,
            "content": new_step.content,
            "operationId": new_step.operationId,
            "caseId": new_step.caseId,
            "createdAt": new_step.createdAt if hasattr(new_step, "createdAt") else None,
        }
    }

@app.patch("/step/{step_id}")
def update_step(step_id: int, payload: StepUpdateSchema, db: Session = Depends(get_db)):
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    step.content = payload.content
    db.commit()
    db.refresh(step)
    return {"message": "Step updated", "data": step}


























@app.put("/step/{step_id}")
def update_step(step_id: int, step_data: StepUpdate, db: Session = Depends(get_db)):
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    step.content = step_data.content
    db.commit()
    db.refresh(step)
    return step





@app.put("/case/{case_id}/step/{step_index}")  # editing steps by caseId
def edit_step(
    case_id: int, step_index: int, payload: StepEdit, db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    steps = db.query(Step).filter(Step.caseId == case_id).order_by(Step.id.asc()).all()
    if step_index < 0 or step_index >= len(steps):
        raise HTTPException(status_code=404, detail="Step index out of range")

    step_to_update = steps[step_index]
    step_to_update.content = payload.newStep
    db.commit()

    # Fetch updated steps
    updated_steps = (
        db.query(Step).filter(Step.caseId == case_id).order_by(Step.id.asc()).all()
    )

    return {
        "message": "Step updated successfully",
        "steps": [{"id": s.id, "content": s.content} for s in updated_steps],
    }


@app.delete("/case/{case_id}/step/{step_index}")
def delete_step(case_id: int, step_index: int, db: Session = Depends(get_db)):
    try:
        # 🔍 Get all steps for the case ordered by ID
        steps = (
            db.query(Step).filter(Step.caseId == case_id).order_by(Step.id.asc()).all()
        )

        if step_index < 0 or step_index >= len(steps):
            raise HTTPException(status_code=404, detail="Step index out of range")

        # 🗑️ Get step to delete
        step_to_delete = steps[step_index]
        db.delete(step_to_delete)
        db.commit()

        # ✅ Get updated steps
        updated_steps = (
            db.query(Step).filter(Step.caseId == case_id).order_by(Step.id.asc()).all()
        )
        step_contents = [step.content for step in updated_steps]

        return {"message": "Step deleted successfully", "steps": step_contents}

    except Exception as e:
        print("❌ Error deleting step:", e)
        raise HTTPException(status_code=500, detail="Step deletion failed")


@app.post("/active_template")  # With project name
def create_template_from_active(
    project: ProjectNameInput, db: Session = Depends(get_db)
):
    try:
        if not ACTIVE_TEMPLATE_URL:
            raise HTTPException(
                status_code=500, detail="ACTIVE_TEMPLATE_URL is not set"
            )

        # Step 1: Fetch the active template JSON from external URL
        response = requests.get(ACTIVE_TEMPLATE_URL)
        if response.status_code != 200:
            raise HTTPException(
                status_code=500, detail="Failed to fetch active template"
            )

        template_json = response.json()

        # Step 2: Extract fields (customize based on your actual structure)
        template_name = template_json.get("name", "Unnamed Template")

        print("📦 Extracted DUTS:", template_json.get("DUTS"))
        dut_list = template_json.get("DUTS", [])

        print("🧪 Inserting into:", Template.__tablename__)

        # Step 3: Insert into DB
        new_template = Template(
            projectName=project.projectName,
            content=json.dumps(template_json),  # Will be saved as JSON
            duts=dut_list,
        )

        db.add(new_template)
        db.commit()
        db.refresh(new_template)

        return {
            "message": "Template saved successfully",
            "id": new_template.id,
            "projectName": project.projectName,
            "templateName": template_name,
            "duts": new_template.duts,  # ← This is the missing part!
        }

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Server error during template save")


@app.get("/duts/{template_id}")
def get_duts_by_id(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": template.id,
        "projectName": template.projectName,
        "duts": template.duts,
    }


@app.post("/generate-mapped-steps")
def generate_mapped_steps(data: MappingRequest):
    db: Session = SessionLocal()
    try:
        print(f"📥 Received steps for case_id: {data.case_id}")

        # Fetch case from MySQL
        case = db.query(Case).filter(Case.id == int(data.case_id)).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        device = case.device
        if not device:
            raise HTTPException(status_code=400, detail="Device not in case")

        # Format prompt for Gemini
        steps_text = "\n".join(case.steps)
        prompt = prompt_template.format(device=device, steps=steps_text)

        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        print("🧠 Gemini Output:\n", raw_output)

        # Parse Gemini response
        mapped_steps = []
        for line in raw_output.splitlines():
            try:
                mapped_steps.append(json.loads(line))
            except json.JSONDecodeError:
                print("⚠️ Malformed step line skipped:", line)

        if not mapped_steps:
            raise HTTPException(status_code=500, detail="No valid steps parsed")

        # Load template JSON from SQL
        TEMPLATE_SQL_ID = 1  # 🔁 replace with dynamic logic or config
        template: Template = (
            db.query(Template).filter(Template.id == TEMPLATE_SQL_ID).first()
        )
        if not template:
            raise HTTPException(status_code=500, detail="Template not found")

        template_data = template.content  # JSON field from MySQL

        # Parse DUT-level structure
        dut_keys = template_data.get("DUTS", [])
        if not dut_keys:
            raise HTTPException(status_code=500, detail="No DUTS key in template")

        dut_key = dut_keys[0]  # e.g., "Q_ai"
        template_dut = template_data.get(dut_key, {})
        screens = template_dut.get("SCREENS", {})
        screen_key = list(screens.keys())[0]
        screen_data = screens.get(screen_key, {})

        elements = screen_data.get("elements", {})
        ocr_fields = screen_data.get("ocr", {})

        # Enrich mapped steps
        for step in mapped_steps:
            param = step.get("parameter")
            if not param:
                continue

            if param.endswith("_icon") or param.endswith("_option"):
                image_data = elements.get(param, [None, None, None, None, None])[4]
                if not image_data:
                    fallback_key = param.replace("_icon", "").replace("_option", "")
                    image_data = elements.get(
                        fallback_key, [None, None, None, None, None]
                    )[4]
                if image_data:
                    step["image"] = image_data

            elif param in ocr_fields:
                step[param] = ocr_fields[param]

        # Save mapped steps to MySQL
        case.mapped_steps = mapped_steps
        db.commit()

        return {"case_id": case.id, "mapped_steps": mapped_steps}

    except Exception as e:
        db.rollback()
        print("🔥 Step generation error:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

    # @app.post("/execute_with_gemini")
    # async def execute_with_gemini(data: CaptureRequest):
    try:
        print(f"\U0001f4f8 Starting action loop for step: {data.step}")

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        device = case.get("device", "Unknown")

        attempt = 1
        final_response = None

        while True:
            print(f"🔁 Attempt #{attempt} for step: {data.step}")

            if not data.base64_image or len(data.base64_image) < 100:
                raise HTTPException(
                    status_code=400, detail="Invalid or empty base64 image"
                )

            try:
                image_data = base64.b64decode(data.base64_image)
            except Exception as decode_err:
                raise HTTPException(
                    status_code=400, detail=f"Base64 decode failed: {decode_err}"
                )

            filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
            image_path = os.path.join(IMAGES_DIR, filename)
            with open(image_path, "wb") as f:
                f.write(image_data)

            image_doc = ImageDocument(
                case_id=ObjectId(data.case_id),
                step=data.step,
                filename=filename,
                created_at=datetime.utcnow().isoformat(),
                device=device,
            )
            img_result = images_collection.insert_one(
                image_doc.dict(by_alias=True, exclude_none=True)
            )

            ai_result = get_action_recommendation(
                device=device,
                step=data.step,
                image_path=image_path,
                case_id=data.case_id,
            )

            action_result = {}
            action_name = ai_result.get("next_api", "").lower()

            ACTION_HANDLERS = {
                "abort": abort,
                "swipe_up": swipe,
                "swipe_down": swipe,
                "swipe_left": swipe,
                "swipe_right": swipe,
                "detect_and_tap": tap,
            }

            if action_name in ["complete", "abort"]:
                print(f"✅ Step ended with action: {action_name}")
                action_result = {
                    "status": "done" if action_name == "complete" else "error",
                    "step": data.step,
                    "message": f"Step {action_name}ed successfully",
                    "action": action_name,
                }
                final_response = {
                    "image_url": f"http://localhost:8000/images/{filename}",
                    "ai_result": ai_result,
                    "action_result": action_result,
                }
                break

            if action_name in ACTION_HANDLERS:
                action_input = {"step": action_name, "case_id": data.case_id}
                action_result = ACTION_HANDLERS[action_name](action_input)

                if "swipe" in action_name and "direction" not in action_result:
                    action_result["action"] = "swipe"
                    action_result["direction"] = action_name

            update_data = {"gemini_response": ai_result, "action_result": action_result}
            if "coordinates" in action_result:
                update_data["coordinates"] = action_result["coordinates"]

            images_collection.update_one(
                {"_id": img_result.inserted_id}, {"$set": update_data}
            )

            print("🔄 Re-capturing next screen after action...")
            data.base64_image = fetch_fresh_screenshot()

            attempt += 1

        return final_response

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))

    # @app.post("/execute_with_gemini")
    # async def execute_with_gemini(data: CaptureRequest):
    try:
        print(f"\U0001f4f8 Starting action loop for step: {data.step}")

        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        device = case.get("device", "Unknown")

        attempt = 1
        final_response = None

        while True:
            print(f"🔁 Attempt #{attempt} for step: {data.step}")

            if not data.base64_image or len(data.base64_image) < 100:
                raise HTTPException(
                    status_code=400, detail="Invalid or empty base64 image"
                )

            try:
                image_data = base64.b64decode(data.base64_image)
            except Exception as decode_err:
                raise HTTPException(
                    status_code=400, detail=f"Base64 decode failed: {decode_err}"
                )

            filename = f"{data.step}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
            image_path = os.path.join(IMAGES_DIR, filename)
            with open(image_path, "wb") as f:
                f.write(image_data)

            image_doc = ImageDocument(
                case_id=ObjectId(data.case_id),
                step=data.step,
                filename=filename,
                created_at=datetime.utcnow().isoformat(),
                device=device,
            )
            img_result = images_collection.insert_one(
                image_doc.dict(by_alias=True, exclude_none=True)
            )

            ai_result = get_action_recommendation(
                device=device,
                step=data.step,
                image_path=image_path,
                case_id=data.case_id,
            )

            action_result = {}
            action_name = ai_result.get("next_api", "").lower()

            ACTION_HANDLERS = {
                "abort": abort,
                "swipe_up": swipe,
                "swipe_down": swipe,
                "swipe_left": swipe,
                "swipe_right": swipe,
                "detect_and_tap": tap,
            }

            if action_name in ["complete", "abort"]:
                print(f"✅ Step ended with action: {action_name}")
                action_result = {
                    "status": "done" if action_name == "complete" else "error",
                    "step": data.step,
                    "message": f"Step {action_name}ed successfully",
                    "action": action_name,
                }
                final_response = {
                    "image_url": f"http://localhost:8000/images/{filename}",
                    "ai_result": ai_result,
                    "action_result": action_result,
                }
                break

            if action_name in ACTION_HANDLERS:
                action_input = {"step": action_name, "case_id": data.case_id}
                action_result = ACTION_HANDLERS[action_name](action_input)

                if "swipe" in action_name and "direction" not in action_result:
                    action_result["action"] = "swipe"
                    action_result["direction"] = action_name

            update_data = {"gemini_response": ai_result, "action_result": action_result}
            if "coordinates" in action_result:
                update_data["coordinates"] = action_result["coordinates"]

            images_collection.update_one(
                {"_id": img_result.inserted_id}, {"$set": update_data}
            )

            print("🔄 Re-capturing next screen after action...")
            data.base64_image = fetch_fresh_screenshot()

            attempt += 1

        return final_response

    except Exception as e:
        print("🔥 Image capture error:", e)
        raise HTTPException(status_code=500, detail=str(e))

    # @app.post("/execute_manual_step")
    # async def execute_manual_step(data: StepExecutionRequest):  # expects case_id + step_name
    try:
        case = cases_collection.find_one({"_id": ObjectId(data.case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        mapped_steps = case.get("mapped_steps", [])
        step_info = next(
            (step for step in mapped_steps if step.get("step") == data.step), None
        )

        if not step_info:
            raise HTTPException(
                status_code=404, detail="Step not found in mapped steps"
            )

        ACTION_HANDLERS = {
            "touch_by_icon": tap,
            "abort": abort,
            "swipe_up": swipe,
            "swipe_down": swipe,
            "swipe_left": swipe,
            "swipe_right": swipe,
            "ocr": get_text,
        }

        step_name = step_info.get("step")
        api_type = step_info.get("api", "").lower()
        parameter = step_info.get("parameter", "")
        base64_img = step_info.get("image", "")

        if api_type not in ACTION_HANDLERS:
            return {
                "step": step_name,
                "status": "skipped",
                "reason": f"Unsupported api type: {api_type}",
            }

        print(f"🚀 Executing step: {step_name} ({api_type})")

        if api_type == "ocr":
            ocr_result = get_text()
            return {
                "step": step_name,
                "status": (
                    "completed" if ocr_result.get("status") == "success" else "failed"
                ),
                "ocr_result": ocr_result,
                "extracted_value": ocr_result.get("extracted_value", ""),
            }

        if not base64_img or len(base64_img) < 100:
            return {
                "step": step_name,
                "status": "skipped",
                "reason": "No valid base64 image found",
            }

        action_input = {"step": step_name, "case_id": data.case_id}

        attempt = 0
        all_attempts = []
        success = False
        MAX_RETRIES = 5

        while attempt < MAX_RETRIES:
            attempt += 1
            print(f"🔁 Attempt #{attempt}: tap")

            tap_result = tap(action_input)
            all_attempts.append(
                {"attempt": attempt, "type": "tap", "result": tap_result}
            )

            response_data = tap_result.get("response_data", "").upper()
            if response_data == "FOUND":
                success = True
                break

            direction = "swipe_left" if parameter.endswith("_icon") else "swipe_up"
            print(f"👈 Tap failed. Swiping {direction}...")

            swipe_result = swipe({"step": direction, "case_id": data.case_id})
            all_attempts.append(
                {"attempt": attempt, "type": direction, "result": swipe_result}
            )

        return {
            "step": step_name,
            "status": "completed" if success else "failed",
            "attempts": all_attempts,
        }

    except Exception as e:
        print("🔥 Step execution error:", e)
        raise HTTPException(status_code=500, detail=str(e))















@app.get("/cases")
def get_cases(db: Session = Depends(get_db)):
    return db.query(models.Case).all()


@app.get("/steps")
def get_steps(db: Session = Depends(get_db)):
    return db.query(models.Step).all()


@app.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    return db.query(models.Template).all()


@app.delete("/cases/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Delete related steps using correct column name
    db.query(models.Step).filter(models.Step.caseId == case_id).delete()

    db.delete(case)
    db.commit()
    return {"message": f"Case {case_id} and related steps deleted"}


# Delete STEP
@app.delete("/steps/{step_id}")
def delete_step(step_id: int, db: Session = Depends(get_db)):
    step = db.query(models.Step).filter(models.Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    db.delete(step)
    db.commit()
    return {"message": f"Step {step_id} deleted"}


# Delete TEMPLATE
@app.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = (
        db.query(models.Template).filter(models.Template.id == template_id).first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": f"Template {template_id} deleted"}


@app.delete("/delete-all-templates")
def delete_all_templates(db: Session = Depends(get_db)):
    templates = db.query(models.Template).all()
    if not templates:
        raise HTTPException(status_code=404, detail="No Templates To Delete")
    db.query(models.Template).delete()
    db.commit()
    return {"message": "All Templates Deleted Successfully"}


@app.delete("/AllcasesDelete")
def delete_all_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).all()

    if cases:
        # Collect all template_ids used in cases
        template_ids = set()
        for case in cases:
            if case.template_id:
                template_ids.add(case.template_id)
            db.delete(case)

        # Delete related templates
        for tid in template_ids:
            template = (
                db.query(models.Template).filter(models.Template.id == tid).first()
            )
            if template:
                db.delete(template)

        db.commit()

    return {"message": "All cases and related templates deleted (if any existed)"}
