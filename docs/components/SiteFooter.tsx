import React from 'react';
import { VERSION } from '../lib/version';

export function SiteFooter() {
  return (
    <footer id="install" className="bg-bond px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-rule-strong pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <p className="sheet-label text-match">Install</p>
          <h2 className="sheet-head mt-4 max-w-[14ch] text-ink">Start with a URL you already trust.</h2>
          <code className="mt-6 block max-w-2xl overflow-x-auto border border-rule bg-bond-2 px-4 py-4 text-sm text-ink">pip install gitbook-downloader && docharvest capture &lt;url&gt;</code>
          <p className="sheet-body mt-4 max-w-[60ch] text-ink-2">MIT licensed. Runs locally. The package name stays gitbook-downloader; the product is DocHarvest.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 self-end text-sm">
          <a href="#how-it-works" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">How it works</a>
          <a href="#outputs" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">Outputs</a>
          <a href="#integrations" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">Integrations</a>
          <a href="#workflows" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">Workflows</a>
          <a href="https://github.com/RohannShetty/DocHarvest" target="_blank" rel="noreferrer" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">GitHub</a>
          <a href="https://github.com/RohannShetty/DocHarvest#quick-start" target="_blank" rel="noreferrer" className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match">Docs</a>
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <span className="sheet-label text-ink-3">DocHarvest · gitbook-downloader · MIT</span>
        <span className="sheet-num text-xs text-ink-3">v{VERSION}</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
