from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.mssql import JSON
from datetime import datetime

Base = declarative_base()


class Case(Base):
    __tablename__ = "case"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(255), nullable=False)
    device = Column(String(255), nullable=False)
    model = Column(String(255), nullable=False)
    user_query = Column(Text, nullable=False)
    template_id = Column(String)

    # ✅ New DUT columns
    dut_1 = Column(String(255), nullable=True)
    dut_2 = Column(String(255), nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow)
    createdAtFormatted = Column(String(255), nullable=True)
    steps = relationship("Step", back_populates="case", cascade="all, delete")
    mapped_steps = relationship(
        "MappedStep", back_populates="case", cascade="all, delete"
    )
    operations = relationship("Operation", back_populates="case", cascade="all, delete-orphan")


class Step(Base):
    __tablename__ = "step"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    caseId = Column(Integer, ForeignKey("case.id"), nullable=False)
    operationId = Column(Integer, ForeignKey("operation.id"), nullable=True)  # New

    case = relationship("Case", back_populates="steps")
    operation = relationship("Operation", back_populates="steps")


class MappedStep(Base):
    __tablename__ = "mappedstep"

    id = Column(Integer, primary_key=True, index=True)
    step = Column(Text, nullable=False)
    api = Column(Text, nullable=False)
    parameter = Column(Text, nullable=False)
    caseId = Column(Integer, ForeignKey("case.id"), nullable=False)

    case = relationship("Case", back_populates="mapped_steps")


class Operation(Base):
    __tablename__ = "operation"
    __table_args__ = {'extend_existing': True}  # ✅ Add this line

    id = Column(Integer, primary_key=True, index=True)
    goal = Column(Text, nullable=False)
    prerequisite = Column(String, nullable=True)
    caseId = Column(Integer, ForeignKey("case.id"), nullable=False)

    case = relationship("Case", back_populates="operations")
    steps = relationship("Step", back_populates="operation", cascade="all, delete-orphan")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    projectName = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # If JSON not supported, use Text instead
    duts = Column(JSON, nullable=True)  # Store DUT list as JSON
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
