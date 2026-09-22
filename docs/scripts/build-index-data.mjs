#!/usr/bin/env node
/**
 * build-index-data.mjs — the generator behind the showcase's index sheet.
 *
 * It reads real DocHarvest capture directories (the ones written to disk by
 * `docharvest capture`) and emits two committed data files that every number,
 * path, line and excerpt on the showcase page is read from:
 *
 *   docs/data/index-data.json  — the index rows (verbatim emitted-Markdown lines)
 *   docs/data/manifest.json    — measured output tree, plates and byte counts
 *
 * Usage:
 *   node scripts/build-index-data.mjs \
 *     --from ../local-artifacts/pi.dev-docs \
 *     --from ../local-artifacts/omp.sh-docs \
 *     --terms provider,index,OAuth,config,search,MCP
 *
 * Rules the data obeys (and the page therefore cannot lie about):
 *   - every `context` is a verbatim line of emitted Markdown; `line` is its
 *     1-based line number in that file;
 *   - YAML frontmatter, fenced code blocks and Markdown table rows are never quoted;
 *   - whitespace runs collapse to a single space, then lines outside
 *     20–160 characters are dropped;
 *   - byte counts are measured on disk (`stat`), never estimated;
 *   - a plate whose file does not exist in the capture carries `excerpt: null`
 *     and no size, so the page prints that it is absent instead of a guess;
 *   - the raw-HTML comparison fetches the capture's own sourceUrl and is
 *     omitted (`null`) rather than invented when the fetch fails.
 *
 * No dependencies: plain Node ESM.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DOCS_ROOT = resolve(HERE, '..');

const DEFAULT_TERMS = ['provider', 'index', 'OAuth', 'config', 'search', 'MCP'];
const MAX_ROWS = 600;
const MIN_CONTEXT = 20;
const MAX_CONTEXT = 160;

function fail(message) {
  console.error(`build-index-data: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const dirs = [];
  let terms = DEFAULT_TERMS;
  let limit = MAX_ROWS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') {
      const value = argv[++i];
      if (!value) fail('--from needs a directory');
      dirs.push(value);
    } else if (arg.startsWith('--from=')) {
      dirs.push(arg.slice('--from='.length));
    } else if (arg === '--terms') {
      const value = argv[++i];
      if (!value) fail('--terms needs a comma-separated list');
      terms = value.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (arg.startsWith('--terms=')) {
      terms = arg.slice('--terms='.length).split(',').map((t) => t.trim()).filter(Boolean);
    } else if (arg === '--limit') {
      limit = Number(argv[++i]);
    } else if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
    } else if (arg === '--help' || arg === '-h') {
      console.log('usage: node scripts/build-index-data.mjs --from <capture-dir> [--from ...] [--terms a,b,c] [--limit N]');
      process.exit(0);
    } else {
      fail(`unknown argument "${arg}"`);
    }
  }

  if (dirs.length === 0) fail('at least one --from <capture-dir> is required');
  if (!Number.isFinite(limit) || limit <= 0) fail('--limit must be a positive number');
  return { dirs, terms, limit };
}

/** Every .md file under <capture>/pages, in stable lexical order. */
function pageFiles(pagesDir) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name.toLowerCase().endsWith('.md')) out.push(full);
    }
  };
  walk(pagesDir);
  return out;
}

function readLines(file) {
  return readFileSync(file, 'utf8').split(/\r?\n/);
}

/** Capture header facts come from the capture's own llms.txt, then frontmatter. */
function captureFacts(dir, pages) {
  const llmsPath = join(dir, 'llms.txt');
  const facts = { sourceUrl: null, provider: null, captured: null, declaredPages: null, title: null };

  if (existsSync(llmsPath)) {
    const head = readLines(llmsPath).slice(0, 8).join('\n');
    const title = head.match(/^#\s+(.+)$/m);
    if (title) facts.title = title[1].trim();
    const source = head.match(/^>\s*Markdown capture of\s+(\S+)/m);
    if (source) facts.sourceUrl = source[1].trim();
    const meta = head.match(/Provider:\s*([^\s·]+)\s*·\s*Captured:\s*([^\s·]+)\s*·\s*Pages:\s*(\d+)/);
    if (meta) {
      facts.provider = meta[1].trim();
      facts.captured = meta[2].trim();
      facts.declaredPages = Number(meta[3]);
    }
  }

  if (pages.length > 0) {
    const fm = frontmatterOf(pages[0]);
    if (!facts.sourceUrl && fm.source_url) facts.sourceUrl = fm.source_url;
    if (!facts.captured && fm.crawl_date) facts.captured = fm.crawl_date;
  }
  return facts;
}

/** Parse a leading YAML frontmatter block into a flat string map. */
function frontmatterOf(file) {
  const lines = readLines(file);
  const data = {};
  if (lines[0] !== '---') return { data, endLine: 0 };
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i] === '---') break;
    const match = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (match) data[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return { data, endLine: i };
}

function captureId(dir) {
  const base = dir.split(/[\\/]/).filter(Boolean).pop() || dir;
  return base.replace(/-docs$/i, '');
}

function domainOf(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return null;
  }
}

