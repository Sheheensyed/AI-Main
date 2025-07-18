from pymongo import MongoClient
from bson import ObjectId
from fastapi import HTTPException
import os
from dotenv import load_dotenv
import requests
from dotenv import load_dotenv
import os
import requests
import time
# from db import templates_collection,cases_collection
from models import  Case
from db import SessionLocal


# Load environment variables
load_dotenv()
CAPTURE_SCREEN_URL = os.getenv("CAPTURE_SCREEN_URL")
# Fetch URL from environment
SWIPE_API_URL = os.getenv("SWIPE_API_URL")

# Load environment variables
load_dotenv()
mongo_url = os.getenv("DATABASE")
TOUCH_BY_ICON_URL = os.getenv("TOUCH_BY_ICON_URL")
FLICK_API_URL = os.getenv("FLICK_API_URL")

# Setup MongoDB client and collections
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]
templates_collection = db["templates"]

 # functions.py
def abort(step_data: dict):
    """
    Abort the current step execution based on Gemini recommendation.
    """
    step = step_data.get("step", "Unknown")
    print(f"⚠️ Aborting step: {step}")
    return {
        "status": "aborted",
        "message": f"Step '{step}' was aborted by Gemini's recommendation."
    }




def get_swipe_coordinates_from_template(direction: str) -> dict:
    """
    Fetches screen coordinates from the template (ROIP) and returns swipe coordinates.

    Args:
        direction (str): One of 'swipe_up', 'swipe_down', 'swipe_left', 'swipe_right'.

    Returns:
        dict: Swipe coordinates.
    """
    template = templates_collection.find_one({"_id": ObjectId("6870adacdeac617d3a43ef51")})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    dut_key = template["DUTS"][0]
    screen_data = template[dut_key]["SCREENS"]["screen"]

    roip = screen_data.get("ROIP")
    if not roip:
        raise HTTPException(status_code=400, detail="ROIP not found in template")

    try:
        x1, y1, x2, y2 = map(int, roip.split(":"))
        width = x2 - x1
        height = y2 - y1
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ROIP format: {roip}")

    return get_swipe_coordinates(width, height, direction)


def get_swipe_coordinates(width: int, height: int, direction: str) -> dict:
    center_x = width // 2
    center_y = height // 2

    if direction == "swipe_up":
        return {"start_x": center_x, "start_y": int(height * 0.9), "end_x": center_x, "end_y": int(height * 0.1)}
    elif direction == "swipe_down":
        return {"start_x": center_x, "start_y": int(height * 0.1), "end_x": center_x, "end_y": int(height * 0.9)}
    elif direction == "swipe_left":
        return {"start_x": int(width * 0.9), "start_y": center_y, "end_x": int(width * 0.1), "end_y": center_y}
    elif direction == "swipe_right":
        return {"start_x": int(width * 0.1), "start_y": center_y, "end_x": int(width * 0.9), "end_y": center_y}
    else:
        raise HTTPException(status_code=400, detail=f"Invalid swipe direction: {direction}")
        

def swipe(step_data: dict):
    step = step_data.get("step", "").lower()
    case_id = step_data.get("case_id", "Unknown")

    try:
        print(f"🌀 Performing swipe: {step}")

        # ✅ Use manually provided coordinates if available
        if all(k in step_data for k in ("start_x", "start_y", "end_x", "end_y")):
            coords = {
                "start_x": step_data["start_x"],
                "start_y": step_data["start_y"],
                "end_x": step_data["end_x"],
                "end_y": step_data["end_y"]
            }
            print("📐 Using manually provided swipe coordinates:", coords)
        else:
            # 🧭 Fallback to swipe direction from template
            if step not in ["swipe_up", "swipe_down", "swipe_left", "swipe_right"]:
                return {
                    "status": "error",
                    "message": f"Unsupported swipe direction: {step}"
                }

            coords = get_swipe_coordinates_from_template(step)
            print("📐 Calculated swipe coordinates from template:", coords)

        # Prepare payload for API
        payload = {
            "pixel_x1": coords["start_x"],
            "pixel_y1": coords["start_y"],
            "pixel_x2": coords["end_x"],
            "pixel_y2": coords["end_y"],
            "get_pos": True
        }

        print(f"📡 Calling SWIPE API at: {SWIPE_API_URL}")
        print("🧾 Swipe Payload:", payload)

        headers = {"Content-Type": "application/json"}
        response = requests.post(SWIPE_API_URL, json=payload, headers=headers)

        # Success case
        if response.status_code == 200:
            result = {
                "status": "swipe_executed",
                "step": step,
                "case_id": case_id,
                "coordinates": coords,
                "message": f"Performed {step} via API call.",
                "api_response": response.json()
            }
            print("✅ Swipe executed:", result)
            return result
        else:
            print(f"❌ Swipe API failed. Status: {response.status_code}, Response: {response.text}")
            return {
                "status": "error",
                "step": step,
                "message": f"Swipe API call failed with {response.status_code}: {response.text}",
                "coordinates": coords
            }

    except Exception as e:
        print(f"🔥 Swipe execution error: {str(e)}")
        return {
            "status": "error",
            "step": step,
            "message": f"Swipe execution failed: {str(e)}"
        }




