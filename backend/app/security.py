import hmac
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-.env-to-something-random")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 часов

BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))  
_BCRYPT_RE = re.compile(r"^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$")
_dummy_hash: Optional[str] = None


def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def is_hashed(stored: Optional[str]) -> bool:
    return bool(_BCRYPT_RE.match(stored or ""))


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(_to_bytes(plain_password), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("ascii")


def verify_password(plain_password: str, stored_password: str) -> bool:
    if is_hashed(stored_password):
        try:
            return bcrypt.checkpw(_to_bytes(plain_password), stored_password.encode("ascii"))
        except ValueError:
            return False
    return hmac.compare_digest(plain_password.encode("utf-8"), (stored_password or "").encode("utf-8"))


def burn_time(plain_password: str) -> None:
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = hash_password("dummy-password")
    verify_password(plain_password, _dummy_hash)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_employee_id(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return int(sub) if sub is not None else None
    except (JWTError, ValueError):
        return None
