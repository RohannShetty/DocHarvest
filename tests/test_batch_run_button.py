"""Batch Run button regression.

The Batch tab in CaptureStudio used to have an Add button but no Run button,
so the URL queue was entirely decorative. This test fails if the Run Batch
button is missing or if the per-URL sequential execution wiring is removed.
"""

from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
CAPTURE_STUDIO = REPO_ROOT / "frontend" / "src" / "views" / "CaptureStudio" / "index.tsx"
BATCH_QUEUE = REPO_ROOT / "frontend" / "src" / "views" / "CaptureStudio" / "hooks" / "useBatchQueue.ts"


def test_capture_studio_has_run_batch_button() -> None:
    text = CAPTURE_STUDIO.read_text(encoding="utf-8")
    assert "Run Batch" in text, (
        f"{CAPTURE_STUDIO.name} must include a 'Run Batch' button in the "
        f"Batch tab. Without it, the URL queue is decorative."
    )
    # The button should be wired to a handler.
    assert "handleRunBatch" in text, (
        f"{CAPTURE_STUDIO.name} must define a handleRunBatch handler"
    )


def test_capture_studio_has_cancel_batch_button() -> None:
    text = CAPTURE_STUDIO.read_text(encoding="utf-8")
    assert "Cancel Batch" in text, (
        f"{CAPTURE_STUDIO.name} must include a 'Cancel Batch' button so the "
        f"user can abort a running batch."
    )


def test_capture_studio_batch_handler_iterates_urls() -> None:
    """The handler must iterate batchUrls and call startCapture for each."""
    text = CAPTURE_STUDIO.read_text(encoding="utf-8")
    assert "handleRunBatch" in text
    hook_text = BATCH_QUEUE.read_text(encoding="utf-8")
    assert "batchUrls" in hook_text, (
        "useBatchQueue must iterate the batchUrls array"
    )
    assert "pyApi.startCapture" in hook_text, (
        "useBatchQueue must call pyApi.startCapture for each URL"
    )
