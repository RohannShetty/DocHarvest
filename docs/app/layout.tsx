import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VERSION } from "../lib/version";
import { CANONICAL_URL, LLMS_URL, OG_IMAGE, SITE_ORIGIN } from "../lib/site";
import { FAQ_ITEMS } from "../data/showcaseData";
import { PRODUCT_FACTS, STATS } from "../lib/stats";
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

/**
 * The direction contract, emitted as a real HTML comment at the top of <body>.
 */
const DIRECTION_CONTRACT = `<!--
THESIS — The page is a working index, not a brochure: every claim is a line of real
captured Markdown with its source file and line number, and amber marks only the matched
term. It refuses the category default (dark hero + mock terminal + feature-card grid) and
the incumbent indigo glass and gradient headline. seed 0acefbe5
OWN-WORLD — Near-black bond #09090B, 1px #27272A hairlines, zero radii, zinc text ramp
#F4F4F5 / #A1A1AA / #8A8A93, one accent #F59E0B reserved for the matched term and the
active line; Archivo for prose, Geist Mono for every number, path and command; depth from
section cuts & ambient light, never generic drop shadows. Every value is generated from
brand/tokens.json into docs/app/brand-tokens.css — see docs/brand/BRAND.md.
FIRST VIEWPORT — Hero: "Turn any docs site into context your agent can use."
beside the live index specimen, with the real command above the fold.
-->`;

// Rich-result structured data: SoftwareApplication + FAQPage + TechArticle + WebSite
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "DocHarvest",
      alternateName: ["docharvest", "DocHarvest CLI", "DocHarvest FastMCP"],
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      softwareVersion: VERSION,
      url: SITE_ORIGIN,
      downloadUrl: "https://github.com/RohannShetty/DocHarvest/releases",
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
        `${PRODUCT_FACTS.dedicatedProviders} dedicated documentation platform detectors plus a generic fallback`,
        "Four-Part Output Contract: pages/, book.md, llms.txt, and a search index",
        "RAG JSONL export with SHA-256 frontmatter provenance",
        "Pure-Python PDF handbooks (fpdf2, zero C-dependencies)",
        "Embedded SQLite FTS5 BM25 search index",
        `FastMCP v2 server with ${STATS.mcpTools} stdio tools for AI coding agents`,
        `${STATS.agentsShipped} documented Agent Skill harness paths with one installer`,
      ],
    },
    {
      "@type": "WebSite",
      name: "DocHarvest Documentation Compiler",
      url: SITE_ORIGIN,
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
      url: `${SITE_ORIGIN}#agents`,
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

/**
 * Declared separately from `metadata` because Next.js 13.2+ split the
 * viewport-related tags out of the metadata object. Without this export the
 * page ships no `theme-color`, so the browser chrome stays default-white above
 * a near-black page on Android and iOS.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#FBFBFA" },
  ],
};

export const metadata: Metadata = {
  // Only used to resolve what little stays relative (the favicon route). Every
  // URL that matters below is absolute — see the note in lib/site.ts.
  metadataBase: new URL(SITE_ORIGIN),
  title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
  description:
    "Stop burning context tokens on cookie banners. DocHarvest compiles any doc portal (GitBook, Mintlify, Docusaurus, VitePress, MkDocs, ReadMe, RTD) into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs — 100% local, MIT, FastMCP included.",
  alternates: {
    canonical: CANONICAL_URL,
    // The product's own manifest, advertised to agents and crawlers through
    // <link rel="alternate" type="text/plain">. Declared here instead of a
    // hand-written <link> so it cannot drift from the canonical URL.
    types: { "text/plain": LLMS_URL },
  },
  keywords: [
    // Universal doc scraper & compiler keywords
    "universal documentation scraper",
    "documentation scraper",
    "documentation compiler",
    "documentation harvester",
    "website to markdown converter",
    "spa documentation scraper",
    "playwright docs crawler",
    "mintlify scraper",
    "gitbook downloader",
    "docusaurus scraper",
    "vitepress scraper",
    "mkdocs offline",
    "readme io docs scraper",
    "readthedocs offline",
    "llm-ready markdown",
    "llm context token optimizer",
    "rag dataset generator",
    "llms.txt generator",
    "offline documentation pdf",
    // FastMCP v2 & stdio tools
    "mcp server documentation",
    "fastmcp v2 tools",
    "model context protocol documentation",
    // All 17 supported agent harnesses
    "cursor mcp server docs",
    "claude code doc skills",
    "claude desktop mcp",
    "windsurf cascade mcp",
    "cline mcp server",
    "roo code mcp",
    "github copilot workspace docs",
    "antigravity agent skills",
    "gemini cli agent docs",
    "oh my pi omp sh mcp",
    "opencode ai assistant",
    "codex cli doc skills",
    "jetbrains ai assistant mcp",
    "zed editor context server",
    "continue dev mcp",
    "kilo code agent",
    "grok build skills",
    "trae ai mcp",
    "mistral vibe coding agent",
  ],
  authors: [{ name: "Rohan Shetty", url: "https://github.com/RohannShetty" }],
  openGraph: {
    locale: "en_US",
    title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
    description:
      "Stop burning context tokens on cookie banners. Turn any doc portal into clean LLM context, RAG datasets & offline PDFs — 100% local, free & open source.",
    url: CANONICAL_URL,
    siteName: "DocHarvest",
    type: "website",
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocHarvest — Documentation Compiler for LLMs, RAG & MCP",
    description:
      "Turn any doc site into clean LLM context, RAG JSONL & offline PDFs. 100% local, MIT, FastMCP included.",
    creator: "@rohan__shetty",
    // Same card as Open Graph. These used to point at different files with
    // different aspect ratios, so a link previewed differently on X than on
    // Slack or LinkedIn.
    images: [OG_IMAGE.url],
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
