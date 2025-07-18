# create_tables.py
from db import Base, engine
from models import Template

Base.metadata.create_all(bind=engine)
