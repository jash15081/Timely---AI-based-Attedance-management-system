
from fastapi import APIRouter, Depends, HTTPException,UploadFile,File,Form,Request

from utils import authenticate_user
import dotenv
import os
from models import Environment
import subprocess
from fastapi.responses import StreamingResponse
enter_proc = None
exit_proc = None
MODEL_PATH = os.getenv("MODEL_PATH")
ENV_PATH = os.getenv("ENV_PATH")
EMBD_PATH = os.getenv("EMBD_PATH")
PHOTOS_PATH = os.getenv("PHOTOS_PATH")
dotenv.load_dotenv()

router = APIRouter(
    prefix="/model",
    tags=["Model"]
)
from fastapi import Depends
import subprocess
import os

@router.post("/start")
async def start_model(username=Depends(authenticate_user)):
    global enter_proc, exit_proc

    try:
        venv_python = os.path.abspath(ENV_PATH)
        model_script = os.path.abspath(MODEL_PATH)

        Camera_Enter = await Environment.get_or_none(key="CAMERA_ENTER")
        Camera_Exit = await Environment.get_or_none(key="CAMERA_EXIT")

        enter_url = Camera_Enter.value if Camera_Enter else None
        exit_url = Camera_Exit.value if Camera_Exit else None

        if not enter_url or not exit_url:
            return {"error": "CAMERA_ENTER or CAMERA_EXIT URL not found."}

        # Start both models (non-blocking)
        enter_proc = subprocess.Popen(
            [venv_python, model_script, 'enter', enter_url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        exit_proc = subprocess.Popen(
            [venv_python, model_script, 'exit', exit_url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        return {"status": "success", "message": "Both models started."}

    except Exception as e:
        return {"status": "error", "details": str(e)}

    
@router.post("/stop")
async def stop_model(username=Depends(authenticate_user)):
    global enter_proc, exit_proc
    results = {}

    try:
        if enter_proc and enter_proc.poll() is None:
            enter_proc.terminate()
            enter_proc.wait()
            results["enter"] = "terminated"
        else:
            results["enter"] = "not running"

        if exit_proc and exit_proc.poll() is None:
            exit_proc.terminate()
            exit_proc.wait()
            results["exit"] = "terminated"
        else:
            results["exit"] = "not running"

        return {"status": "success", "results": results}

    except Exception as e:
        return {"status": "error", "details": str(e)}


@router.post("/generate-embeddings")
async def generate_embeddings(username =Depends(authenticate_user)):
    
    try:
        directory = os.path.abspath(PHOTOS_PATH)
        venv_python = os.path.abspath(ENV_PATH)
        model_script = os.path.abspath(EMBD_PATH)
        result = subprocess.run(
            [venv_python, model_script,directory],
            capture_output=True,
            text=True,
            check=True  # Raises CalledProcessError on non-zero exit
        )
        
        # You can also parse or log result.stdout if needed
        return {
            "status": "success",
            "message": f"Embedding generation completed successfully by user {username}.",
            "output": result.stdout.strip()
        }
    except subprocess.CalledProcessError as e:
        # This means the script failed
        raise HTTPException(
            status_code=500,
            detail=f"Embedding generation failed: {e.stderr.strip() if e.stderr else str(e)}"
        )
    except Exception as e:
        # Generic fallback error
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )