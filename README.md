# Finance Flow - Production Business Intelligence (BI) Platform

Finance Flow has been upgraded from a basic frontend dashboard into a **production-level Business Intelligence (BI) and Data Engineering platform**. It showcases enterprise data workflows by decoupling raw data ingestion from analytical computation and frontend visualization.

## 🌟 The Business Intelligence Architecture
This platform mirrors how enterprise companies (like Schlumberger / SLB) architect their internal tooling. Instead of a bloated frontend reading raw mock data, we built a highly scalable 3-tier BI ecosystem:

1. **ETL Data Pipeline (The Engineering Base):** 
   * Raw, unorganized data in CSV format is picked up by a Python pipeline.
   * We implemented an ETL (Extract, Transform, Load) script that cleanses missing values, assigns categories, and computes crucial aggregations. 
   * It securely loads refined data into a robust relational database (SQLite schemas), mimicking an OLAP data warehouse.

2. **The KPI & Insights Engine (The Analytics Brain):** 
   * A FastAPI Python backend serves as the mathematical core. 
   * Rather than the frontend computing totals, the backend crunches the numbers and computes key BI metrics like **Savings Rate**, **Budget Usage**, and **ROI**.
   * An intelligent **Insights Engine** compares month-over-month data and dynamically generates human-readable alerts (e.g., *"Your expenses spiked by 20% compared to last month"*).

3. **Decoupled Frontend (The Presentation Layer):** 
   * The React + Vite frontend is now strictly a presentation layer. It focuses purely on beautifully visualizing the REST API payloads via Tailwind CSS and Framer Motion charts.

## 📂 Project Structure
* `/frontend` - React Dashboard
* `/backend` - FastAPI Python Server 
* `/database` - SQLite automated setup and schema
* `/etl` - Data extraction pipelines and mock data generators

## 🚀 Setup Instructions (Local)

### 1. Setup Backend & ETL Pipeline
First, populate the mock warehouse by running the pipeline:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt

# Run Database Initialization and ETL Scripts from project root!
cd ..
python database/init_db.py
python etl/pipeline.py
```

### 2. Start the FastAPI Analytics Server
Start the Python backend serving the BI API layers:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
Your backend will be accessible at `http://localhost:8000`.

### 3. Start the Presentation UI
In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
Access the application on `http://localhost:5173`.

---

## ☁️ Deployment Guide

### Deploying the Frontend (Vercel)
Vercel is optimal for Next.js and Vite React apps:
1. Connect this repository to your Vercel account.
2. Ensure Vercel knows the Root Directory is set to `frontend/`.
3. Build command: `npm run build`
4. Publish directory: `dist/`
5. Map API calls: Set an environment variable `VITE_API_URL` leading to your deployed backend. (In the context setup, replace `http://127.0.0.1:8000` with `process.env.VITE_API_URL`).

### Deploying the Backend (Render)
Render is an excellent host for Python APIs and databases:
1. Connect via Render to deploy a "Web Service".
2. Select Root Directory as `backend/`.
3. Set Build Command: `pip install -r ../requirements.txt`
4. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Database Scaling (PostgreSQL Migration via Supabase)
Currently, the system uses SQLite to ensure zero-friction local setups!
For massive enterprise scale, easily switch to **Supabase (PostgreSQL)**:
1. Create a project on Supabase and fetch the connection URI.
2. Inside `backend/database.py`, modify `sqlite3.connect()` to utilize `psycopg2` or `SQLAlchemy` mapping, pointing to Supabase.
