from datetime import datetime

from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: int
    date: datetime
    name: str


class NotifyResult(BaseModel):
    notified: int
    skipped: int = 0  