function collapse(line) {
  return line.replace(/\s+/g, ' ').trim();
}

/**
 * Walk one emitted Markdown file and collect lines matching any term.
 * Frontmatter and fenced code blocks are skipped entirely.
 */
function collectRows(file, relPath, sourceId, title, terms) {
  const lines = readLines(file);
  const { endLine } = frontmatterOf(file);
  const rows = [];
  let inFence = false;
  let fenceMarker = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const fence = raw.match(/^\s*(```+|~~~+)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence[1][0] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }
    if (inFence) continue;
    if (i <= endLine && lines[0] === '---') continue;

    const context = collapse(raw);
    if (context.length < MIN_CONTEXT || context.length > MAX_CONTEXT) continue;
    // A Markdown table row is structure, not a line you can read a mention out
    // of: quoting one out of its table proves nothing. Skip them.
    if (/^\|.*\|$/.test(context)) continue;

    const lower = context.toLowerCase();
    for (const term of terms) {
      if (lower.includes(term.toLowerCase())) {
        rows.push({
          term,
          source: sourceId,
          path: relPath.split(sep).join('/'),
          line: i + 1,
          title,
          context,
        });
      }
    }
  }
  return rows;
}

function excerpt(file, lineCount) {
  return readLines(file).slice(0, lineCount).join('\n');
}

/** Book excerpt is the first 24 lines; llms.txt the first 20. */
const PLATE_LINES = { book: 24, llms: 20, page: 12 };

function pagePlate(pages, pagesDir) {
  if (pages.length === 0) return null;
  // The root index page is a scroll of the whole site; prefer a real chapter.
  const chosen = pages.length > 1 ? pages[1] : pages[0];
  const lines = readLines(chosen);
  const { endLine } = frontmatterOf(chosen);
  const head = lines.slice(0, endLine + 1);
  const body = lines.slice(endLine + 1, endLine + 1 + PLATE_LINES.page);
  return {
    file: relative(pagesDir, chosen).split(sep).join('/'),
    excerpt: [...head, ...body].join('\n'),
  };
}

async function rawHtmlComparison(capture, pages, pagesDir) {
  if (!capture.sourceUrl) return { rawHtml: null, emitted: null };
  let bytes = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(capture.sourceUrl, {
      signal: controller.signal,
      headers: { 'user-agent': 'docharvest-showcase-build/1.0 (+https://rohannshetty.github.io/DocHarvest/)' },
    });
    clearTimeout(timer);
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      bytes = buffer.byteLength;
    }
  } catch {
    bytes = null;
  }

  // The emitted counterpart of that URL: the page whose frontmatter records it,
  // else the shallowest page in the tree.
  let match = null;
  for (const file of pages) {
    const { data } = frontmatterOf(file);
    if (data.source_url === capture.sourceUrl) {
      match = file;
      break;
    }
  }
  if (!match && pages.length > 0) {
    match = [...pages].sort((a, b) => a.length - b.length)[0];
  }

  return {
    rawHtml: bytes === null ? null : { url: capture.sourceUrl, bytes },
    emitted: match
      ? { path: relative(pagesDir, match).split(sep).join('/'), bytes: statSync(match).size }
      : null,
  };
}

async function main() {
  const { dirs, terms, limit } = parseArgs(process.argv.slice(2));

  // First pass: facts, sizes and plates for every capture.
  const captures = [];
  const allRows = [];

  for (const rawDir of dirs) {
    const dir = resolve(process.cwd(), rawDir);
    const pagesDir = join(dir, 'pages');
    if (!existsSync(pagesDir) || !statSync(pagesDir).isDirectory()) {
      fail(`"${rawDir}" has no pages/ directory — pass a DocHarvest capture directory`);
    }

    const id = captureId(dir);
    const pages = pageFiles(pagesDir);
    const facts = captureFacts(dir, pages);

    const bookPath = join(dir, 'book.md');
    const llmsPath = join(dir, 'llms.txt');
    const metadataPath = join(dir, 'metadata.json');
    const versionsDir = join(dir, 'versions');
    const exportsDir = join(dir, 'exports');
    const domain = domainOf(facts.sourceUrl);
    const ragPath = domain ? join(exportsDir, `${domain}_rag.jsonl`) : null;
    const pdfPath = domain ? join(exportsDir, `${domain}_handbook.pdf`) : null;

    const pagesBytes = pages.reduce((sum, file) => sum + statSync(file).size, 0);
    const bookBytes = existsSync(bookPath) ? statSync(bookPath).size : null;
    const llmsBytes = existsSync(llmsPath) ? statSync(llmsPath).size : null;

    const comparison = await rawHtmlComparison(facts, pages, pagesDir);

    const plates = {
      book: existsSync(bookPath)
        ? { file: 'book.md', excerpt: excerpt(bookPath, PLATE_LINES.book) }
        : null,
      llms: existsSync(llmsPath)
        ? { file: 'llms.txt', excerpt: excerpt(llmsPath, PLATE_LINES.llms) }
        : null,
      page: pagePlate(pages, pagesDir),
      rag: ragPath && existsSync(ragPath)
        ? { file: `exports/${domain}_rag.jsonl`, excerpt: readLines(ragPath)[0] ?? null }
        : null,
    };

    captures.push({
      id,
      sourceUrl: facts.sourceUrl,
      provider: facts.provider,
      captured: facts.captured,
      title: facts.title,
      declaredPages: facts.declaredPages,
      pages: pages.length,
      bytes: {
        'book.md': bookBytes,
        'llms.txt': llmsBytes,
        pages: pagesBytes,
        total: (bookBytes ?? 0) + (llmsBytes ?? 0) + pagesBytes,
      },
      outputs: [
        { path: 'pages/', bytes: pagesBytes, pages: pages.length },
        { path: 'book.md', bytes: bookBytes, libraryName: 'docs.md' },
        { path: 'llms.txt', bytes: llmsBytes },
        { path: 'metadata.json', bytes: existsSync(metadataPath) ? statSync(metadataPath).size : null },
        { path: 'versions/', bytes: existsSync(versionsDir) ? statSync(versionsDir).size : null },
        {
          path: `exports/${domain ?? '<domain>'}_rag.jsonl`,
          bytes: ragPath && existsSync(ragPath) ? statSync(ragPath).size : null,
        },
        {
          path: `exports/${domain ?? '<domain>'}_handbook.pdf`,
          bytes: pdfPath && existsSync(pdfPath) ? statSync(pdfPath).size : null,
        },
      ],
      rawHtml: comparison.rawHtml,
      emitted: comparison.emitted,
      plates,
    });

    // Second pass per capture: the index rows.
    const titleOf = (file) => frontmatterOf(file).data.title ?? null;
    const rel = (file) => relative(dir, file).split(sep).join('/');
    for (const file of pages) {
      allRows.push(...collectRows(file, rel(file), id, titleOf(file), terms));
    }
    if (existsSync(bookPath)) {
      allRows.push(...collectRows(bookPath, 'book.md', id, `${id} book`, terms));
    }
    if (existsSync(llmsPath)) {
      allRows.push(...collectRows(llmsPath, 'llms.txt', id, `${id} manifest`, terms));
    }

    process.stdout.write(
      `${id}: ${pages.length} pages, book ${bookBytes ?? '-'} B, llms ${llmsBytes ?? '-'} B, pages ${pagesBytes} B\n`,
    );
  }

  // Cap round-robin across terms so no single term monopolises the sheet.
  // Rows are ordered by the capture they came from (the order the captures were
  // passed in), then by file and line: the sheet reads like the captures were
  // taken, and the masthead specimen opens on the first capture's own lines.
  const captureOrder = new Map(captures.map((capture, index) => [capture.id, index]));
  const byKey = (a, b) =>
    (captureOrder.get(a.source) ?? captures.length) - (captureOrder.get(b.source) ?? captures.length) ||
    a.path.localeCompare(b.path) ||
    a.line - b.line ||
    a.term.localeCompare(b.term);

  const queues = terms.map((term) =>
    allRows.filter((row) => row.term === term).sort(byKey),
  );
  const cursors = terms.map(() => 0);
  const selected = [];
  let exhausted = false;
  while (selected.length < limit && !exhausted) {
    exhausted = true;
    for (let i = 0; i < queues.length; i++) {
      if (cursors[i] >= queues[i].length) continue;
      exhausted = false;
      selected.push(queues[i][cursors[i]++]);
      if (selected.length >= limit) break;
    }
  }
  const seenLines = new Set();
  const rows = selected
    .sort(byKey)
    // One row per emitted line: a line that matches two terms is still one line
    // of the index, and listing it twice would read as a defect.
    .filter((row) => {
      const key = `${row.source}\u0000${row.path}\u0000${row.line}`;
      if (seenLines.has(key)) return false;
      seenLines.add(key);
      return true;
    });

  const generated = new Date().toISOString();
  const indexData = {
    provenance: {
      generated,
      generator: 'docs/scripts/build-index-data.mjs',
      captures: captures.map((capture) => ({
        id: capture.id,
        sourceUrl: capture.sourceUrl,
        provider: capture.provider,
        captured: capture.captured,
        pages: capture.pages,
        rows: rows.filter((row) => row.source === capture.id).length,
      })),
      terms,
      totalRows: rows.length,
      note: 'contexts are verbatim lines from emitted Markdown; `line` is the 1-based line number in that file',
    },
    rows,
  };

  const manifest = {
    generated,
    generator: 'docs/scripts/build-index-data.mjs',
    note: 'byte counts are measured on disk; excerpts are verbatim file heads; null means the file is absent from that capture',
    captures,
  };

  writeFileSync(join(DOCS_ROOT, 'data', 'index-data.json'), `${JSON.stringify(indexData, null, 2)}\n`);
  writeFileSync(join(DOCS_ROOT, 'data', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\nrows: ${rows.length} (cap ${limit}) across ${captures.length} captures`);
  for (const term of terms) {
    console.log(`  ${term}: ${rows.filter((row) => row.term === term).length}`);
  }
  console.log('wrote docs/data/index-data.json and docs/data/manifest.json');
}

main().catch((error) => fail(error?.stack || String(error)));
