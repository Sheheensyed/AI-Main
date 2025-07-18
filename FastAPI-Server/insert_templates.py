import json
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Template

# Load the JSON
with open("Template.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Start DB session
db: Session = SessionLocal()

# If the JSON is a dictionary, store it as one template
if isinstance(data, dict):
    template = Template(
        name="Default Template",
        content=json.dumps(data)  # store entire JSON as string
    )
    db.add(template)

# If it's a list of templates
elif isinstance(data, list):
    for item in data:
        name = item.get("name", "Unnamed")
        content = json.dumps(item)
        template = Template(name=name, content=content)
        db.add(template)

db.commit()
db.close()
print("✅ Templates inserted successfully.")
