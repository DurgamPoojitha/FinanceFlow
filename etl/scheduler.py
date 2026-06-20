"""
ETL Scheduler – APScheduler Configuration.

This module can be imported and run standalone to trigger the ETL pipeline
on a cron schedule. It is also integrated into main.py via the FastAPI
lifespan context manager (see backend/main.py).

Standalone usage:
    python etl/scheduler.py

This will run the ETL job immediately once, then continue on the schedule.
Press Ctrl+C to stop.
"""

import logging
import sys
import os
import time

# Resolve paths
_ETL_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_ETL_DIR)
_BACKEND_DIR = os.path.join(_ROOT, "backend")

for _path in (_ROOT, _BACKEND_DIR, _ETL_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def _run_etl_with_retry(max_retries: int = 3, backoff_seconds: float = 60.0):
    """
    Execute the ETL pipeline with exponential backoff retry logic.

    Args:
        max_retries: Maximum number of attempts before giving up.
        backoff_seconds: Initial wait time between retries (doubles each attempt).
    """
    from pipeline import run_pipeline

    for attempt in range(1, max_retries + 1):
        try:
            logger.info("ETL attempt %d/%d starting...", attempt, max_retries)
            run_pipeline()
            logger.info("ETL attempt %d/%d succeeded.", attempt, max_retries)
            return
        except Exception as exc:
            if attempt == max_retries:
                logger.error(
                    "ETL failed after %d attempts. Last error: %s",
                    max_retries, exc, exc_info=True,
                )
                return
            wait = backoff_seconds * (2 ** (attempt - 1))
            logger.warning(
                "ETL attempt %d/%d failed: %s. Retrying in %.0f seconds...",
                attempt, max_retries, exc, wait,
            )
            time.sleep(wait)


if __name__ == "__main__":
    from config import get_settings
    from apscheduler.schedulers.blocking import BlockingScheduler

    settings = get_settings()
    scheduler = BlockingScheduler()

    # Run immediately on startup so we don't wait until 2:00 AM for the first run
    logger.info("Running ETL pipeline immediately on scheduler startup...")
    _run_etl_with_retry()

    # Then schedule it on the configured cron
    scheduler.add_job(
        _run_etl_with_retry,
        trigger="cron",
        hour=settings.etl_cron_hour,
        minute=settings.etl_cron_minute,
        id="daily_etl",
        name="Daily ETL Pipeline",
    )

    logger.info(
        "Scheduler started. ETL will run daily at %02d:%02d UTC. Press Ctrl+C to stop.",
        settings.etl_cron_hour,
        settings.etl_cron_minute,
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
