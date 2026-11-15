from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str

class ServiceStatusResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    ai_provider: str
    ai_model: str
    embedding_model: str
    supported_formats: List[str]
    active_capabilities: List[str]
