
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

import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
from prompt_temp import prompt_template

# Load API key
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

def generated_steps(device: str, user_query: str):
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    final_prompt = prompt_template.format(device_name=device, query=user_query)
    response = model.generate_content(final_prompt)
    gemini_reply = response.text

    try:
        steps = json.loads(gemini_reply)
        if not isinstance(steps, list):
            steps = [gemini_reply]
    except Exception:
        steps = [gemini_reply]

    return {"steps": steps}

