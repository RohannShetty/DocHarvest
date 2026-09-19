import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VERSION } from "../lib/version";
import { FAQ_ITEMS } from "../data/showcaseData";
import "./globals.css";

// Archivo carries the prose at its normal width and is narrowed (font-stretch)
// for the matched term; Geist Mono carries every number, path and command.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://rohannshetty.github.io";
const SITE_PATH = "/gitbook-downloader/";

/**
 * The direction contract, emitted as a real HTML comment at the top of <body>.
 */
const DIRECTION_CONTRACT = `<!--
THESIS — The page is a working index, not a brochure: every claim is a line of real
captured Markdown with its source file and line number, and amber marks only the matched
term. It refuses the category default (dark hero + mock terminal + feature-card grid) and
the incumbent indigo glass and gradient headline. seed 0acefbe5
OWN-WORLD — Near-black bond #09090B, 1px #1F1F23 hairlines, zero radii, zinc text ramp
#F4F4F5 / #A1A1AA / #71717A, one accent #F59E0B reserved for the matched term and the
active line; Archivo for prose, Geist Mono for every number, path and command; depth from
section cuts & ambient light, never generic drop shadows.
FIRST VIEWPORT — Masthead: "Turn Any Documentation Site into Clean Markdown for AI Coding Agents."
beside the live index specimen, with the real command above the fold.
-->`;

// Rich-result structured data: SoftwareApplication + FAQPage + TechArticle + WebSite
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "DocHarvest",
      alternateName: ["gitbook-downloader", "DocHarvest CLI", "DocHarvest FastMCP"],
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      softwareVersion: VERSION,
      url: `${SITE_URL}${SITE_PATH}`,
      downloadUrl: "https://github.com/RohannShetty/gitbook-downloader/releases",
      description:
        "Local-first documentation compiler: turns any doc site into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs. FastMCP v2 server for Cursor, Claude Code, Windsurf & 14+ AI coding agents. 100% local, MIT.",
      license: "https://opensource.org/licenses/MIT",
      author: {
        "@type": "Person",
        name: "Rohan Shetty",
        url: "https://github.com/RohannShetty",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "8 documentation platform auto-detectors with direct markdown endpoint probing",
        "Four-Part Output Contract: pages/, book.md, llms.txt, search index",
        "RAG JSONL export with SHA-256 frontmatter provenance",
        "Pure-Python PDF handbooks (fpdf2, zero C-dependencies)",
        "Embedded SQLite FTS5 BM25 search index",
        "FastMCP v2 server with 12 stdio tools for AI coding agents",
        "Universal 1-click Agent Skill for Cursor, Claude Code, Windsurf, Roo Code, Aider",
      ],
    },
    {
      "@type": "WebSite",
      name: "DocHarvest Documentation Compiler",
      url: `${SITE_URL}${SITE_PATH}`,
      description: "Compile web documentation into clean LLM context, RAG datasets, and FastMCP tools.",
    },
    {
      "@type": "TechArticle",
      headline: "How AI Coding Agents Ingest Web Documentation with FastMCP v2 and DocHarvest",
      author: {
        "@type": "Person",
        name: "Rohan Shetty",
      },
      description:
        "Technical specification and benchmarks on eliminating 83% HTML noise from web docs to optimize LLM context economy and prevent hallucinations.",
      url: `${SITE_URL}${SITE_PATH}#agents`,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
  description:
    "Stop burning context tokens on cookie banners. DocHarvest compiles any doc portal (GitBook, Mintlify, Docusaurus, VitePress, MkDocs, ReadMe, RTD) into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs — 100% local, MIT, FastMCP included.",
  alternates: { canonical: SITE_PATH },
  keywords: [
    // High-intent search queries
    "documentation scraper",
    "mintlify scraper",
    "gitbook downloader",
    "docusaurus scraper",
    "vitepress scraper",
    "mkdocs offline",
    "documentation compiler",
    "documentation harvester",
    "llm-ready markdown",
    "llm context token optimizer",
    "rag dataset generator",
    "llms.txt generator",
    "mcp server documentation",
    "fastmcp v2 tools",
    "offline documentation pdf",
    "ai coding agent documentation tools",
    "cursor mcp server docs",
    "claude code doc skills",
  ],
  authors: [{ name: "Rohan Shetty", url: "https://github.com/RohannShetty" }],
  openGraph: {
    title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
    description:
      "Stop burning context tokens on cookie banners. Turn any doc portal into clean LLM context, RAG datasets & offline PDFs — 100% local, free & open source.",
    url: SITE_PATH,
    siteName: "DocHarvest",
    type: "website",
    images: [
      {
        url: `${SITE_PATH}assets/og-sheet.png`,
        width: 1280,
        height: 640,
        alt: "DocHarvest — documentation compiler for LLMs, RAG & FastMCP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
    description:
      "Turn any doc site into clean LLM context, RAG JSONL & offline PDFs. 100% local, MIT, FastMCP included.",
    creator: "@rohan__shetty",
    images: [`${SITE_PATH}assets/og-sheet.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="text/plain" href={`${SITE_PATH}llms.txt`} title="LLM Context Manifest" />
        <script
          async
          src="https://startupbar.co/widget/loader.js"
          data-startup-id="6e9a63c4-5bc5-4b8b-b297-37a9450c7f1f"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('theme');
                if (saved === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bond text-ink transition-colors duration-300">
        <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
