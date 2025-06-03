from fastapi import Request, HTTPException
from jose import JWTError, jwt
import dotenv
import os
import time
import cv2
import re
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
from models import Admin,Employee
from zoneinfo import ZoneInfo 

dotenv.load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXPIRE_TIME = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
LOCAL_TIMEZONE = ZoneInfo("Asia/Kolkata")  
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed):
    return pwd_context.verify(plain_password, hashed)

def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(int(EXPIRE_TIME))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
def convert_to_local(dt):
     # treat naive as UTC
    return dt.astimezone(LOCAL_TIMEZONE)

def format_duration(seconds: int):
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours}h {minutes}m"

async def authenticate_user(request:Request):
    time.sleep(0.5)  # Simulate some processing delay
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorised")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token ppayload")
        user = await Admin.get_or_none(username=username)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username in token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def authenticate_employee(request:Request):
    time.sleep(0.5)  # Simulate some processing delay
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorised")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        empid = payload.get("empid")
        if empid is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        employee = await Employee.get_or_none(empid=empid)
        if not employee:
            raise HTTPException(status_code=401,detail="Invalid empid in token")
        return empid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
def is_rtsp_stream_accessible(url):
    cap = cv2.VideoCapture(url)
    if not cap.isOpened():
        return False
    ret, frame = cap.read()
    cap.release()
    return ret

def is_valid_rtsp_url(url):
    pattern = re.compile(r'^rtsp://(?:[^\s:@]+(?::[^\s:@]*)?@)?[^\s:/?#]+(?::\d+)?(?:/[^\s]*)?$')
    return bool(pattern.match(url))

def generate_frames(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print(f"Error: Cannot open stream {rtsp_url}")
        return
    while True:
        success, frame = cap.read()
        if not success:
            break
        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'
        )
    cap.release()


