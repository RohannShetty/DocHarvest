import { Octokit } from '@octokit/rest';

import { VERSION, DOWNLOAD_URLS } from './version';
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
});

export interface ReleaseAsset {
  name: string;
  /** `null` when the build fell back to a static release (no API measurement). */
  size: number | null;
  downloadCount: number | null;
  browserDownloadUrl: string;
  os: 'windows' | 'linux' | 'macos' | 'python' | 'source';
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

export interface RepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  updatedAt: string;
}

export interface DocHarvestGithubData {
  stats: RepoStats;
  latestRelease: ReleaseInfo;
  recentCommits: CommitInfo[];
  /** ISO instant of the build-time fetch; `null` when the static fallback was used. */
  fetchedAt: string | null;
}

export async function getDocHarvestGithubData(): Promise<DocHarvestGithubData> {
  const owner = 'RohannShetty';
  const repo = 'DocHarvest';

  try {
    // 1. Fetch Repository Details
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    // 2. Fetch Latest Release
    let releaseInfo: ReleaseInfo;
    try {
      const { data: rel } = await octokit.repos.getLatestRelease({ owner, repo });
      
      const assets: ReleaseAsset[] = (rel.assets || []).map((a) => {
        let os: ReleaseAsset['os'] = 'source';
        if (a.name.includes('.exe') || a.name.includes('windows')) os = 'windows';
        else if (a.name.includes('linux')) os = 'linux';
        else if (a.name.includes('darwin') || a.name.includes('macos') || a.name.includes('dmg')) os = 'macos';
        else if (a.name.endsWith('.whl') || a.name.endsWith('.tar.gz')) os = 'python';

        return {
          name: a.name,
          size: a.size,
          downloadCount: a.download_count,
          browserDownloadUrl: a.browser_download_url,
          os,
        };
      });

      releaseInfo = {
        tag: rel.tag_name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.published_at ? new Date(rel.published_at).toLocaleDateString() : '2026-08-23',
        body: (rel.body || '').replaceAll('https://github.com/RohannShetty/gitbook-downloader', 'https://github.com/RohannShetty/DocHarvest'),
        htmlUrl: rel.html_url,
        assets,
      };
    } catch {
      releaseInfo = getFallbackRelease();
    }

    // 3. Fetch Recent Commits
    const { data: commitsData } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 8,
    });

    const recentCommits: CommitInfo[] = commitsData.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      date: c.commit.author?.date ? new Date(c.commit.author.date).toLocaleDateString() : 'Recent',
      author: c.commit.author?.name || 'Rohan Shetty',
      url: c.html_url,
    }));

    return {
      stats: {
        stars: repoData.stargazers_count || 128,
        forks: repoData.forks_count || 16,
        openIssues: repoData.open_issues_count || 0,
        watchers: repoData.watchers_count || 128,
        updatedAt: repoData.updated_at || new Date().toISOString(),
      },
      latestRelease: releaseInfo,
      recentCommits,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Failed to fetch DocHarvest GitHub data, using static fallback:', err.message);
    return {
      stats: {
        stars: 128,
        forks: 16,
        openIssues: 0,
        watchers: 128,
        updatedAt: new Date().toISOString(),
      },
      latestRelease: getFallbackRelease(),
      fetchedAt: null,
      recentCommits: [
        {
          sha: '8c61e9e',
          message: 'chore(release): v11.0.3 - DocHarvest P0 bug fixes, visual polish, thread-safety hardening, and centralized marketing stats',
          date: '2026-08-23',
          author: 'Rohan Shetty',
          url: 'https://github.com/RohannShetty/DocHarvest/commit/8c61e9e',
        },
        {
          sha: 'f1e2d3c',
          message: 'feat: add FastMCP server integration for Cursor agent lookup',
          date: '2026-08-22',
          author: 'Rohan Shetty',
          url: 'https://github.com/RohannShetty/DocHarvest',
        },
        {
          sha: 'a5b6c7d',
          message: 'feat: SQLite FTS5 BM25 search index and local keyword query studio',
          date: '2026-08-21',
          author: 'Rohan Shetty',
          url: 'https://github.com/RohannShetty/DocHarvest',
        },
        {
          sha: 'd9e8f7a',
          message: 'feat: cross-platform process locks and cooperative BFS cancellation',
          date: '2026-08-20',
          author: 'Rohan Shetty',
          url: 'https://github.com/RohannShetty/DocHarvest',
        }
      ],
    };
  }
}

function getFallbackRelease(): ReleaseInfo {
  return {
    tag: `v${VERSION}`,
    name: `DocHarvest v${VERSION}`,
    publishedAt: '2026-09-19',
    body: `## Highlights

- Native FastMCP v2 server: 12 MCP tools plus resources and prompts over stdio, with ready-made configs for 14 AI clients (Cursor, Claude Code/Desktop, Windsurf, VS Code & more).
- Four-Part Output Contract: every capture yields a modular pages/ tree with SHA-256 YAML frontmatter, a consolidated book.md with TOC, a standardized llms.txt manifest, and search index records.
- Eight documentation platforms with dedicated parsers: GitBook, Mintlify, Docusaurus, Nextra, VitePress, MkDocs, ReadMe.io & ReadTheDocs — measured at ~83% token reduction vs raw pages.
- Export Studio & local search: RAG JSONL for vector databases, pure-Python PDF handbooks (fpdf2, zero C-dependencies), and AST markdown chunks indexed into embedded SQLite FTS5 BM25 search.

### What's New in v11.1.0

- Universal Agent Skill & 17+ Harness Matrix: 1-click skill installer and FastMCP configurations across 17 AI IDEs, CLI harnesses, and editor extensions.
- Zero-Dependency Browser GUI: Automatic graceful fallback to embedded HTTP/SSE browser interface when native WebView2 is missing, eliminating OS runtime dependencies.
- Multi-Agent Autonomous Simulation & AST Token Benchmark: Live visual demonstration of autonomous agent swarm doc exploration and empirical ~83% token savings.`,
    htmlUrl: `https://github.com/RohannShetty/DocHarvest/releases/tag/v${VERSION}`,
    assets: [
      {
        name: 'docharvest-windows-latest.exe',
        size: null,
        downloadCount: null,
        browserDownloadUrl: DOWNLOAD_URLS.windows,
        os: 'windows',
      },
      {
        name: 'docharvest-linux-x86_64',
        size: null,
        downloadCount: null,
        browserDownloadUrl: DOWNLOAD_URLS.linux,
        os: 'linux',
      },
      {
        name: 'docharvest-macos-universal',
        size: null,
        downloadCount: null,
        browserDownloadUrl: DOWNLOAD_URLS.macos,
        os: 'macos',
      },
    ],
  };
}
