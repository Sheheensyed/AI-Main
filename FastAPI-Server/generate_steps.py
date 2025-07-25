
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
- A "step": specific robot instructions, either:
  - A single step as a dictionary:
    - "step": the instruction (always prefixed with device name)
    - "visual_description": a 2–3 word VLM tag **starting with 'Locate' or 'Detect'**
  - Or a list of such step dictionaries for multiple substeps under the same goal

### DEVICE AWARENESS:
Devices involved:
{device_list}

- **Always prefix each goal and step with the device name using "On [Device]:" format**
- **Strict Rule: DO NOT change or reformat the device name. Use it exactly as provided in the input.**

### RULES:
- Each item in the JSON list is **one goal**
- Subgoals MUST be separated out if one goal depends on another
- Use proper nesting: e.g., before checking iOS version, Settings → General → About must be opened first
- If query involves multiple devices, create separate parallel goals for each device

### STEP FORMAT:
- "step": Robot-readable instruction, prefixed with "On [Device]:"
- "visual_description": Begin with **Locate** or **Detect**, and use 2–3 words only
  - Examples:  
    - `"Locate Settings icon"`  
    - `"Detect About button"`  
    - `"Locate iOS version"`  
    - `"Detect Wi-Fi label"`

---

### EXAMPLES:

#### ✅ Single Device: "Find iOS version" on Apple
[
  {{
    "goal": "On Apple: Open Settings",
    "prerequisite": "Apple is on Home screen",
    "step": {{
      "step": "On Apple: Find and tap Settings",
      "visual_description": "Locate Settings icon"
    }}
  }},
  {{
    "goal": "On Apple: Find iOS version",
    "prerequisite": "Settings is open on Apple",
    "step": [
      {{
        "step": "On Apple: Find and tap General",
        "visual_description": "Locate General option"
      }},
      {{
        "step": "On Apple: Find and tap About",
        "visual_description": "Detect About button"
      }},
      {{
        "step": "On Apple: Find iOS version",
        "visual_description": "Locate iOS version"
      }}
    ]
  }}
]

---

#### ✅ Double DUT: "Find iOS version on iPhone14 and Android version on GalaxyS22"
[
  {{
    "goal": "On iPhone14: Open Settings",
    "prerequisite": "iPhone14 is on Home screen",
    "step": {{
      "step": "On iPhone14: Find and tap Settings",
      "visual_description": "Locate Settings icon"
    }}
  }},
  {{
    "goal": "On iPhone14: Find iOS version",
    "prerequisite": "Settings is open on iPhone14",
    "step": [
      {{
        "step": "On iPhone14: Find and tap General",
        "visual_description": "Locate General option"
      }},
      {{
        "step": "On iPhone14: Find and tap About",
        "visual_description": "Detect About button"
      }},
      {{
        "step": "On iPhone14: Find iOS version",
        "visual_description": "Locate iOS version"
      }}
    ]
  }},
  {{
    "goal": "On GalaxyS22: Open Settings",
    "prerequisite": "GalaxyS22 is on Home screen",
    "step": {{
      "step": "On GalaxyS22: Find and tap Settings",
      "visual_description": "Locate Settings icon"
    }}
  }},
  {{
    "goal": "On GalaxyS22: Find Android version",
    "prerequisite": "Settings is open on GalaxyS22",
    "step": [
      {{
        "step": "On GalaxyS22: Find and tap About phone",
        "visual_description": "Detect About phone"
      }},
      {{
        "step": "On GalaxyS22: Find and tap Software Information",
        "visual_description": "Locate Software info"
      }},
      {{
        "step": "On GalaxyS22: Read Android version",
        "visual_description": "Detect Android version"
      }}
    ]
  }}
]

---

### OUTPUT FORMAT:
A strict JSON array of objects.  
Each object must include:
- `"goal"`: prefixed with "On [Device]:"
- `"prerequisite"`
- `"step"`:
  - Either one object with `"step"` + `"visual_description"` (2–3 words starting with "Locate"/"Detect")
  - Or a list of such objects for multiple steps

Now convert this user query to the expected format:  
User Query: {user_query}
"""




# Extract clean JSON array from text using regex fallback
def extract_json_array(text):
    # Clean markdown code block if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError as e:
        print("❌ JSON parse error:", e)

    # Fallback to regex
    match = re.search(r"\[\s*{.*?}\s*]", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            return [{"error": "Regex JSON parse failed"}]

    return [{"error": "No valid JSON found", "raw": text}]



# Generate structured goals from query
def generate_steps(user_query, device_names):
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    device_list_str = "\n".join([f"- {d}" for d in device_names])
    prompt = prompt_template_nested.format(
        device_list=device_list_str,
        user_query=user_query
    )

    response = model.generate_content(prompt)
    
    print("🔍 Gemini raw response:\n", response.text[:1000])  # Truncate for readability
    
    return extract_json_array(response.text)





