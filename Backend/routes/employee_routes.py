# routers/employee.py
from fastapi import APIRouter, Depends, HTTPException,UploadFile,File,Form
from models import Employee 
from pydantic_models import EmployeeIn
from utils import authenticate_user
import shutil
import dotenv
import os
from uuid import uuid4

dotenv.load_dotenv()
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

router = APIRouter(
    prefix="/employee",
    tags=["Employees"]
)

@router.post("/create")
async def create_employee(name:str=Form(...), email:str=Form(...),files:list[UploadFile]=File(...),id:int=Form(...),username = Depends(authenticate_user)):
    employee_obj = await Employee.create(name=name, email=email,id=id)
    if not employee_obj:
        raise HTTPException(status_code=400, detail="Employee creation failed")
    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.id))
    os.makedirs(emp_dir, exist_ok=True)
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.filename} ({file.content_type})"
            )   
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(emp_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
    return {"created"}

@router.delete("/delete/{id}")
async def delete_employee(id:int,username = Depends(authenticate_user)):
    print(id)
    employee_obj = await Employee.get_or_none(id=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")
    await employee_obj.delete()
    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.id))
    if os.path.exists(emp_dir):
        shutil.rmtree(emp_dir)
    return {"deleted"}

@router.put("/update/{id}")
async def update_employee(id:int, name:str=Form(...), email:str=Form(...),username = Depends(authenticate_user)):
    employee_obj = await Employee.get_or_none(id=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee_obj.name = name
    employee_obj.email = email
    await employee_obj.save()
    return {"updated"}

@router.post("/addphoto/{id}")
async def add_photo(id:int, file:UploadFile=File(...),username = Depends(authenticate_user)):
    employee_obj = await Employee.get_or_none(id=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.id))
    os.makedirs(emp_dir, exist_ok=True)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.filename} ({file.content_type})"
            )   
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(emp_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {"photo added"}

@router.delete("/deletephoto/{id}")
async def delete_photo(id: int,file: str = Form(...),username = Depends(authenticate_user)):
    employee_obj = await Employee.get_or_none(id=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.id))
    file_path = os.path.join(emp_dir, file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    image_files = [
        f for f in os.listdir(emp_dir)
        if os.path.isfile(os.path.join(emp_dir, f))
           and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]
    if len(image_files) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the last photo. At least one photo must remain."
        )
    os.remove(file_path)
    return {"message": "Photo deleted successfully"}

@router.post("/enter")
async def enter(username = Depends(authenticate_user)):
    return {"employee entered"}

@router.post("/exit")
async def exit(username = Depends(authenticate_user)):
    return {"employee exited"}
