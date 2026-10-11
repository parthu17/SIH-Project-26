import os
import uuid

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import crud
from database import engine, get_db, Base

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inspectra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup():
    db = next(get_db())
    crud.seed_if_empty(db)


@app.get("/api/institutions")
def get_institutions(db: Session = Depends(get_db)):
    return crud.list_institutions(db)


@app.get("/api/inspections")
def get_inspections(db: Session = Depends(get_db)):
    return crud.list_inspections(db)


@app.get("/api/pending")
def get_pending(db: Session = Depends(get_db)):
    return crud.list_pending(db)


@app.post("/api/inspections")
async def create_inspection(
    institution_id: str = Form(...),
    inspector: str = Form(...),
    attendance: int = Form(...),
    expected: int = Form(...),
    facility_ok: bool = Form(...),
    hygiene_ok: bool = Form(...),
    documents_ok: bool = Form(...),
    notes: str = Form(""),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(photo.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(await photo.read())
    photo_url = f"/uploads/{filename}"

    try:
        record = crud.submit_inspection(
            db, institution_id, inspector, attendance, expected,
            facility_ok, hygiene_ok, documents_ok, notes, photo_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return record


@app.post("/api/pending/surprise")
def create_surprise(db: Session = Depends(get_db)):
    try:
        return crud.trigger_surprise(db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/reset")
def reset(db: Session = Depends(get_db)):
    crud.reset_demo(db)
    return {"status": "ok"}
