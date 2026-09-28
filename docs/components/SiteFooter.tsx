import React from 'react';
import { VERSION } from '../lib/version';

const REPO = 'https://github.com/RohannShetty/DocHarvest';

// A footer is the last chance to answer "what now?" — it previously held two
// section links and a GitHub link, which left the changelog, the package page,
// the licence and the issue tracker unreachable from the site.
const LINK_CLASS =
  'text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match';

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  return (
    <a
      href={href}
      className={LINK_CLASS}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer id="install" className="bg-bond px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-rule-strong pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <p className="sheet-label text-match">Install</p>
          <h2 className="sheet-head mt-4 max-w-[14ch] text-ink">Start with a URL you already trust.</h2>
          <code className="mt-6 block max-w-2xl overflow-x-auto border border-rule bg-bond-2 px-4 py-4 text-sm text-ink">pip install docharvest && docharvest capture &lt;url&gt;</code>
          <p className="sheet-body mt-4 max-w-[60ch] text-ink-2">MIT licensed. Runs locally. The package name stays docharvest; the product is DocHarvest.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 self-end text-sm sm:grid-cols-3">
          <FooterLink href="#how-it-works">How it works</FooterLink>
          <FooterLink href="#outputs">Outputs</FooterLink>
          <FooterLink href="#integrations">Integrations</FooterLink>
          <FooterLink href="#workflows">Workflows</FooterLink>
          <FooterLink href={`${REPO}#-quick-start`}>Docs</FooterLink>
          <FooterLink href={`${REPO}/blob/master/CHANGELOG.md`}>Changelog</FooterLink>
          <FooterLink href={`${REPO}/blob/master/LICENSE`}>License</FooterLink>
          <FooterLink href={`${REPO}/issues/new`}>Report an issue</FooterLink>
          <FooterLink href="https://pypi.org/project/docharvest/">PyPI</FooterLink>
          <FooterLink href={`${REPO}/releases/latest`}>Releases</FooterLink>
          <FooterLink href={`${REPO}/stargazers`}>Star on GitHub</FooterLink>
          <FooterLink href="mailto:shettyrohan2@gmail.com">Email</FooterLink>
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <span className="sheet-label text-ink-3">DocHarvest · docharvest · MIT</span>
        <span className="sheet-num text-xs text-ink-3">v{VERSION}</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
