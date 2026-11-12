import asyncio
import os
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import crud
from database import engine, get_db, Base, SessionLocal

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inspectra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def upload_to_supabase(content, object_name, content_type):
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url and not service_key:
        return None
    if not supabase_url or not service_key:
        raise HTTPException(status_code=503, detail="Supabase Storage configuration is incomplete")

    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "inspection-photos")
    bucket_path = quote(bucket, safe="")
    object_path = quote(object_name, safe="/")
    endpoint = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket_path}/{object_path}"
    request = Request(
        endpoint,
        data=content,
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": content_type,
            "x-upsert": "false",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=30):
            pass
    except (HTTPError, URLError) as exc:
        raise HTTPException(status_code=502, detail="Photo upload to Supabase Storage failed") from exc

    return f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket_path}/{object_path}"


@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        crud.seed_if_empty(db)
    finally:
        db.close()


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
    content = await photo.read()
    photo_url = await asyncio.to_thread(
        upload_to_supabase,
        content,
        filename,
        photo.content_type or "application/octet-stream",
    )
    if photo_url is None:
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            f.write(content)
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


