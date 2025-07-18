from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text,func
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.mssql import JSON
from datetime import datetime

Base = declarative_base()

class Case(Base):
    __tablename__ = 'case'

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(255), nullable=False)
    device = Column(String(255), nullable=False)
    model = Column(String(255), nullable=False)
    user_query = Column(Text, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    createdAtFormatted = Column(String(255), nullable=True)
    template_id = Column(String)  # ✅ NEW COLUMN

    steps = relationship("Step", back_populates="case", cascade="all, delete")
    mapped_steps = relationship("MappedStep", back_populates="case", cascade="all, delete")

class Step(Base):
    __tablename__ = 'step'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    caseId = Column(Integer, ForeignKey('case.id'), nullable=False)

    case = relationship("Case", back_populates="steps")

class MappedStep(Base):
    __tablename__ = 'mappedstep'

    id = Column(Integer, primary_key=True, index=True)
    step = Column(Text, nullable=False)
    api = Column(Text, nullable=False)
    parameter = Column(Text, nullable=False)
    caseId = Column(Integer, ForeignKey('case.id'), nullable=False)

    case = relationship("Case", back_populates="mapped_steps")

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    projectName = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # If JSON not supported, use Text instead
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

