import time

NOW = int(time.time() * 1000)
DAY = 86400000

SEED_INSTITUTIONS = [
    {"id": "inst-1", "name": "Govt. Skill Training Centre, Sector 12", "category": "Skill Development",
     "lat": 28.6139, "lng": 77.209, "risk_score": 22, "cctv": "online", "last_inspection": NOW - DAY * 3},
    {"id": "inst-2", "name": "Adarsh Vocational Institute", "category": "Vocational",
     "lat": 19.076, "lng": 72.8777, "risk_score": 58, "cctv": "online", "last_inspection": NOW - DAY * 9},
    {"id": "inst-3", "name": "Deen Dayal Welfare Home", "category": "Welfare / Residential",
     "lat": 26.9124, "lng": 75.7873, "risk_score": 71, "cctv": "offline", "last_inspection": NOW - DAY * 14},
    {"id": "inst-4", "name": "Rural Livelihood Mission Centre", "category": "Livelihood",
     "lat": 22.5726, "lng": 88.3639, "risk_score": 15, "cctv": "online", "last_inspection": NOW - DAY * 2},
    {"id": "inst-5", "name": "SC/ST Girls Hostel, Block C", "category": "Residential",
     "lat": 12.9716, "lng": 77.5946, "risk_score": 44, "cctv": "online", "last_inspection": NOW - DAY * 6},
]

SEED_INSPECTIONS = [
    {"id": "insp-1", "institution_id": "inst-2", "institution_name": "Adarsh Vocational Institute",
     "inspector": "A. Verma", "timestamp": NOW - DAY, "lat": 19.077, "lng": 72.878,
     "attendance": 34, "expected": 50, "facility_ok": False, "hygiene_ok": True, "documents_ok": True,
     "notes": "Attendance register mismatch vs headcount.", "flagged": True, "prev_risk": None, "photo_url": None},
    {"id": "insp-2", "institution_id": "inst-1", "institution_name": "Govt. Skill Training Centre, Sector 12",
     "inspector": "R. Sharma", "timestamp": NOW - DAY * 3, "lat": 28.614, "lng": 77.21,
     "attendance": 48, "expected": 50, "facility_ok": True, "hygiene_ok": True, "documents_ok": True,
     "notes": "All checks clear.", "flagged": False, "prev_risk": None, "photo_url": None},
]

INSPECTOR_NAMES = ["R. Sharma", "A. Verma", "S. Iyer", "P. Nair"]