# Load environment variables
load_dotenv()
mongo_url = os.getenv("DATABASE")
TOUCH_BY_ICON_URL = os.getenv("TOUCH_BY_ICON_URL")

# MongoDB setup
client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]
cases_collection = db["cases"]


def tap(data: dict):
    """
    Executes a tap action using the 'touch_by_icon' API based on the mapped step image.
    Args:
        data (dict): Must contain `step` and `case_id`.

    Returns:
        dict: Tap execution result including API status and proof image if any.
    """
    try:
        step_name = data.get("step")
        case_id = data.get("case_id")

        if not step_name or not case_id:
            raise ValueError("Missing step or case_id")

        # Step 1: Fetch the mapped step from the case
        case = cases_collection.find_one({"_id": ObjectId(case_id)})
        if not case:
            raise Exception(f"Case '{case_id}' not found in database.")

        mapped_steps = case.get("mapped_steps", [])
        step_info = next((s for s in mapped_steps if s.get("step") == step_name), None)

        if not step_info:
            raise Exception(f"Step '{step_name}' not found in mapped_steps.")

        base64_img = step_info.get("image")
        if not base64_img or len(base64_img) < 100:
            print(f"⚠️ No valid base64 image found for step '{step_name}'. Length: {len(base64_img) if base64_img else 0}")
            raise Exception("Invalid or missing base64 image in mapped_steps for this step")
        else:
            print(f"🖼️ Base64 image found for step '{step_name}'. Length: {len(base64_img)}")

        # Step 2: Prepare payload and send POST request to tap API
        payload = {
            "operation": "touch",
            "threshold": "30",
            "image": base64_img
        }

        headers = {
            "Content-Type": "application/json"
        }

        print(f"👆 Sending tap request for step: {step_name}")
        response = requests.post(TOUCH_BY_ICON_URL, json=payload, headers=headers)

        if response.status_code != 200:
            return {
                "status": "error",
                "step": step_name,
                "message": f"Touch API failed with {response.status_code}: {response.text}",
                "action": "tap"
            }

        # Step 3: Parse API response
        result = response.json()
        api_data = result.get("response", {}).get("API No:1(touch_by_icon)", {})
        proof_img = api_data.get("proof_img")
        response_data = api_data.get("response_data", "UNKNOWN")

        print(f"📥 Tap response for step '{step_name}': {response_data}")

        return {
            "status": "success",
            "step": step_name,
            "message": f"Touch API returned: {response_data}",
            "proof_img": proof_img,
            "response_data": response_data,
            "action": "tap"
        }

    except Exception as e:
        print(f"❌ Tap failed for step '{data.get('step')}':", e)
        return {
            "status": "error",
            "step": data.get("step"),
            "message": f"Tap failed: {str(e)}",
            "action": "tap"
        }






def capture_screen():
    try:
        if not CAPTURE_SCREEN_URL:
            raise Exception("CAPTURE_SCREEN_URL not set in .env")

        response = requests.post(CAPTURE_SCREEN_URL, json={
            "source_mod": "camera",
            "source_id": "/dev/v4l/by-id/usb-e-con_systems_See3CAM_CU135_04249400-video-index0"
        })

        if response.status_code != 200:
            raise Exception(f"Camera API error: {response.status_code} - {response.text}")

        result = response.json()
        proof_img = result.get("response", {}).get("API No:1(capture screen)", {}).get("proof_img")

        if not proof_img or len(proof_img) < 100:
            raise Exception("Invalid proof_img received from camera")

        return proof_img

    except Exception as e:
        print("❌ Failed to capture screen:", e)
        raise






