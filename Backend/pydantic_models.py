from pydantic import BaseModel, Field
from fastapi import UploadFile

class AdminIn(BaseModel):
    username: str
    password: str

class EmployeeIn(BaseModel):
    name: str
    email: str

class ConfigIn(BaseModel):
    camera_enter: str
    camera_exit: str
