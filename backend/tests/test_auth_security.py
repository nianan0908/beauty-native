import jwt

from app.common.errors import UnauthorizedError
from app.core.config import settings
from app.modules.auth.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    refresh_token_digest,
    verify_password,
)


def test_password_is_argon2_hashed_and_verifiable() -> None:
    encoded = hash_password("demo123")

    assert encoded.startswith("$argon2")
    assert encoded != "demo123"
    assert verify_password("demo123", encoded)
    assert not verify_password("wrong-password", encoded)


def test_access_token_round_trip() -> None:
    token, expires_in = create_access_token("U_TEST", 3)

    assert expires_in == settings.access_token_minutes * 60
    assert decode_access_token(token) == ("U_TEST", 3)


def test_access_token_rejects_invalid_signature() -> None:
    invalid_token = jwt.encode(
        {"sub": "U_TEST", "type": "access", "ver": 1},
        "a-different-secret-that-is-long-enough-for-hs256",
        algorithm="HS256",
    )

    try:
        decode_access_token(invalid_token)
    except UnauthorizedError:
        pass
    else:
        raise AssertionError("invalid access token was accepted")


def test_refresh_token_only_exposes_a_digest_for_persistence() -> None:
    raw, digest = generate_refresh_token()

    assert raw != digest
    assert len(digest) == 64
    assert refresh_token_digest(raw) == digest