OCR_URL = os.getenv("OCR_URL")

def get_text() -> dict:
    try:
        print("🔍 Calling OCR API...")
        response = requests.post(OCR_URL, json={})
        if response.status_code == 200:
            data = response.json()

            if data.get("status") == "success":
                response_block = data.get("response", {})
                if response_block:
                    first_key = list(response_block.keys())[0]
                    extracted_value = response_block[first_key].get("response_data", "")
                    print(f"🧾 OCR Extracted Value: {extracted_value}")
                    data["extracted_value"] = extracted_value  # ✅ Optional: Attach to return value
            return data
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            print("❌ OCR failed:", error_msg)
            return {"status": "error", "error": error_msg}
    except Exception as e:
        print("❌ OCR exception:", str(e))
        return {"status": "error", "error": str(e)}





def flick_by_pixel(step_data: dict):
    try:
        start_x = step_data.get("start_x")
        start_y = step_data.get("start_y")
        end_x = step_data.get("end_x")
        end_y = step_data.get("end_y")
        case_id = step_data.get("case_id", "Unknown")

        if None in [start_x, start_y, end_x, end_y]:
            return {
                "status": "error",
                "message": "Missing pixel coordinates"
            }

        payload = {
            "pixel_x1": start_x,
            "pixel_y1": start_y,
            "pixel_x2": end_x,
            "pixel_y2": end_y,
            "get_pos": True
        }

        headers = {
            "Content-Type": "application/json"
        }

        print("🎯 Sending flick_by_pixel request:", payload)
        response = requests.post(FLICK_API_URL, json=payload, headers=headers)

        print(f"📤 Flick payload: {payload}")
        print(f"📥 Flick response ({response.status_code}): {response.text}")

        if response.status_code == 200:
            return {
                "status": "flick_executed",
                "step": "flick_by_pixel",
                "coordinates": payload,
                "api_response": response.json(),
                "case_id": case_id,
            }
        else:
            return {
                "status": "error",
                "message": f"Flick API failed with {response.status_code}: {response.text}",
                "coordinates": payload
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Flick by pixel execution failed: {str(e)}"
        }



def get_template_dimensions() -> tuple:
    """
    Returns width and height from the template's ROIP region.
    """
    template = templates_collection.find_one({"_id": ObjectId("6870adacdeac617d3a43ef51")})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    dut_key = template["DUTS"][0]
    screen_data = template[dut_key]["SCREENS"]["screen"]

    roip = screen_data.get("ROIP")
    if not roip:
        raise HTTPException(status_code=400, detail="ROIP not found in template")

    try:
        x1, y1, x2, y2 = map(int, roip.split(":"))
        width = x2 - x1
        height = y2 - y1
        return width, height
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ROIP format: {roip}")



def close_app(step_data: dict):
    print("🚪 Executing iPhone-style close app gesture...")

    try:
        width, height = get_template_dimensions()

        case_id = step_data.get("case_id")

        # Step 1: Swipe from 98% to 50%
        swipe_input = {
        "step": "swipe_close",  # 👈 your custom swipe type
        "case_id": case_id,
        "start_x": width // 2,
        "start_y": height,
        "end_x": width // 2,
        "end_y": int(height * 0.50)
    } 

        print("🔼 Step 1: Swipe to open app switcher")
        swipe_result = swipe(swipe_input)

        time.sleep(0.5)  # mimic human gesture delay

        # Step 2: Flick from 70% to 30%
        flick_input = {
            "case_id": case_id,
            "start_x": width // 2,
            "start_y": int(height * 0.70),
            "end_x": width // 2,
            "end_y": int(height * 0.30)
        }

        print("⚡ Step 2: Flick to close app")
        flick_result = flick_by_pixel(flick_input)

        return {
            "status": "success",
            "message": "App closed using swipe + flick gesture",
            "swipe_result": swipe_result,
            "flick_result": flick_result
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Close app failed: {str(e)}"
        }
