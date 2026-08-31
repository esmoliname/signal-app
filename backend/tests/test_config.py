"""Unit tests for app.core.config parsing."""
from app.core.config import Settings


def test_parse_allowed_origins_comma_separated_string():
    s = Settings(ALLOWED_ORIGINS="http://a.com, http://b.com ,http://c.com")
    assert s.ALLOWED_ORIGINS == ["http://a.com", "http://b.com", "http://c.com"]


def test_parse_allowed_origins_empty_string():
    s = Settings(ALLOWED_ORIGINS="")
    assert s.ALLOWED_ORIGINS == []


def test_parse_allowed_origins_list_passthrough():
    s = Settings(ALLOWED_ORIGINS=["http://a.com", "http://b.com"])
    assert s.ALLOWED_ORIGINS == ["http://a.com", "http://b.com"]


def test_default_origins_are_localhost():
    # Fresh settings without env overrides should keep the localhost defaults.
    s = Settings(_env_file=None)
    assert "http://localhost:5173" in s.ALLOWED_ORIGINS
