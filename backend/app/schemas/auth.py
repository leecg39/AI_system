# @TASK P0-T0.3 - Authentication schemas
# @SPEC docs/planning/02-trd.md#authentication
"""Authentication schemas."""
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
