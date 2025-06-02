# routers/employee.py
from fastapi import APIRouter, Depends, HTTPException,UploadFile,File,Form,Request,Query
from models import Employee,TimeLog 
from pydantic_models import EmployeeIn
from utils import authenticate_user
import shutil
import dotenv
import os
from uuid import uuid4
from fastapi.responses import JSONResponse
from tortoise.exceptions import DoesNotExist
from datetime import datetime, timedelta, date
from tortoise.expressions import Q
dotenv.load_dotenv()
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

router = APIRouter(
    prefix="/employee",
    tags=["Employees"]
)
def format_duration(seconds: int):
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours}h {minutes}m"
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

import pytz


LOCAL_TIMEZONE = pytz.timezone("Asia/Kolkata")
print(datetime.now(LOCAL_TIMEZONE))
@router.post("/enter")
async def enter(request: Request):
    data = await request.json()
    empid = data.get("empid")

    if not empid:
        return JSONResponse(status_code=400, content={"error": "empid is required"})

    try:
        employee = await Employee.get(empid=empid)
    except DoesNotExist:
        return JSONResponse(status_code=404, content={"error": "Employee not found"})

    # get current time in local timezone
    current_time = datetime.now(LOCAL_TIMEZONE)
    print(current_time)
    await TimeLog.create(employee=employee, action="IN", timestamp=current_time)

    print(f"{empid} Entered at {current_time}!", flush=True)
    return {"status": "success", "message": f"Employee {empid} entered"}

@router.post("/exit")
async def exit(request: Request):
    data = await request.json()
    empid = data.get("empid")

    if not empid:
        return JSONResponse(status_code=400, content={"error": "empid is required"})

    try:
        employee = await Employee.get(empid=empid)
    except DoesNotExist:
        return JSONResponse(status_code=404, content={"error": "Employee not found"})

    # get current time in local timezone
    current_time = datetime.now(LOCAL_TIMEZONE)

    await TimeLog.create(employee=employee, action="OUT", timestamp=current_time)

    print(f"{empid} Exited at {current_time}!", flush=True)
    return {"status": "success", "message": f"Employee {empid} exited"}


@router.get("/attendance/{empid}")
async def get_attendance_summary(
    empid: str,
    start_date: date = Query(...),
    end_date: date = Query(...)
):
    employee = await Employee.get_or_none(empid=empid)
    if not employee:
        return {"error": "Employee not found"}

    result = []
    today = date.today()

    current = start_date
    while current <= end_date:
        next_day = current + timedelta(days=1)
        logs = await TimeLog.filter(
            employee=employee,
            timestamp__gte=datetime.combine(current, datetime.min.time()),
            timestamp__lt=datetime.combine(next_day, datetime.min.time())
        ).order_by("timestamp")

        entry_time = None
        exit_time = None
        in_time = 0
        corrupted = False
        inside = False
        last_in = None
        in_out_pairs = []

        for log in logs:
            if log.action == "IN":
                if inside:
                    corrupted = True  # Two consecutive INs
                else:
                    last_in = log.timestamp
                    inside = True
                    if not entry_time:
                        entry_time = log.timestamp
            elif log.action == "OUT":
                if inside and last_in:
                    delta = (log.timestamp - last_in).total_seconds()
                    in_time += delta
                    in_out_pairs.append((last_in, log.timestamp))
                    exit_time = log.timestamp
                    inside = False
                    last_in = None
                else:
                    corrupted = True  # OUT without prior IN

        # Handle unmatched IN (still inside)
        if inside:
            if current == today:
                corrupted = False  # Allow it for today
                exit_time = None  # Don't set lastExit if still inside
            else:
                corrupted = True

        total_span = 0
        total_out_time = 0
        if entry_time and exit_time and entry_time < exit_time:
            total_span = (exit_time - entry_time).total_seconds()
            total_out_time = total_span - in_time

        result.append({
            "date": current.strftime("%Y-%m-%d"),
            "firstEntry": entry_time.strftime("%I:%M %p") if entry_time else "-",
            "lastExit": exit_time.strftime("%I:%M %p") if exit_time else "-",  # will be "-" if still inside today
            "totalInTime": format_duration(int(in_time)) if entry_time and exit_time else "-",
            "totalOutTime": format_duration(int(total_out_time)) if entry_time and exit_time else "-",
            "status": "Present" if entry_time and not corrupted else ("Absent" if not entry_time else "Corrupted")
        })

        current += timedelta(days=1)

    return result


@router.get("/summary/{target_date}")
async def get_attendance_summary_by_date(target_date: str ):
    # Get all employees
    try:
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    all_employees = await Employee.all()
    total_employees = len(all_employees)

    present = []
    absent = []

    for employee in all_employees:
        # Time range for that day
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date + timedelta(days=1), datetime.min.time())

        # Check if employee has at least one "IN" log
        log = await TimeLog.filter(
            employee=employee,
            action="IN",
            timestamp__gte=start_dt,
            timestamp__lt=end_dt
        ).first()

        if log:
            present.append({"empid": employee.empid, "name": employee.name})
        else:
            absent.append({"empid": employee.empid, "name": employee.name})

    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "totalEmployees": total_employees,
        "totalPresent": len(present),
        "totalAbsent": len(absent),
        "presentEmployees": present,
        "absentEmployees": absent
    }


