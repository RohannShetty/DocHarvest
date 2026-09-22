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
    ctaUrl: 'https://github.com/RohannShetty/DocHarvest',
    ctaLabel: 'View GitHub Repo',
  },
  {
    id: 'docker',
    title: 'Docker',
    Icon: DockerIcon,
    command:
      '# Run headless capture:\ndocker run --rm -v $(pwd)/data:/app/data rohanshetty/docharvest crawl https://docs.openalgo.in',
    ctaUrl: 'https://github.com/RohannShetty/DocHarvest',
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

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = INSTALL_OPTIONS.findIndex((option) => option.id === activeTab.id);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % INSTALL_OPTIONS.length;
      setActiveTab(INSTALL_OPTIONS[nextIndex]);
      document.getElementById(`install-tab-${INSTALL_OPTIONS[nextIndex].id}`)?.focus();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + INSTALL_OPTIONS.length) % INSTALL_OPTIONS.length;
      setActiveTab(INSTALL_OPTIONS[prevIndex]);
      document.getElementById(`install-tab-${INSTALL_OPTIONS[prevIndex].id}`)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveTab(INSTALL_OPTIONS[0]);
      document.getElementById(`install-tab-${INSTALL_OPTIONS[0].id}`)?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveTab(INSTALL_OPTIONS[INSTALL_OPTIONS.length - 1]);
      document.getElementById(`install-tab-${INSTALL_OPTIONS[INSTALL_OPTIONS.length - 1].id}`)?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Install DocHarvest v${VERSION}`}
        className="relative w-full max-w-2xl border border-rule-strong bg-bond p-6 sm:p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
          <div className="flex items-baseline gap-3">
            <Download aria-hidden="true" className="h-4 w-4 shrink-0 text-match" />
            <div>
              <h2 className="sheet-term text-[16px] font-semibold text-ink">Install DocHarvest v{VERSION}</h2>
              <p className="sheet-label mt-1 text-ink-3">standalone · pip · uvx · docker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match p-1"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Install method"
          onKeyDown={handleTabKeyDown}
          className="mt-5 flex flex-wrap border-b border-rule-strong"
        >
          {INSTALL_OPTIONS.map((option) => {
            const isActive = option.id === activeTab.id;
            return (
              <button
                key={option.id}
                role="tab"
                id={`install-tab-${option.id}`}
                aria-selected={isActive}
                aria-controls={`install-panel-${option.id}`}
                onClick={() => setActiveTab(option)}
                className={`sheet-num inline-flex cursor-pointer items-center gap-2 border-r border-rule px-4 py-2.5 text-[11px] tracking-[0.14em] transition-all focus-visible:outline-2 focus-visible:outline-match ${
                  isActive ? 'text-match bg-bond-2 border-t-2 border-t-match font-semibold' : 'text-ink-3 hover:text-ink hover:bg-bond-2/40'
                }`}
              >
                <option.Icon className="h-3.5 w-3.5" />
                {option.title}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`install-panel-${activeTab.id}`}
          aria-labelledby={`install-tab-${activeTab.id}`}
          tabIndex={0}
          className="mt-4 focus-visible:outline-2 focus-visible:outline-match"
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="sheet-label text-ink-3">terminal</span>
            <button
              onClick={copyCommand}
              aria-label="Copy install command"
              className="inline-flex cursor-pointer items-center gap-1.5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {copied ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                  <span className="sheet-label text-match">copied</span>
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sheet-label">copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto text-[12px] leading-relaxed border border-rule bg-bond-2 p-3.5 font-mono shadow-sm">
            {activeTab.command}
          </pre>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-rule pt-4">
          <a
            href={activeTab.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="sheet-num cursor-pointer bg-match px-4 py-2 text-[12px] font-semibold text-bond transition-all hover:bg-match-deep active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-match"
          >
            {activeTab.ctaLabel}
          </a>
          <button
            onClick={onClose}
            className="sheet-label cursor-pointer text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallModal;
