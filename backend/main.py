from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import transactions, kpis, insights, trends

app = FastAPI(title="Finance BI API", version="1.0.0")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict to frontend deployment URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(kpis.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(trends.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Finance BI API"}
