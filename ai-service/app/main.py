import os
from contextlib import asynccontextmanager
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.extract import router as extract_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize models, connections or warm-ups
    environment = os.getenv("ENVIRONMENT", "development")
    provider = os.getenv("AI_PROVIDER", "gemini")
    print(f"[BrandLens AI Service] Initialized in {environment} mode. Default AI Provider: {provider}")
    yield
    # Shutdown logic
    print("[BrandLens AI Service] Shutting down.")

app = FastAPI(
    title="BrandLens AI Analysis Service",
    description="Explainable Brand Governance AI & Document Analysis Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration (explicit allowlist from ALLOWED_ORIGINS; never combine wildcard with credentials)
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000,http://localhost:5173")
allowed_origins = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]
allow_all = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else allowed_origins,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# Normalize Vercel Serverless Function rewritten paths
@app.middleware("http")
async def normalize_vercel_paths(request: Request, call_next):
    raw_path = request.scope.get("path", "")
    for prefix in ["/api/index.py", "/api/index", "/main.py"]:
        if raw_path.startswith(prefix):
            stripped = raw_path[len(prefix):]
            request.scope["path"] = stripped if stripped.startswith("/") else ("/" + stripped)
            break
    return await call_next(request)

# Include routers
app.include_router(health_router, tags=["Health"])
app.include_router(extract_router, tags=["Extraction & Visual Checks"])

@app.get("/", tags=["Root"])
@app.get("/api/index.py", tags=["Root"], include_in_schema=False)
@app.get("/api/index", tags=["Root"], include_in_schema=False)
@app.get("/main.py", tags=["Root"], include_in_schema=False)
async def root():
    return {
        "service": "BrandLens AI Analysis Engine",
        "team": "ALGO_X",
        "tagline": "Intelligent brand governance, before you publish.",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "/api/status"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
