import os
from fastapi import APIRouter
from app.schemas.health import HealthResponse, ServiceStatusResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        status="healthy",
        service="ai-service",
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development")
    )

@router.get("/api/status", response_model=ServiceStatusResponse)
async def get_service_status():
    return ServiceStatusResponse(
        status="operational",
        service="BrandLens AI Engine",
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development"),
        ai_provider=os.getenv("AI_PROVIDER", "gemini"),
        ai_model=os.getenv("AI_MODEL", "gemini-1.5-pro"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-004"),
        supported_formats=["txt", "pdf", "docx", "png", "jpg", "jpeg"],
        active_capabilities=[
            "deterministic_terminology",
            "wcag_contrast_calculation",
            "grounded_fact_verification",
            "tone_analysis",
            "intent_preserving_suggestions"
        ]
    )
