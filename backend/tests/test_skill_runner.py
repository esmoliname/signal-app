"""Unit tests for skill_runner pure functions."""
import json

import pytest

from app.core.skill_runner import (
    _build_report,
    _map_skill_json,
    _synthesized_report,
)

# ─── _map_skill_json ─────────────────────────────────────────────────────── #

def test_map_skill_json_real_data_mapping():
    data = {
        "query": "AI agents",
        "window_days": 30,
        "source_status": {"reddit": {"count": 3}},
        "clusters": [
            {"title": "Agent frameworks", "summary": "Rising adoption",
             "engagement_total": 1234, "sources": ["reddit"]}
        ],
        "results": [
            {"candidate_id": "a1", "source": "reddit", "title": "Post A",
             "author": "u/user", "engagement": {"score": 42},
             "published_at": "2026-08-01", "summary": "Summary A", "url": "https://x/a"},
            # duplicate id → should be deduped
            {"candidate_id": "a1", "source": "reddit", "title": "Post A dup",
             "author": "u/user", "engagement": {"score": 42},
             "published_at": "2026-08-01", "summary": "Dup", "url": "https://x/a"},
            # hackernews chip normalization → 'hn'
            {"candidate_id": "b1", "source": "hackernews", "title": "HN post",
             "author": "anon", "engagement": 88,
             "published_at": "2026-08-02", "summary": "HN sum", "url": "https://hn/b"},
        ],
    }

    report = _map_skill_json(data, "AI agents", 30)

    assert report is not None
    # "AI agents" lives in the markdown title
    assert "AI agents" in report["key_insights"]
    # dedup: only 2 feeds remain
    assert len(report["feeds"]) == 2
    feed_ids = [f["id"] for f in report["feeds"]]
    assert feed_ids.count("a1") == 1
    # chip normalization: hackernews → hn
    by_id = {f["id"]: f for f in report["feeds"]}
    assert by_id["b1"]["source"] == "hn"
    # engagement score as int from dict
    assert by_id["a1"]["score"] == 42


def test_map_skill_json_empty_returns_none():
    assert _map_skill_json({"clusters": [], "results": []}, "x", 30) is None


def test_chip_normalization_mappings():
    # youtube stays youtube; tiktok stays tiktok; arxiv → github; x → reddit
    data = {
        "results": [
            {"candidate_id": "1", "source": "youtube", "title": "t",
             "engagement": 5, "url": "u1"},
            {"candidate_id": "2", "source": "tiktok", "title": "t",
             "engagement": 5, "url": "u2"},
            {"candidate_id": "3", "source": "arxiv", "title": "t",
             "engagement": 5, "url": "u3"},
            {"candidate_id": "4", "source": "x", "title": "t",
             "engagement": 5, "url": "u4"},
        ],
    }
    report = _map_skill_json(data, "t", 30)
    assert report is not None
    by_id = {f["id"]: f["source"] for f in report["feeds"]}
    assert by_id["1"] == "youtube"
    assert by_id["2"] == "tiktok"
    assert by_id["3"] == "github"
    assert by_id["4"] == "reddit"


# ─── _build_report ───────────────────────────────────────────────────────── #

def test_build_report_real_json_path():
    raw = (
        "status: ok\n"
        + json.dumps({
            "query": "kubernetes",
            "clusters": [{"title": "K8s", "summary": "s",
                          "engagement_total": 10, "sources": ["github"]}],
            "results": [
                {"candidate_id": "k1", "source": "github", "title": "Repo",
                 "engagement": 3, "url": "https://github.com/x/y"},
            ],
        })
    ).encode("utf-8")
    report = _build_report("kubernetes", ["github"], 30, raw)
    assert len(report["feeds"]) == 1
    assert report["feeds"][0]["source"] == "github"


def test_build_report_synthesized_fallback():
    # None raw bytes → synthesized report
    report = _build_report("webgpu", ["reddit", "youtube", "hn", "github", "tiktok"], 30, None)
    assert "webgpu" in report["key_insights"]
    # at least one feed per requested source
    sources = {f["source"] for f in report["feeds"]}
    assert "reddit" in sources
    assert "youtube" in sources
    assert "hn" in sources
    assert "github" in sources
    assert "tiktok" in sources
