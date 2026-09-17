'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Download, X, Check } from 'lucide-react';
import { WindowsIcon, LinuxIcon, PythonIcon, DockerIcon } from './Icons';
import { VERSION, DOWNLOAD_URLS } from '../lib/version';

/**
 * The install panel — one ruled sheet, four tabs, no sizes it cannot measure.
 */

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InstallOption = {
  id: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  command: string;
  ctaUrl: string;
  ctaLabel: string;
};

const INSTALL_OPTIONS: InstallOption[] = [
  {
    id: 'windows',
    title: 'Windows',
    Icon: WindowsIcon,
    command: `# Direct executable (zero Python install needed)\ncurl -LO ${DOWNLOAD_URLS.windows}\n.\\docharvest-windows-latest.exe --gui`,
    ctaUrl: DOWNLOAD_URLS.windows,
    ctaLabel: 'Download for Windows',
  },
  {
    id: 'pip',
    title: 'pip',
    Icon: PythonIcon,
    command:
      'pip install gitbook-downloader\n\n# Run GUI:\ndocharvest --gui\n\n# Or CLI capture:\ndocharvest capture https://docs.openalgo.in/v/v2.0 --rag --pdf',
    ctaUrl: 'https://pypi.org/project/gitbook-downloader/',
    ctaLabel: 'View on PyPI',
  },
  {
    id: 'uv',
    title: 'uv',
    Icon: LinuxIcon,
    command:
      '# Run instantly with uv without installing to global Python:\nuvx gitbook-downloader --gui\n\n# Or install permanently:\nuv tool install gitbook-downloader',
    ctaUrl: 'https://github.com/RohannShetty/gitbook-downloader',
    ctaLabel: 'View GitHub Repo',
  },
  {
    id: 'docker',
    title: 'Docker',
    Icon: DockerIcon,
    command:
      '# Run headless capture:\ndocker run --rm -v $(pwd)/data:/app/data rohanshetty/docharvest crawl https://docs.openalgo.in',
    ctaUrl: 'https://github.com/RohannShetty/gitbook-downloader',
    ctaLabel: 'View Dockerfile',
  },
];

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  const [activeTab, setActiveTab] = useState<InstallOption>(INSTALL_OPTIONS[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyCommand = () => {
    navigator.clipboard?.writeText(activeTab.command).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Install DocHarvest v${VERSION}`}
        className="relative w-full max-w-2xl border border-rule-strong bg-bond p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
          <div className="flex items-baseline gap-3">
            <Download className="h-4 w-4 shrink-0 text-ink-3" />
            <div>
              <h2 className="sheet-term text-[15px] text-ink">Install DocHarvest v{VERSION}</h2>
              <p className="sheet-label mt-1">standalone · pip · uvx · docker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div role="tablist" aria-label="Install method" className="mt-5 flex flex-wrap border-b border-rule-strong">
          {INSTALL_OPTIONS.map((option) => {
            const isActive = option.id === activeTab.id;
            return (
              <button
                key={option.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(option)}
                className={`sheet-num inline-flex cursor-pointer items-center gap-2 border-r border-rule px-4 py-2 text-[11px] tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                  isActive ? 'text-match' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <option.Icon className="h-3.5 w-3.5" />
                {option.title}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="sheet-label">terminal</span>
            <button
              onClick={copyCommand}
              aria-label="Copy install command"
              className="inline-flex cursor-pointer items-center gap-1.5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="sheet-label">{copied ? 'copied' : 'copy'}</span>
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto text-[12px] leading-relaxed">{activeTab.command}</pre>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <a
            href={activeTab.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="sheet-num cursor-pointer bg-match px-4 py-2 text-[12px] font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
          >
            {activeTab.ctaLabel}
          </a>
          <button
            onClick={onClose}
            className="sheet-label cursor-pointer transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallModal;
