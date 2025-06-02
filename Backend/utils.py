from fastapi import Request, HTTPException
from jose import JWTError, jwt
import dotenv
import os
import time
import cv2
import re
dotenv.load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


def authenticate_user(request:Request):
    time.sleep(0.5)  # Simulate some processing delay
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorised")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
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


