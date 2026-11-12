import React from 'react';
import { VERSION } from '../lib/version';

const REPO = 'https://github.com/RohannShetty/DocHarvest';

const LINK_CLASS =
  'inline-flex min-h-11 items-center text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match focus-visible:outline-2 focus-visible:outline-match';

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  return (
    <a href={href} className={LINK_CLASS} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer id="install" className="border-t border-rule-strong bg-bond">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="sheet-label text-match">10 — Install</p>
            <h2 className="sheet-head mt-4 max-w-[16ch] text-ink">One command, one folder.</h2>
            <code className="mt-6 block max-w-[46ch] overflow-x-auto border border-rule bg-bond-2 px-4 py-3 font-mono text-sm text-ink">
              pip install docharvest
            </code>
            <code className="mt-2 block max-w-[46ch] overflow-x-auto border border-rule bg-bond-2 px-4 py-3 font-mono text-sm text-ink">
              docharvest capture &lt;url&gt;
            </code>
            <p className="sheet-body mt-4 max-w-[58ch]">
              Then read the result from <span className="font-mono text-ink">~/.docharvest/docs/&lt;domain&gt;/</span>,
              or point an agent at <span className="font-mono text-ink">docharvest mcp</span>.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-3 self-start text-sm sm:grid-cols-3">
            <FooterLink href="#how-it-works">How it works</FooterLink>
            <FooterLink href="#outputs">Outputs</FooterLink>
            <FooterLink href="#integrations">Integrations</FooterLink>
            <FooterLink href="#workflows">Workflows</FooterLink>
            <FooterLink href={`${REPO}#readme`}>Docs</FooterLink>
            <FooterLink href={`${REPO}/blob/master/CHANGELOG.md`}>Changelog</FooterLink>
            <FooterLink href={`${REPO}/blob/master/LICENSE`}>License</FooterLink>
            <FooterLink href={`${REPO}/issues/new`}>Report an issue</FooterLink>
            <FooterLink href="https://pypi.org/project/docharvest/">PyPI</FooterLink>
            <FooterLink href={`${REPO}/releases/latest`}>Releases</FooterLink>
            <FooterLink href="mailto:shettyrohan2@gmail.com">Email</FooterLink>
            <FooterLink href={`${REPO}/stargazers`}>Star on GitHub</FooterLink>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
          <span className="sheet-label text-ink-3">DocHarvest · docharvest · MIT</span>
          <span className="sheet-num text-xs text-ink-3">v{VERSION}</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
