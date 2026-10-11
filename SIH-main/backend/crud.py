import random
import time
import uuid
from sqlalchemy.orm import Session

import models
from seed_data import SEED_INSTITUTIONS, SEED_INSPECTIONS, INSPECTOR_NAMES


def now_ms():
    return int(time.time() * 1000)


def new_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def seed_if_empty(db: Session):
    if db.query(models.Institution).count() == 0:
        for i in SEED_INSTITUTIONS:
            db.add(models.Institution(**i))
    if db.query(models.Inspection).count() == 0:
        for i in SEED_INSPECTIONS:
            db.add(models.Inspection(**i))
    db.commit()


def reset_demo(db: Session):
    db.query(models.Institution).delete()
    db.query(models.Inspection).delete()
    db.query(models.PendingAssignment).delete()
    db.commit()
    seed_if_empty(db)


def list_institutions(db: Session):
    return [i.to_dict() for i in db.query(models.Institution).all()]


def list_inspections(db: Session):
    rows = db.query(models.Inspection).order_by(models.Inspection.timestamp.desc()).all()
    return [i.to_dict() for i in rows]


def list_pending(db: Session):
    rows = db.query(models.PendingAssignment).order_by(models.PendingAssignment.created_at.desc()).all()
    return [p.to_dict() for p in rows]


def submit_inspection(db: Session, institution_id, inspector, attendance, expected,
                       facility_ok, hygiene_ok, documents_ok, notes, photo_url):
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise ValueError("Institution not found")

    attendance_ratio = (attendance / expected) if expected > 0 else 1
    issues = 0
    if not facility_ok:
        issues += 1
    if not hygiene_ok:
        issues += 1
    if not documents_ok:
        issues += 1
    if attendance_ratio < 0.7:
        issues += 1
    flagged = issues > 0
    delta = issues * 12 + (15 if attendance_ratio < 0.5 else 0)
    new_risk = round(inst.risk_score * 0.5 + delta + (10 if flagged else -6))
    new_risk = max(4, min(96, new_risk))

    record = models.Inspection(
        id=new_id("insp"),
        institution_id=inst.id,
        institution_name=inst.name,
        inspector=inspector,
        timestamp=now_ms(),
        lat=inst.lat + (random.random() - 0.5) * 0.002,
        lng=inst.lng + (random.random() - 0.5) * 0.002,
        attendance=attendance,
        expected=expected,
        facility_ok=facility_ok,
        hygiene_ok=hygiene_ok,
        documents_ok=documents_ok,
        notes=notes,
        flagged=flagged,
        prev_risk=inst.risk_score,
        photo_url=photo_url,
    )
    db.add(record)

    inst.risk_score = new_risk
    inst.last_inspection = now_ms()

    pending = db.query(models.PendingAssignment).filter(
        models.PendingAssignment.institution_id == inst.id
    ).first()
    if pending:
        db.delete(pending)

    db.commit()
    db.refresh(record)
    return record.to_dict()


def trigger_surprise(db: Session):
    institutions = db.query(models.Institution).all()
    if not institutions:
        raise ValueError("No institutions")

    weighted = []
    for i in institutions:
        weighted.extend([i] * max(1, round(i.risk_score / 20)))
    pick = random.choice(weighted)
    inspector = random.choice(INSPECTOR_NAMES)

    assignment = models.PendingAssignment(
        id=new_id("assign"),
        institution_id=pick.id,
        institution_name=pick.name,
        inspector=inspector,
        type="surprise",
        created_at=now_ms(),
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment.to_dict()
