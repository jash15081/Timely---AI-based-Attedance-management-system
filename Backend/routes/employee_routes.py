# routers/employee.py
from fastapi import APIRouter, Depends, HTTPException,UploadFile,File,Form,Request
from models import Employee 
from pydantic_models import EmployeeIn
from utils import authenticate_user
import shutil
import dotenv
import os
from uuid import uuid4
from fastapi.responses import JSONResponse
dotenv.load_dotenv()
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

router = APIRouter(
    prefix="/employee",
    tags=["Employees"]
)

PHOTOS_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..','..', 'photos'))
print(f"Photos base path: {PHOTOS_BASE_PATH}")

from fastapi import APIRouter, Request, HTTPException, Depends
import os

@router.get("/{id}")
async def get_employee(id: str, request: Request, username=Depends(authenticate_user)):
    employee = await Employee.get_or_none(empid=id).values("id","empid", "name", "email")

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_id = str(employee["empid"])
    photo_dir = os.path.join(PHOTOS_BASE_PATH, emp_id)

    photo_urls = []
    if os.path.isdir(photo_dir):
        files = os.listdir(photo_dir)
        image_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        for filename in image_files:
            url = request.url_for("photos", path=f"{emp_id}/{filename}")
            photo_urls.append(url._url)

    employee["photos"] = photo_urls  # Send all photos as list
    return {"employee": employee}


@router.get("/")
async def get_employees(request: Request, username=Depends(authenticate_user)):
    employees = await Employee.all().values("id","empid", "name", "email")
    
    if not employees:
        raise HTTPException(status_code=404, detail="No employees found")

    enriched_employees = []
    for emp in employees:
        emp_id = str(emp["empid"])
        photo_dir = os.path.join(PHOTOS_BASE_PATH, emp_id)

        photo_url = None
        if os.path.isdir(photo_dir):
            files = os.listdir(photo_dir)
            image_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
            if image_files:
                # Use url_for to generate full URL
                photo_url = request.url_for("photos", path=f"{emp_id}/{image_files[0]}")

        emp["photoUrl"] = photo_url._url
        enriched_employees.append(emp)

    return {"employees": enriched_employees}

@router.post("/")
async def create_employee(name:str=Form(...), email:str=Form(...),file:UploadFile=File(...),empid:str=Form(...),username = Depends(authenticate_user)):
    if not name or not email or not file or not empid:
        raise HTTPException(status_code=400, detail="Name, email, file, and id are required")
    exiting_employee = await Employee.get_or_none(empid=empid)
    if exiting_employee:
        raise HTTPException(status_code=400, detail="Employee with this ID already exists")
    exiting_employee = await Employee.get_or_none(email=email)
    if exiting_employee:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
    employee_obj = await Employee.create(name=name, email=email,empid=empid)
    if not employee_obj:
        raise HTTPException(status_code=400, detail="Employee creation failed")
    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.empid))
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
    return {"created"}

@router.delete("/{id}")
async def delete_employee(id:int,username = Depends(authenticate_user)):
    
    employee_obj = await Employee.get_or_none(empid=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")
    await employee_obj.delete()
    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.empid))
    if os.path.exists(emp_dir):
        shutil.rmtree(emp_dir)
    return {"deleted"}

@router.put("/{id}")
async def update_employee(
    id: str,
    empid: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    username = Depends(authenticate_user)
):
    employee_obj = await Employee.get_or_none(empid=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing_employee = await Employee.get_or_none(email=email)
    if existing_employee and existing_employee.empid != id:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    existing_employee = await Employee.get_or_none(empid=empid)
    if existing_employee and existing_employee.empid != id:
        raise HTTPException(status_code=400, detail="Employee with this ID already exists")

    # If empid is changing, rename the photo directory
    old_empid = employee_obj.empid
    if empid != old_empid:
        old_dir = os.path.join(UPLOAD_FOLDER, str(old_empid))
        new_dir = os.path.join(UPLOAD_FOLDER, str(empid))
        if os.path.exists(old_dir):
            os.rename(old_dir, new_dir)

    # Update employee object
    employee_obj.name = name
    employee_obj.email = email
    employee_obj.empid = empid
    await employee_obj.save()

    return {"emp": {"empid": employee_obj.empid, "name": employee_obj.name, "email": employee_obj.email}}


@router.get("/photos/{id}")
async def get_employee_photos(id: str, request: Request, username=Depends(authenticate_user)):
    employee = await Employee.get_or_none(empid=id).values("id","empid", "name", "email")

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_id = str(employee["empid"])
    photo_dir = os.path.join(PHOTOS_BASE_PATH, emp_id)

    photo_urls = []
    if os.path.isdir(photo_dir):
        files = os.listdir(photo_dir)
        image_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        for filename in image_files:
            url = request.url_for("photos", path=f"{emp_id}/{filename}")
            photo_urls.append(url._url)

    return {"urls":photo_urls}

@router.post("/addphoto/{id}")
async def add_photo(id:str,request:Request, file:UploadFile=File(...), username = Depends(authenticate_user)):
    employee_obj = await Employee.get_or_none(empid=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.empid))
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

    # Generate public photo URL
    photo_url = request.url_for("photos", path=f"{employee_obj.empid}/{unique_filename}")._url

    return {"photo_url": photo_url}

@router.post("/deletephoto/{id}")
async def delete_photo(id: str,file: str = Form(...),username = Depends(authenticate_user)):
    employee_obj = await Employee.get_or_none(empid=id)
    if not employee_obj:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_dir = os.path.join(UPLOAD_FOLDER, str(employee_obj.empid))
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
            detail="At least one photo must remain."
        )
    os.remove(file_path)
    return {"message": "Photo deleted successfully"}



@router.post("/enter")
async def enter(request: Request):
    data = await request.json()
    empid = data.get("empid")

    if not empid:
        return JSONResponse(status_code=400, content={"error": "empid is required"})

    print(f"{empid} Entered!")
    return {"status": "success", "message": f"Employee {empid} entered"}

@router.post("/exit")
async def exit(request: Request):
    data = await request.json()
    empid = data.get("empid")

    if not empid:
        return JSONResponse(status_code=400, content={"error": "empid is required"})

    print(f"{empid} Exited!")
    return {"status": "success", "message": f"Employee {empid} exited"}

