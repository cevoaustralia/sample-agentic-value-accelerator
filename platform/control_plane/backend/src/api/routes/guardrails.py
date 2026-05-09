"""Guardrail template CRUD API routes"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging

from models.guardrail import (
    GuardrailTemplate,
    GuardrailTemplateCreate,
    GuardrailTemplateUpdate,
    GuardrailStatus,
    GuardrailPreset,
    GuardrailMetrics,
)
from services.guardrail_service import GuardrailService
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/guardrails", tags=["guardrails"])

_svc = None


def get_service() -> GuardrailService:
    global _svc
    if _svc is None:
        _svc = GuardrailService(
            table_name=settings.GUARDRAILS_TABLE_NAME,
            region=settings.AWS_REGION,
        )
    return _svc


# --- Presets ---

@router.get("/presets", response_model=List[GuardrailPreset])
async def list_presets():
    """Get pre-built guardrail configuration presets"""
    svc = get_service()
    return svc.get_presets()


# --- CRUD ---

@router.post("", response_model=GuardrailTemplate, status_code=201)
async def create_guardrail(req: GuardrailTemplateCreate):
    """Create a new guardrail template and provision it in Bedrock"""
    svc = get_service()
    template = svc.create_template(req, created_by="user")
    if template.status == GuardrailStatus.FAILED:
        raise HTTPException(
            status_code=502,
            detail=f"Guardrail creation failed: {template.status_history[-1].message if template.status_history else 'Unknown error'}"
        )
    return template


@router.get("", response_model=List[GuardrailTemplate])
async def list_guardrails(status: Optional[str] = Query(default=None)):
    """List all guardrail templates, optionally filtered by status"""
    svc = get_service()
    status_filter = GuardrailStatus(status) if status else None
    return svc.list_templates(status=status_filter)


@router.get("/{template_id}", response_model=GuardrailTemplate)
async def get_guardrail(template_id: str):
    """Get a single guardrail template by ID"""
    svc = get_service()
    template = svc.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Guardrail template not found")
    return template


@router.put("/{template_id}", response_model=GuardrailTemplate)
async def update_guardrail(template_id: str, req: GuardrailTemplateUpdate):
    """Update a guardrail template configuration"""
    svc = get_service()
    template = svc.update_template(template_id, req)
    if not template:
        raise HTTPException(status_code=404, detail="Guardrail template not found")
    return template


@router.delete("/{template_id}", response_model=GuardrailTemplate)
async def delete_guardrail(template_id: str):
    """Delete a guardrail template and its Bedrock resource"""
    svc = get_service()
    template = svc.delete_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Guardrail template not found")
    return template


@router.post("/{template_id}/publish", response_model=GuardrailTemplate)
async def publish_guardrail(template_id: str):
    """Publish a new version of the guardrail in Bedrock"""
    svc = get_service()
    template = svc.publish_version(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Guardrail template not found or has no Bedrock resource")
    return template


# --- Observability ---

@router.get("/{template_id}/metrics", response_model=GuardrailMetrics)
async def get_guardrail_metrics(template_id: str, hours: int = Query(default=24, ge=1, le=168)):
    """Get observability metrics for a guardrail"""
    svc = get_service()
    template = svc.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Guardrail template not found")
    if not template.guardrail_id:
        raise HTTPException(status_code=400, detail="Guardrail has no Bedrock resource (still in draft)")

    return svc.get_metrics(template.guardrail_id, hours=hours)
