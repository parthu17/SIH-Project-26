# Inspectra — Smart Real-Time Monitoring & Inspection App

Inspectra is a web-based institution monitoring and inspection platform developed for **Smart India Hackathon (SIH) 2026**, addressing **Problem Statement SIH26095 — Smart Real-Time Monitoring & Inspection Mobile App**.

The platform combines a centralized monitoring dashboard with a field-inspector workflow to help manage institutions, inspections, compliance status, flagged issues, and risk assessment.

## Features

- **Dashboard:** Centralized overview of inspection activities and key metrics.
- **Institution Management:** View and manage institution-related information.
- **Inspection Management:** Track inspection records and their statuses.
- **Pending Assignments:** View inspections awaiting action.
- **Risk Monitoring:** Display risk scores and identify potentially high-risk institutions.
- **Photo Uploads:** Attach inspection photos through the backend API.
- **Issue Tracking:** Monitor flagged issues and compliance concerns.

## Tech Stack

**Frontend**
- React
- Vite
- HTML
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- SQLAlchemy
- SQLite

**Tools**
- Git
- GitHub
- npm

## Project Structure

```text
SIH-Project/
├── backend/
│   ├── main.py
│   ├── crud.py
│   ├── database.py
│   ├── requirements.txt
│   └── uploads/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
└── README.md
```

*The structure above is representative; additional files and directories may exist in the repository.*

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Python 3.x
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/parthu17/SIH-Project-26.git
cd SIH-Project
```

### 2. Run the Backend

Open a terminal in `SIH-main` directory:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The FastAPI backend will run at:

- **API base URL:** http://localhost:8000
- **Interactive API documentation(Swagger UI):** http://localhost:8000/docs
- **Uploaded photos:** Served through the `/uploads/` endpoint.

Uploaded inspection photos are stored locally in `backend/uploads/`.

### 3. Run the Frontend

Open a second terminal from `SIH-main`:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed in the terminal, usually:

http://localhost:5173

The React + Vite frontend communicates with the backend using the `VITE_API_BASE` environment variable.

By default, the API base URL is:

```text
http://localhost:8000
```

Configure it in `frontend/.env` if necessary:

```env
VITE_API_BASE=http://localhost:8000
```

Keep the backend and frontend running in separate terminals while using the application.

## Backend and Data Management

### Database

Inspectra uses SQLite with SQLAlchemy for database operations.

The database connection is configured in `backend/database.py`. For deployment or larger-scale usage, SQLite can be replaced with PostgreSQL by updating `SQLALCHEMY_DATABASE_URL` and configuring the appropriate database driver.

### Risk Assessment

Risk-score calculations and surprise-inspection weighting are implemented server-side in `backend/crud.py` taking into consideration the previous risk and the flagged status.

### Photo Storage

Inspection photos are uploaded to local disk and served through the backend's `/uploads/` route.

For production deployment, cloud storage such as Amazon S3 or an equivalent object-storage service can provide more scalable and reliable file management.

## Current Limitations and Future Enhancements

Potential improvements include:

- **Authentication and Authorization:** Replace the hardcoded inspector identity (`"You"`) with authenticated user accounts and role-based access control, such as JWT-based authentication.
- **Real-Time Monitoring:** Introduce live updates for inspection status, assignments, and compliance metrics.
- **Advanced Analytics:** Improve reporting, visualization, and trend analysis.
- **Risk Assessment:** Refine risk-scoring models and inspection-prioritization logic.
- **Cloud Storage:** Move inspection photo uploads from local disk to cloud storage.
- **Database Scalability:** Migrate from SQLite to PostgreSQL for deployment.
- **Testing and Validation:** Add automated tests, stronger input validation, and error handling.
- **Production Deployment:** Configure secure environment variables, deployment infrastructure, and monitoring.

## Project Objective

Inspectra aims to support more transparent and efficient institutional inspections by bringing monitoring, inspection management, compliance tracking, and risk assessment into a unified platform.

The dashboard and field-inspector workflow demonstrate how a centralized digital solution can help organize inspection activities and make relevant information easier to access.

## Contributors

Developed as part of **Smart India Hackathon 2026**.

## Acknowledgements

We acknowledge Smart India Hackathon for providing the problem statement and an opportunity to develop a technology-driven solution for institutional monitoring and inspection.

---

**Project Name:** Inspectra  
**Problem Statement ID:** SIH26095  
**Domain:** Web Development | Institutional Monitoring | Inspection Management | Compliance Analytics
