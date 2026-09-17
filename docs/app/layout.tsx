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
 *
 * React has no comment node, so the comment travels inside a hidden, aria-hidden
 * div that is the first child of <body> — it survives `output: 'export'` and is
 * greppable in out/index.html (`grep -r 0acefbe5 docs/out/index.html`).
 */
const DIRECTION_CONTRACT = `<!--
THESIS — The page is a working index, not a brochure: every claim is a line of real
captured Markdown with its source file and line number, and amber marks only the matched
term. It refuses the category default (dark hero + mock terminal + feature-card grid) and
the incumbent indigo glass and gradient headline. seed 0acefbe5
OWN-WORLD — Near-black bond #09090B, 1px #1F1F23 hairlines, zero radii, zinc text ramp
#F4F4F5 / #A1A1AA / #71717A, one accent #F59E0B reserved for the matched term and the
active line; Archivo (wdth 62–125) for prose, Geist Mono for every number, path and
command; depth from section cuts, never shadow.
FIRST VIEWPORT — Masthead: "Every mention, its source, and the line it sits on." beside
the live index specimen, with the real command above the fold.
SIGNATURE INTERACTION — Typing filters the index; up/down walk rows; the margin rail numbers
the sheet and marks the current line.
CROSS-SURFACE — The same sheet rules the provider table, the output tree, the tool table,
the FAQ and the release ledger.
-->`;

// Rich-result structured data: SoftwareApplication + FAQPage (mirrors the visible FAQ).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "DocHarvest",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, Linux, macOS",
      softwareVersion: VERSION,
      url: `${SITE_URL}${SITE_PATH}`,
      description:
        "Local-first documentation compiler: turns any doc site into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs. FastMCP server for Cursor, Claude Code & 14 clients. 100% local, MIT.",
      license: "https://opensource.org/licenses/MIT",
      author: {
        "@type": "Person",
        name: "Rohan Shetty",
        url: "https://github.com/RohannShetty",
      },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "8 documentation platform auto-detectors with direct .md endpoint probing",
        "Four-Part Output Contract: pages/, book.md, llms.txt, search index",
        "RAG JSONL export with SHA-256 frontmatter provenance",
        "Pure-Python PDF handbooks (fpdf2, zero C-dependencies)",
        "Embedded SQLite FTS5 BM25 search",
        "FastMCP v2 server with 12 tools for AI coding agents",
      ],
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
    "Stop burning context tokens on cookie banners. DocHarvest compiles any doc portal into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs — 100% local, MIT, FastMCP included.",
  alternates: { canonical: SITE_PATH },
  keywords: [
    // Discovery layer — high-intent queries users actually type (metadata only,
    // never used in on-page self-description; see docs/SEO_GUIDE.md §2)
    "documentation scraper",
    "mintlify scraper",
    "gitbook downloader",
    // Positioning layer — what the product is
    "documentation compiler",
    "documentation harvester",
    "llm-ready markdown",
    "llm context",
    "rag dataset generator",
    "llms.txt",
    "mcp server",
    "fastmcp",
    "docusaurus offline",
    "offline documentation",
    "pdf generator",
    "ai coding agent docs",
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
        alt: "DocHarvest — the index sheet: every mention with its source and line",
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
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
