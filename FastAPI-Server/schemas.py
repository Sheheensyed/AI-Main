from pydantic import BaseModel
from typing import List, Optional,Any,Union



class StepBase(BaseModel):
    id: int
    content: Union[str, dict]  # handle both raw string and JSON
    operationId: Optional[int]
    caseId: int

    class Config:
        orm_mode = True

class StepCreate(BaseModel):
    content: str
    operationId: Optional[int] = None  # So steps can be linked to an operation

class MappingRequest(BaseModel):
    case_id: int
    steps: List[str]

class StepOut(BaseModel):
    id: int
    content: Union[str, dict]  # in case it's a JSON string
    operationId: Optional[int]
    visual_description: Optional[str]
    device: Optional[str]
    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    project_name: str
    device: Optional[str] = None
    model:Optional[str]=''
    user_query: str
    template_id: Optional[int]  # ✅ Add this line

class OperationOut(BaseModel):
    id: int
    goal: str
    prerequisite: str
    caseId: int
    steps: List[StepOut] = [] 

    class Config:
        from_attributes = True

class CaseOut(BaseModel):
    id: int
    project_name: str
    device: str
    model: str
    user_query: str
    createdAtFormatted: Optional[str]
    # steps: List[StepOut]
    operations: List[OperationOut] = []


    class Config:
        from_attributes = True

class GenerateStepsResponse(BaseModel):
    status: str
    warning: Optional[str]
    case: CaseOut

class StepEdit(BaseModel):
    newStep:str

class TemplateCreate(BaseModel):
    projectName: str
    templateName: str
    templateJson: Any

class ProjectNameInput(BaseModel):
    projectName: str

class OperationCreate(BaseModel):
    goal: str
    prerequisite: str  # ✅ use the correct column name
    caseId: int

class StepCreateSchema(BaseModel):
    content: str

class StepUpdate(BaseModel):
    content: str

class StepResponse(BaseModel):
    id: int
    content: str
    operationId: int
    caseId: int

    class Config:
        from_attributes = True

class StepUpdateSchema(BaseModel):
    content: str

class MappingRequest(BaseModel):
    case_id: int
    steps: List[str]  # 👈 steps should be a list of strings

class MappedStepCreate(BaseModel):
    case_id: int
    ...
