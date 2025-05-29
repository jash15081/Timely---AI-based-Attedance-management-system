from fastapi import FastAPI,Depends, HTTPException,Response,Request,UploadFile, File
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
from utils import authenticate_user, generate_frames
from fastapi.middleware.cors import CORSMiddleware
from utils import is_valid_rtsp_url,is_rtsp_stream_accessible
import urllib.parse
from fastapi.responses import StreamingResponse
import time
from tortoise import Tortoise

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


def verify_password(plain_password, hashed):
    return pwd_context.verify(plain_password, hashed)

def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(int(EXPIRE_TIME))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    await admin.delete()
    return {"message": "Admin deleted successfully"}

@app.post("/login")
async def login(response:Response,form_data: OAuth2PasswordRequestForm = Depends()):
    admin = await Admin.get_or_none(username=form_data.username)
    if not admin or not verify_password(form_data.password, admin.password):
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

@app.get("/getme")
async def get_me(username = Depends(authenticate_user)):
    time.sleep(1)  # Simulate a delay for demonstration purposes
    if username == "superuser":
        return {"username": username, "role": "superuser"}
    else:
        admin = await Admin.get_or_none(username=username)
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        return {"username": admin.username, "role": "admin"}

import re

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
    
