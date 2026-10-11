# Inspectra

Real-time institution monitoring & inspection app (dashboard + field-inspector mobile flow).

## Structure
- `backend/` — FastAPI + SQLite API (institutions, inspections, pending assignments, photo uploads)
- `frontend/` — React + Vite app (dashboard view and phone-frame inspector view)

## Run the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs
Uploaded photos are stored in `backend/uploads/` and served at `/uploads/<file>`.

## Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open the printed local URL (usually http://localhost:5173). It talks to the API at `VITE_API_BASE` (set in `frontend/.env`, defaults to `http://localhost:8000`).

## Notes / next steps
- Risk-score logic and surprise-inspection weighting live server-side in `backend/crud.py`.
- Swap SQLite for Postgres by changing `SQLALCHEMY_DATABASE_URL` in `backend/database.py` when you deploy.
- Inspector identity is hardcoded to `"You"` — add auth (JWT) to attribute real inspectors.
- Uploaded photos go to local disk — move to S3/cloud storage for production.
