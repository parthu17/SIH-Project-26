from sqlalchemy import Column, String, Float, Integer, Boolean, BigInteger
from database import Base


class Institution(Base):
    __tablename__ = "institutions"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    risk_score = Column(Integer, default=0)
    cctv = Column(String, default="online")  # "online" | "offline"
    last_inspection = Column(BigInteger, nullable=True)  # epoch ms

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "lat": self.lat,
            "lng": self.lng,
            "riskScore": self.risk_score,
            "cctv": self.cctv,
            "lastInspection": self.last_inspection,
        }


class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(String, primary_key=True, index=True)
    institution_id = Column(String, nullable=False)
    institution_name = Column(String, nullable=False)
    inspector = Column(String, nullable=False)
    timestamp = Column(BigInteger, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    attendance = Column(Integer, nullable=False)
    expected = Column(Integer, nullable=False)
    facility_ok = Column(Boolean, default=True)
    hygiene_ok = Column(Boolean, default=True)
    documents_ok = Column(Boolean, default=True)
    notes = Column(String, default="")
    flagged = Column(Boolean, default=False)
    prev_risk = Column(Integer, nullable=True)
    photo_url = Column(String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "institutionId": self.institution_id,
            "institutionName": self.institution_name,
            "inspector": self.inspector,
            "timestamp": self.timestamp,
            "lat": self.lat,
            "lng": self.lng,
            "attendance": self.attendance,
            "expected": self.expected,
            "facilityOk": self.facility_ok,
            "hygieneOk": self.hygiene_ok,
            "documentsOk": self.documents_ok,
            "notes": self.notes,
            "flagged": self.flagged,
            "prevRisk": self.prev_risk,
            "photoUrl": self.photo_url,
        }


class PendingAssignment(Base):
    __tablename__ = "pending_assignments"
    id = Column(String, primary_key=True, index=True)
    institution_id = Column(String, nullable=False)
    institution_name = Column(String, nullable=False)
    inspector = Column(String, nullable=False)
    type = Column(String, default="surprise")
    created_at = Column(BigInteger, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "institutionId": self.institution_id,
            "institutionName": self.institution_name,
            "inspector": self.inspector,
            "type": self.type,
            "createdAt": self.created_at,
        }
