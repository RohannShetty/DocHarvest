'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import type { DocHarvestGithubData } from '../lib/github';
import { formatBytes, isoDate } from '../lib/indexData';

/**
 * Line 07 — releases.
 *
 * One data path only: the build-time fetch in `lib/github.ts`. The card prints
 * when that fetch ran, and an asset row renders (with a size) only when the API
 * returned that asset — a fallback release carries no size to show.
 */

interface ReleasesProps {
  data: DocHarvestGithubData;
}

const VERIFY_COMMAND = 'Get-FileHash -Algorithm SHA256 docharvest-windows-latest.exe';

/** Split a release body into titled bullet groups, joining wrapped lines. */
function releaseSections(body: string): { title: string | null; items: string[] }[] {
  if (!body) return [];
  const sections: { title: string | null; items: string[] }[] = [];
  let current: { title: string | null; items: string[] } = { title: null, items: [] };
  let openItem = false;

  const clean = (value: string) => value.replace(/[*_`]/g, '').trim();

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('|') || line.startsWith('```') || /^-{3,}$/.test(line)) {
      openItem = false;
      continue;
    }

    if (line.startsWith('#')) {
      if (current.items.length > 0 || current.title) sections.push(current);
      current = { title: clean(line.replace(/^#+\s*/, '')), items: [] };
      openItem = false;
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      const item = clean(bullet[1]);
      openItem = item.length >= 3 && !item.startsWith('Full Changelog');
      if (openItem) current.items.push(item);
      continue;
    }

    // A continuation line belongs to the bullet above it.
    if (openItem && current.items.length > 0) {
      current.items[current.items.length - 1] = `${current.items[current.items.length - 1]} ${clean(line)}`.trim();
    }
  }

  if (current.items.length > 0 || current.title) sections.push(current);
  return sections;
}

export function Releases({ data }: ReleasesProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const release = data.latestRelease;
  const sections = releaseSections(release.body);

  const copy = (value: string, marker: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(marker);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section
      id="releases"
      data-sheet-line="07"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">07 — RELEASES</p>
        <h2 className="sheet-head mt-4 text-ink">Releases, as fetched at build time.</h2>

        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <div className="flex flex-wrap items-baseline gap-x-4 border-b border-rule-strong pb-3">
              <span className="sheet-num text-[13px] text-ink">{release.tag}</span>
              {release.name !== release.tag && (
                <span className="sheet-term text-[15px] text-ink">{release.name}</span>
              )}
              <span className="sheet-label ml-auto">
                {data.fetchedAt
                  ? `fetched ${isoDate(data.fetchedAt)}`
                  : 'static fallback — GitHub API unavailable at build'}
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <div key={section.title ?? 'release-notes'}>
                    {section.title && (
                      <p className="sheet-num text-[11px] tracking-[0.08em] text-ink-3">{section.title}</p>
                    )}
                    <ul className="mt-2">
                      {section.items.map((item) => (
                        <li key={item} className="sheet-body border-b border-rule py-2 text-[13px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="sheet-body text-[13px]">{release.body || 'No release notes in this build.'}</p>
              )}
            </div>

            <p className="mt-6">
              <a
                href={release.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="sheet-label inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
              >
                Open {release.tag} on GitHub
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </p>

            <div className="mt-8 border-t border-rule pt-4">
              <p className="sheet-label">assets returned by the API</p>
              {release.assets.length > 0 ? (
                <ul className="mt-2">
                  {release.assets.map((asset) => (
                    <li
                      key={asset.name}
                      className="flex flex-wrap items-baseline gap-x-4 border-b border-rule py-2"
                    >
                      <a
                        href={asset.browserDownloadUrl}
                        className="sheet-num cursor-pointer text-[13px] text-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-match"
                      >
                        {asset.name}
                      </a>
                      {asset.size !== null && (
                        <span className="sheet-num text-[12px] text-ink-2">{formatBytes(asset.size)}</span>
                      )}
                      {asset.downloadCount !== null && (
                        <span className="sheet-label">{asset.downloadCount} downloads</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sheet-body mt-2 text-[13px]">No assets returned in this build.</p>
              )}

              <div className="mt-4 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                <code className="sheet-num min-w-0 text-[12px] text-ink-2 [overflow-wrap:anywhere]">{VERIFY_COMMAND}</code>
                <button
                  onClick={() => copy(VERIFY_COMMAND, 'verify')}
                  aria-label="Copy verification command"
                  className="inline-flex cursor-pointer items-center gap-1.5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
                >
                  {copied === 'verify' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="sheet-label">{copied === 'verify' ? 'copied' : 'copy verification command'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
              <p className="sheet-label">recent commits (master)</p>
              <span className="sheet-label">{data.stats.stars} ★</span>
            </div>

            <ul className="mt-2 max-h-[480px] overflow-y-auto">
              {data.recentCommits.map((commit) => (
                <li key={commit.sha} className="flex gap-4 border-b border-rule py-2.5">
                  <button
                    onClick={() => copy(commit.sha, commit.sha)}
                    aria-label="Copy commit hash"
                    className="sheet-num shrink-0 cursor-pointer pt-0.5 text-[12px] text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
                  >
                    [{commit.sha}]
                  </button>
                  <div className="min-w-0 flex-1">
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="sheet-body block truncate text-[13px] text-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-match"
                      title={commit.message}
                    >
                      {commit.message}
                    </a>
                    <p className="sheet-label mt-1">
                      {commit.author} · {commit.date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-baseline justify-between">
              <span className="sheet-label">branch: master</span>
              <a
                href="https://github.com/RohannShetty/gitbook-downloader/commits/master"
                target="_blank"
                rel="noreferrer"
                className="sheet-label inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
              >
                View Full Log
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Releases;
