"""Pydantic schemas for authentication endpoints."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    local, separator, domain = email.partition("@")

    if (
        not separator
        or not local
        or not domain
        or " " in email
        or "." not in domain
        or domain.startswith(".")
        or domain.endswith(".")
    ):
        raise ValueError("Enter a valid email")

    return email


def _normalize_name(value: str) -> str:
    name = " ".join(value.split())
    if len(name) < 2:
        raise ValueError("Enter your full name")
    return name


def _validate_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Use at least 8 characters")
    if len(value) > 128:
        raise ValueError("Password is too long")
    if not any(character.isalpha() for character in value):
        raise ValueError("Password must include a letter")
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must include a number")
    return value


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _normalize_name(value)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class SigninRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _normalize_email(value)


class FirebaseAuthRequest(BaseModel):
    id_token: str = Field(min_length=1)


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str


class SignupResponse(BaseModel):
    success: bool = True
    message: str
    data: PublicUser


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class SigninData(BaseModel):
    user: PublicUser
    token: str
    refresh_token: str | None = None


class SigninResponse(BaseModel):
    success: bool = True
    message: str
    data: SigninData


class AuthErrorResponse(BaseModel):
    success: bool = False
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _normalize_email(value)


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class ResetPasswordResponse(BaseModel):
    success: bool = True
    message: str
