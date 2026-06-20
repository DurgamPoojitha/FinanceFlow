"""
ETL Runner – Bridge between the scheduler and the pipeline.

This module is imported by main.py's APScheduler integration.
It separates the scheduling concern from the pipeline implementation.
"""

import logging
import sys
import os

logger = logging.getLogger(__name__)

# Add the etl directory to the path so we can import pipeline
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ETL_DIR = os.path.join(_ROOT, "etl")
if _ETL_DIR not in sys.path:
    sys.path.insert(0, _ETL_DIR)


def run_etl_job():
    """
    Execute the full ETL pipeline as a scheduled background job.
    Handles exceptions to prevent the scheduler from crashing.
    """
    logger.info("Scheduled ETL job triggered.")
    try:
        from pipeline import run_pipeline
        run_pipeline()
        logger.info("Scheduled ETL job completed successfully.")
    except Exception as exc:
        logger.error("Scheduled ETL job failed: %s", exc, exc_info=True)
