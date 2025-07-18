# # db.py
# from pymongo import MongoClient
# from dotenv import load_dotenv
# import os

# load_dotenv()
# mongo_url = os.getenv("DATABASE")


# client = MongoClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
# db = client["TestAutomation"]

# templates_collection = db["templates"]
# cases_collection = db["cases"]


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+mysqlconnector://root:sgbi#sheheen#salim123@localhost:3306/TestAutomationAi"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
