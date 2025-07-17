# db.py
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
mongo_url = os.getenv("DATABASE")


client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
db = client["TestAutomation"]

templates_collection = db["templates"]
cases_collection = db["cases"]
