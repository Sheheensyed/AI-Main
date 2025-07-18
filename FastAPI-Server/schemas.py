from pydantic import BaseModel
from typing import List, Optional,Any



class StepBase(BaseModel):
    content: str

class StepCreate(StepBase):
    pass

class MappingRequest(BaseModel):
    case_id: int
    steps: List[str]

class StepOut(BaseModel):
    id: int
    content: str
    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    project_name: str
    device: str
    model:Optional[str]=''
    user_query: str
    template_id: Optional[int]  # ✅ Add this line

class CaseOut(BaseModel):
    id: int
    project_name: str
    device: str
    model: str
    user_query: str
    createdAtFormatted: Optional[str]
    steps: List[StepOut]

    class Config:
        from_attributes = True

class StepEdit(BaseModel):
    newStep:str

class TemplateCreate(BaseModel):
    projectName: str
    templateName: str
    templateJson: Any

class ProjectNameInput(BaseModel):
    projectName: str