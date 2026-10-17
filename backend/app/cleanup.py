import asyncio
import logging
import os
from .database import SessionLocal  
from .repositories import NotificationRepository
from .services.notification_service import NotificationService
from .unit_of_work import UnitOfWork

logger = logging.getLogger("siz.cleanup")

RETENTION_DAYS = int(os.getenv("NOTIFICATION_RETENTION_DAYS", "30"))
INTERVAL_HOURS = float(os.getenv("CLEANUP_INTERVAL_HOURS", "24"))


def purge_old_notifications() -> int:
    if RETENTION_DAYS <= 0:
        return 0
    db = SessionLocal()
    try:
        service = NotificationService(UnitOfWork(db), NotificationRepository(db))
        return service.purge_cleared(RETENTION_DAYS)
    finally:
        db.close()


async def cleanup_loop() -> None:
    if RETENTION_DAYS <= 0:
        logger.info("Автоочистка уведомлений отключена (NOTIFICATION_RETENTION_DAYS=0)")
        return
    while True:
        try:
            deleted = await asyncio.to_thread(purge_old_notifications)
            if deleted:
                logger.info("Автоочистка: удалено старых уведомлений — %s", deleted)
        except Exception:
            logger.exception("Автоочистка уведомлений не удалась")
        await asyncio.sleep(INTERVAL_HOURS * 3600)
