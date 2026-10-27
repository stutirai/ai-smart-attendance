from fastapi import APIRouter
from app.core.config import settings
from app.schemas.schemas import SystemSettingsModel
from app.services.attendance_service import attendance_service
from app.vision.pipeline import vision_pipeline

router = APIRouter(prefix="/settings", tags=["System Configuration"])

@router.get("", response_model=SystemSettingsModel)
def get_system_settings():
    return SystemSettingsModel(
        recognition_threshold=settings.RECOGNITION_THRESHOLD,
        total_intervals=settings.TOTAL_INTERVALS,
        required_verified_intervals=settings.REQUIRED_VERIFIED_INTERVALS,
        is_demo_mode=settings.IS_DEMO_MODE,
        demo_burst_duration=settings.DEMO_BURST_DURATION,
        demo_interval_duration=settings.DEMO_INTERVAL_DURATION,
        real_burst_duration=settings.REAL_BURST_DURATION,
        real_interval_duration=settings.REAL_INTERVAL_DURATION,
        enable_liveness=settings.ENABLE_LIVENESS,
        camera_source=settings.CAMERA_SOURCE
    )

@router.put("", response_model=SystemSettingsModel)
def update_system_settings(cfg: SystemSettingsModel):
    settings.RECOGNITION_THRESHOLD = cfg.recognition_threshold
    settings.TOTAL_INTERVALS = cfg.total_intervals
    settings.REQUIRED_VERIFIED_INTERVALS = cfg.required_verified_intervals
    settings.IS_DEMO_MODE = cfg.is_demo_mode
    settings.DEMO_BURST_DURATION = cfg.demo_burst_duration
    settings.DEMO_INTERVAL_DURATION = cfg.demo_interval_duration
    settings.REAL_BURST_DURATION = cfg.real_burst_duration
    settings.REAL_INTERVAL_DURATION = cfg.real_interval_duration
    settings.ENABLE_LIVENESS = cfg.enable_liveness

    # If camera source changed, re-init camera
    if cfg.camera_source != settings.CAMERA_SOURCE:
        settings.CAMERA_SOURCE = cfg.camera_source
        vision_pipeline.camera.stop()
        vision_pipeline.camera.source = cfg.camera_source
        vision_pipeline.camera.start()

    # Update active attendance service durations
    if settings.IS_DEMO_MODE:
        attendance_service.burst_duration = float(settings.DEMO_BURST_DURATION)
        attendance_service.interval_duration = float(settings.DEMO_INTERVAL_DURATION)
    else:
        attendance_service.burst_duration = float(settings.REAL_BURST_DURATION)
        attendance_service.interval_duration = float(settings.REAL_INTERVAL_DURATION)

    return cfg
