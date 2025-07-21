
# import os
# import mysql.connector
# import google.generativeai as genai
# from dotenv import load_dotenv
# import json
# from prompt_temp import prompt_template

# # Load .env variables
# load_dotenv()
# gemini_api_key = os.getenv("GEMINI_API_KEY")
# genai.configure(api_key=gemini_api_key)

# # MySQL DB connection settings
# db_config = {
#     'host': 'localhost',
#     'user': 'root',
#     'password': 'sgbi#sheheen#salim123',
#     'database': 'TestAutomationAi'
# }

# def get_device_query():
#     try:
#         conn = mysql.connector.connect(**db_config)
#         cursor = conn.cursor(dictionary=True)

#         # Fetch latest case
#         cursor.execute("SELECT device, user_query FROM `Case` ORDER BY id DESC LIMIT 1")
#         result = cursor.fetchone()

#         if result:
#             device = result['device'].strip()
#             user_query = result['user_query'].strip()
#         else:
#             device = ""
#             user_query = ""

#         cursor.close()
#         conn.close()

#         return device, user_query
#     except Exception as e:
#         print("Error connecting to MySQL:", e)
#         return "", ""

# def step(device, user_query):
#     model = genai.GenerativeModel("gemini-2.0-flash-exp")
#     final_prompt = prompt_template.format(device_name=device, query=user_query)
    
#     response = model.generate_content(final_prompt)
#     gemini_reply = response.text

#     try:
#         steps = json.loads(gemini_reply)
#         if not isinstance(steps, list):
#             steps = [gemini_reply]
#     except Exception:
#         steps = [gemini_reply]

#     return steps

# if __name__ == "__main__":
#     device, user_query = get_device_query()

#     if user_query:
#         result = step(device, user_query)
#         print(json.dumps({"steps": result}, indent=2))
#     else:
#         print(json.dumps({"steps": ["No user_query found in MySQL."]}, indent=2))







# generated_step.py

# import os
# import google.generativeai as genai
# from dotenv import load_dotenv
# import json
# from prompt_temp import prompt_template

# # Load API key
# load_dotenv()
# gemini_api_key = os.getenv("GEMINI_API_KEY")
# genai.configure(api_key=gemini_api_key)

# def generated_steps(device: str, user_query: str):
#     model = genai.GenerativeModel("gemini-2.0-flash-exp")

#     final_prompt = prompt_template.format(device_name=device, query=user_query)
#     response = model.generate_content(final_prompt)
#     gemini_reply = response.text

#     try:
#         steps = json.loads(gemini_reply)
#         if not isinstance(steps, list):
#             steps = [gemini_reply]
#     except Exception:
#         steps = [gemini_reply]

#     return {"steps": steps}




import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai


# Load .env file and configure Gemini API
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

prompt_template_nested = """
You are an intelligent assistant that decomposes user requests into structured robot-friendly instructions to perform tasks on mobile devices. The steps will be executed by robotic arms interacting with real devices using vision and automation.

### TASK:

Convert a user query into a structured **list of goals**, each with:
- A clear "goal": what is to be achieved at a high level
- A "prerequisite": what must be true before that goal can be started
- A "step": specific robot instructions as either:
  - a string for a single action
  - a list of strings for multiple substeps under the same goal

### DEVICE AWARENESS:
Devices involved:
{device_list}

- If only 1 device: DO NOT prefix steps with the device name
- If 2 or more devices: prefix each step with the device name (e.g., "On iPhone13: Find and tap Settings")

### RULES:
- Each item in the JSON list is **one goal**
- Subgoals MUST be separated out if one goal depends on another
- Use proper nesting: e.g., before checking iOS version, Settings → General → About must be opened first
- If query involves both Android and iOS, create separate parallel goals for each device

### INSTRUCTIONS:
- Use the phrase **"Find and tap"** for UI interactions
- Use **"Find"** if it only requires reading/locating an element (no interaction)
- Prerequisite should describe the necessary state (e.g., "Settings is open", or "Phone is on Home screen")
- Steps should be practical and brief
- Maintain strict JSON format with only array of objects (no markdown, no commentary)

### EXAMPLES:

#### Single device: "Find iOS version"
[
  {{
    "goal": "Open Settings",
    "prerequisite": "Phone is on Home screen",
    "step": "Find and tap Settings"
  }},
  {{
    "goal": "Find iOS version",
    "prerequisite": "Settings is open",
    "step": [
      "Find and tap General",
      "Find and tap About",
      "Find iOS version"
    ]
  }}
]

#### Multi-device: "Find iOS version on iPhone13 and Android version on Pixel6"
[
  {{
    "goal": "Open Settings on iPhone13",
    "prerequisite": "iPhone13 is on Home screen",
    "step": "On iPhone13: Find and tap Settings"
  }},
  {{
    "goal": "Find iOS version",
    "prerequisite": "Settings is open on iPhone13",
    "step": [
      "On iPhone13: Find and tap General",
      "On iPhone13: Find and tap About",
      "On iPhone13: Find iOS version"
    ]
  }},
  {{
    "goal": "Open Settings on Pixel6",
    "prerequisite": "Pixel6 is on Home screen",
    "step": "On Pixel6: Find and tap Settings"
  }},
  {{
    "goal": "Find Android version",
    "prerequisite": "Settings is open on Pixel6",
    "step": [
      "On Pixel6: Find and tap About phone",
      "On Pixel6: Find Android version"
    ]
  }}
]

### OUTPUT FORMAT:
Strict JSON array like:
[
  {{
    "goal": "....",
    "prerequisite": "....",
    "step": "..." or ["...", "..."]
  }},
  ...
]

Now convert this user query to the expected output format:
User Query: {user_query}
"""

# Extract clean JSON array from text using regex fallback
def extract_json_array(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\[\s*{.*?}\s*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                return [{"error": "Failed to parse valid JSON from Gemini response"}]
        return [{"error": "No JSON array found in response", "raw": text}]

# Generate structured goals from query
def generate_steps(user_query, device_names):
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    device_list_str = "\n".join([f"- {d}" for d in device_names])
    prompt = prompt_template_nested.format(
        device_list=device_list_str,
        user_query= user_query
    )
    response = model.generate_content(prompt)
    return extract_json_array(response.text)





