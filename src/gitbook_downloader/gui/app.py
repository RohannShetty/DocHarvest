"""Desktop GUI launcher using PyWebView and Edge WebView2."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from .. import __version__
from .bridge import ApiBridge


def get_web_dir() -> Path:
    """Return the absolute path to the bundled web assets directory."""
    if hasattr(sys, "_MEIPASS"):
        # PyInstaller onefile extract folder
        base = Path(sys._MEIPASS)
        candidate = base / "gitbook_downloader" / "gui" / "web"
        if candidate.exists():
            return candidate
        return base / "web"
    return Path(__file__).resolve().parent / "web"


def launch_gui(
    title: str | None = None,
    debug: bool = False,
    browser: str | bool | None = None,
    port: int = 0,
) -> None:
    """Open the GUI in a native Desktop window or a web browser (e.g. Zen)."""
    if browser:
        from .server import launch_browser_gui
        target_browser = "zen" if browser is True else str(browser)
        launch_browser_gui(browser=target_browser, port=port)
        return

    if title is None:
        title = f"DocHarvest v{__version__}"
    try:
        import webview
    except ImportError as exc:
        raise ImportError(f"pywebview is required for native GUI mode: {exc}") from exc


    web_dir = get_web_dir()
    index_file = web_dir / "index.html"
    if not index_file.exists():
        print(
            f"Error: GUI web assets not found at {index_file}. "
            f"Please verify installation.",
            file=sys.stderr,
        )
        sys.exit(1)

    bridge = ApiBridge()

    window = webview.create_window(
        title=title,
        url=index_file.as_uri(),
        js_api=bridge,
        width=1160,
        height=780,
        min_size=(920, 600),
        background_color="#090d16",
        text_select=True,
    )
    bridge.set_window(window)
    try:
        window.events.closing += bridge.cleanup
    except Exception:
        pass

    # Use Edge Chromium (WebView2) on Windows for highest performance & modern web features
    gui_engine = "edgechromium" if sys.platform == "win32" else None
    webview.start(gui=gui_engine, debug=debug)
