
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
import asyncio

@router.post("/start")
async def start_model(username=Depends(authenticate_user)):
    global enter_proc, exit_proc
    print("start")
    try:
        venv_python = os.path.abspath(ENV_PATH)
        model_script = os.path.abspath(MODEL_PATH)

        Camera_Enter = await Environment.get_or_none(key="CAMERA_ENTER")
        Camera_Exit = await Environment.get_or_none(key="CAMERA_EXIT")

        enter_url = Camera_Enter.value if Camera_Enter else None
        exit_url = Camera_Exit.value if Camera_Exit else None

        if not enter_url or not exit_url:
            return {"error": "CAMERA_ENTER or CAMERA_EXIT URL not found."}

        # Start both models (capture stdout)
        enter_proc = subprocess.Popen(
            [venv_python, model_script, 'enter', enter_url],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        exit_proc = subprocess.Popen(
            [venv_python, model_script, 'exit', exit_url],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        # Async wait for "streaming - " line from both
        async def wait_for_start(proc, label):
            while True:
                line = await asyncio.to_thread(proc.stdout.readline)
                if not line:
                    break
                print(f"[{label}] {line.strip()}")
                if "streaming -" in line:
                    break;

        await asyncio.gather(
            wait_for_start(enter_proc, "enter"),
            wait_for_start(exit_proc, "exit")
        )
        print("done")
        return {"status": "success", "message": "Both models started and streaming."}

    except Exception as e:
        return {"status": "error", "details": str(e)}

    
@router.get("/status")
async def check_model_status(username=Depends(authenticate_user)):
    global enter_proc, exit_proc

    try:
        enter_running = enter_proc and enter_proc.poll() is None
        exit_running = exit_proc and exit_proc.poll() is None

        if enter_running and exit_running:
            return {"status": "running"}
        elif not enter_running and not exit_running:
            return {"status": "stopped"}
        else:
            return {"status": "partial", "details": {
                "enter": "running" if enter_running else "stopped",
                "exit": "running" if exit_running else "stopped"
            }}
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
async def generate_embeddings(username=Depends(authenticate_user)):
    try:
        directory = os.path.abspath(PHOTOS_PATH)
        venv_python = os.path.abspath(ENV_PATH)
        model_script = os.path.abspath(EMBD_PATH)

        process = subprocess.Popen(
            [venv_python, model_script, directory],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        logs = []
        while True:
            line = process.stdout.readline()
            if line == "" and process.poll() is not None:
                break
            if line:
                logs.append(line.strip())

        stderr_output = process.stderr.read()
        if process.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Embedding generation failed:\n{stderr_output.strip()}"
            )

        return {
            "status": "success",
            "message": f"Embedding generation completed successfully by user {username}.",
            "logs": logs
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )