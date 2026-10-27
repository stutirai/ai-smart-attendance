import time
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.attendance_service import attendance_service
from app.core.config import settings

logger = logging.getLogger("attendance.services.scheduler")

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler(daemon=True)
        self.is_running = False

    def start(self):
        if not self.is_running:
            # High-resolution monitor job running every 500ms
            self.scheduler.add_job(
                self._check_temporal_cycle, 
                "interval", 
                seconds=0.5, 
                id="temporal_verification_job",
                replace_existing=True
            )
            self.scheduler.start()
            self.is_running = True
            logger.info("APScheduler initialized for Periodic Temporal Verification.")

    def _check_temporal_cycle(self):
        """
        Drives the 5-interval temporal cycle:
        1. If session is ACTIVE and burst is NOT active:
           Checks if time to trigger next verification interval.
        2. If burst IS active:
           Checks if burst duration elapsed -> triggers aggregation.
        """
        if not attendance_service.active_session_id:
            return

        now = time.time()

        # Handle active burst expiration
        if attendance_service.is_burst_active:
            elapsed = now - attendance_service.burst_start_time
            if elapsed >= attendance_service.burst_duration:
                logger.info(f"Burst window elapsed ({elapsed:.1f}s). Completing interval {attendance_service.current_interval_index}...")
                attendance_service.complete_interval_burst()
            return

        # Handle starting next interval
        if attendance_service.current_interval_index < settings.TOTAL_INTERVALS:
            if attendance_service.next_interval_time > 0 and now >= attendance_service.next_interval_time:
                next_idx = attendance_service.current_interval_index + 1
                logger.info(f"Triggering Periodic Verification Interval {next_idx}/{settings.TOTAL_INTERVALS}")
                attendance_service.start_interval_burst(next_idx)

    def stop(self):
        if self.is_running:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("APScheduler stopped.")

scheduler_service = SchedulerService()
