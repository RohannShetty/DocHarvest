"""
Headless browser rendering module for client-rendered documentation sites (SPAs).

Optional dependency: playwright (``pip install docharvest[render]``).
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger("docharvest.render")


def is_render_available() -> bool:
    """Return True if Playwright is installed and importable."""
    try:
        import playwright.sync_api  # noqa: F401
        return True
    except ImportError:
        return False


class HeadlessRenderer:
    """Headless browser renderer using Playwright for client-rendered documentation."""

    def __init__(self, headless: bool = True, browser_type: str = "chromium") -> None:
        self.headless = headless
        self.browser_type = browser_type
        self._p = None
        self._browser = None

    def open(self) -> "HeadlessRenderer":
        """Start Playwright and launch the browser once; returns self."""
        if getattr(self, "_p", None) is not None:
            return self
        from playwright.sync_api import sync_playwright

        self._p = sync_playwright().start()
        launcher = getattr(self._p, self.browser_type, self._p.chromium)
        self._browser = launcher.launch(headless=self.headless)
        return self

    def close(self) -> None:
        b, p = getattr(self, "_browser", None), getattr(self, "_p", None)
        try:
            if b is not None:
                b.close()
        finally:
            try:
                if p is not None:
                    p.stop()
            finally:
                self._browser, self._p = None, None

    def __enter__(self) -> "HeadlessRenderer":
        return self.open()

    def __exit__(self, *exc) -> bool:
        self.close()
        return False

    def render_url(
        self,
        url: str,
        timeout_ms: int = 25000,
        wait_selector: Optional[str] = None,
    ) -> str:
        """Render a URL using headless Chromium and return fully populated DOM HTML.

        Args:
            url: Page URL to fetch and render.
            timeout_ms: Maximum wait time in milliseconds.
            wait_selector: Optional CSS selector to wait for (e.g. "main, article").

        Returns:
            Rendered HTML string from the page.
        """
        if not is_render_available():
            raise RuntimeError(
                "Headless rendering requires Playwright. Install it with: "
                'pip install "docharvest[render]" && playwright install chromium'
            )

        if getattr(self, "_browser", None) is None:
            self.open()
        browser = self._browser

        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        try:
            page = context.new_page()
            page.set_default_timeout(timeout_ms)

            # Navigate with domcontentloaded
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)

            # Wait for network idle state (essential for client-rendered React/Vite SPAs)
            try:
                page.wait_for_load_state("networkidle", timeout=min(timeout_ms, 8000))
            except Exception:
                pass

            # Wait for main content selector or populated text
            if wait_selector:
                try:
                    page.wait_for_selector(wait_selector, timeout=min(timeout_ms, 6000))
                except Exception:
                    pass
            else:
                try:
                    page.wait_for_function(
                        "() => (document.querySelector('main, article, div.content, div.md-content, [role=\"main\"], div#root')?.innerText?.trim().length || 0) > 60",
                        timeout=min(timeout_ms, 6000),
                    )
                except Exception:
                    pass

            return page.content()
        finally:
            context.close()
