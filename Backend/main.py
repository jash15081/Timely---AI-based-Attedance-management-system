from fastapi import FastAPI,Depends, HTTPException,Response,Request,UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from tortoise.contrib.fastapi import register_tortoise
from models import Admin, TimeLog, Employee
from pydantic import BaseModel
from pydantic_models import AdminIn, EmployeeIn
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import dotenv
import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from routes.employee_routes import router as employee_router
from utils import authenticate_user
from fastapi.middleware.cors import CORSMiddleware
import time
dotenv.load_dotenv()
CORS_ORIGIN = os.getenv("CORS_ORIGIN")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXPIRE_TIME = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


app  = FastAPI()


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

@app.post("/admin")
async def create_admins(admin: AdminIn,username = Depends(authenticate_user)):
    if(username != "superuser"):
        raise HTTPException(status_code=403, detail="Forbidden")
    admin.password = pwd_context.hash(admin.password)
    admin_obj = await Admin.create(**admin.model_dump())
    return {"created"}    


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

@app.delete("/admin/{admin_id}")
async def delete_admin(admin_id: int,username = Depends(authenticate_user)):
    if(username != "superuser"):
        raise HTTPException(status_code=403, detail="Forbidden")
    admin = await Admin.get_or_none(id=admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    await admin.delete()
    return {"message": "Admin deleted successfully"}

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


