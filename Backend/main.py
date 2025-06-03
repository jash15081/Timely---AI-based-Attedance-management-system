from fastapi import FastAPI,Depends, HTTPException,Response,Request,UploadFile, File,Form,Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from tortoise.contrib.fastapi import register_tortoise
from models import Admin, TimeLog, Employee,Environment
from pydantic import BaseModel
from pydantic_models import AdminIn, EmployeeIn,ConfigIn
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import dotenv
import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from routes.employee_routes import router as employee_router
from utils import authenticate_user, generate_frames,authenticate_employee,convert_to_local,format_duration
from fastapi.middleware.cors import CORSMiddleware
from utils import is_valid_rtsp_url,is_rtsp_stream_accessible,verify_password,create_token
import urllib.parse
from fastapi.responses import StreamingResponse
import time
from tortoise import Tortoise
from routes.model_routes import router as model_router
from datetime import date
dotenv.load_dotenv()
CORS_ORIGIN = os.getenv("CORS_ORIGIN")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXPIRE_TIME = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


app  = FastAPI()

photos_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'photos'))
print(f"Photos directory: {photos_path}")
app.mount("/static/photos", StaticFiles(directory=photos_path), name="photos")

register_tortoise(
    app,
    config_file="tortoise_config.json",
    generate_schemas=True,  # Auto-create tables
    add_exception_handlers=True,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGIN,  # list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods: POST, GET, OPTIONS etc.
    allow_headers=["*"],  # allow all headers
)
app.include_router(employee_router)
app.include_router(model_router)


@app.get("/admin")
async def get_admins(username = Depends(authenticate_user)):
    if username != "superuser":
        raise HTTPException(status_code=403, detail="Forbidden")

    admins = await Admin.all().values("id", "username")
    return JSONResponse(content=admins)

@app.post("/admin")
async def create_admins(admin: AdminIn,username = Depends(authenticate_user)):
    if(username != "superuser"):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not admin.username or not admin.password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    existing_admin = await Admin.get_or_none(username=admin.username)
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin with this username already exists")
    admin.password = pwd_context.hash(admin.password)
    admin_obj = await Admin.create(**admin.model_dump())
    return {admin_obj}    



@app.delete("/admin/{admin_id}")
async def delete_admin(admin_id: int,username = Depends(authenticate_user)):
    if(username != "superuser"):
        raise HTTPException(status_code=403, detail="Forbidden")
    admin = await Admin.get_or_none(id=admin_id)
    if admin.username == "superuser":
        raise HTTPException(status_code=403,detail="Can't Delete the Superuser")
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    await admin.delete()
    return {"message": "Admin deleted successfully"}

@app.post("/login")
async def login(response:Response,username:str = Form(...),password:str = Form(...)):
    admin = await Admin.get_or_none(username=username)
    if not admin or not verify_password(password, admin.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": admin.username})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  
        samesite="lax",
        max_age=3600  
    )
    return {"username": admin.username}

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}


@app.post("/admin/change-password")
async def change_password(
    username:str = Form(...),
    old_password: str = Form(...),
    new_password: str = Form(...),
    
):
    # Fetch the employee
    
    admin = await Admin.get_or_none(username=username)
    print(admin)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Verify old password
    if not pwd_context.verify(old_password, admin.password):
        raise HTTPException(status_code=401, detail="Incorrect old password")

    # Prevent using the same password again
    if pwd_context.verify(new_password, admin.password):
        raise HTTPException(status_code=400, detail="New password must be different from the old password")

    # Hash and update the password
    admin.password = pwd_context.hash(new_password)
    await admin.save()

    return {"message": "Password changed successfully"}



@app.get("/getme")
async def authenticate_any_user(request: Request):
    try:
        username = await authenticate_user(request)
        return {"type": "admin", "username": username}
    except HTTPException:
        pass  # Try the next one

    try:
        empid = await authenticate_employee(request)
        return {"type": "employee", "empid": empid}
    except HTTPException:
        pass

    raise HTTPException(status_code=401, detail="Authentication failed")


@app.get("/configure")
async def get_config(username = Depends(authenticate_user)):
    if username != "superuser":
        raise HTTPException(status_code=403, detail="Forbidden")
    envs_enter = await Environment.get_or_none(key="CAMERA_ENTER")
    envs_exit = await Environment.get_or_none(key="CAMERA_EXIT")
    if not envs_enter or not envs_exit:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"camera_enter": envs_enter.value, "camera_exit": envs_exit.value}


@app.post("/configure")
async def set_config(cfg:ConfigIn, username = Depends(authenticate_user)):
    if username != "superuser":
        raise HTTPException(status_code=403, detail="Forbidden")
    if(not cfg.camera_enter or not cfg.camera_exit or not is_valid_rtsp_url(cfg.camera_enter) or not is_valid_rtsp_url(cfg.camera_exit)):
        raise HTTPException(status_code=400, detail="Invalid configuration values")
    
    if(is_rtsp_stream_accessible(cfg.camera_enter) == False):
        raise HTTPException(status_code=400, detail="Camera enter stream is not accessible")
    if(is_rtsp_stream_accessible(cfg.camera_exit) == False):
        raise HTTPException(status_code=400, detail="Camera exit stream is not accessible")
    envs = await Environment.get_or_none(key="CAMERA_ENTER")
    if envs:
        envs.value = cfg.camera_enter
        await envs.save()
    else:
        await Environment.create(key="CAMERA_ENTER", value=cfg.camera_enter)
    envs = await Environment.get_or_none(key="CAMERA_EXIT")
    if envs:
        envs.value = cfg.camera_exit
        await envs.save()
    else:
        await Environment.create(key="CAMERA_EXIT", value=cfg.camera_exit)
    return {"message": "Configuration updated successfully"}

@app.get("/stream")
async def stream_camera(request: Request):
    rtsp_url = request.query_params.get("url")
    print(f"Received RTSP URL: {rtsp_url}")
    if not rtsp_url:
        raise HTTPException(status_code=400, detail="Missing RTSP URL")

    decoded_url = urllib.parse.unquote(rtsp_url)

    # Validate the URL
    if not decoded_url.startswith("rtsp://"):
        raise HTTPException(status_code=400, detail="Invalid RTSP URL")

    # Use try-except to catch any OpenCV errors
    try:
        return StreamingResponse(
            generate_frames(decoded_url),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/user-attendance")
async def get_user_attendance_summary(
    empid='SDNA001',
    start_date: date = Query(...),
    end_date: date = Query(...)
):  
    print(empid)
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
         # Python 3.9+
# Or use `pytz` if you're on Python < 3.9

        
        result.append({
            "date": current.strftime("%Y-%m-%d"),
            "firstEntry": convert_to_local(entry_time).strftime("%I:%M %p") if entry_time else "-",
            "lastExit": convert_to_local(exit_time).strftime("%I:%M %p") if exit_time else "-",  # will be "-" if still inside today
            "totalInTime": format_duration(int(in_time)) if entry_time and exit_time else "-",
            "totalOutTime": format_duration(int(total_out_time)) if entry_time and exit_time else "-",
            "status": "Present" if entry_time and not corrupted else ("Absent" if not entry_time else "Corrupted")
        })

        current += timedelta(days=1)

    return result