// Regenerate the public claim numbers in docs/lib/stats.ts from a real test run.
//
// Why this exists: `testsPassing` was typed in by hand and drifted from 740 →
// 765 → 686 while the actual suite grew to 800+. A public number that nobody
// regenerates is a public claim that will eventually be false. This script is
// the only supported way to change the test numbers.
//
// Usage:
//   node docs/scripts/sync-stats.mjs --run                 # run pytest, then update
//   node docs/scripts/sync-stats.mjs --input <file>        # parse saved pytest output
//   PYTEST_SUMMARY_FILE=<file> node .../sync-stats.mjs     # same as --input
//
// If the input is missing or unparseable the script exits 0 and leaves
// stats.ts untouched, so a CI hiccup can never blank out the published values.
//
// Only Node's standard library is used — the Pages workflow runs this with no
// extra install step.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const STATS_FILE = resolve(HERE, '..', 'lib', 'stats.ts');

const args = process.argv.slice(2);
const inputFlag = args.indexOf('--input');
const wantsRun = args.includes('--run');

/**
 * Parse a JUnit XML report. Returns null when nothing usable was found.
 *
 * Why XML instead of the console summary: `pytest -q` prints its counts to a
 * terminal, and this suite's TTY-sensitive tests make that output vary with how
 * the process was spawned (piped, redirected, attached). The XML report is
 * produced the same way regardless. It also distinguishes skipped tests, which
 * the console line does not: without that, `780 passed + 2 failed` looks like a
 * collection of 782 when the run actually collected 783.
 */
function parseJunitXml(text) {
  const suite = text.match(/<testsuite\b[^>]*>/);
  if (!suite) return null;
  const attr = (name) => {
    const match = suite[0].match(new RegExp(`\\b${name}="([^"]*)"`));
    return match ? Number(match[1]) : 0;
  };

  const tests = attr('tests');
  if (!tests) return null;
  const failures = attr('failures') + attr('errors');
  const skipped = attr('skipped');
  const time = suite[0].match(/\btime="([\d.]+)"/);

  return {
    testsCollected: tests,
    testsPassing: tests - failures - skipped,
    testsFailing: failures,
    testsSkipped: skipped,
    suiteSeconds: time ? Number(time[1]) : null,
  };
}

/** Parse a console pytest summary (used for --input / PYTEST_SUMMARY_FILE). */
function parsePytestSummary(text) {
  const passed = text.match(/(\d+)\s+passed/);
  const failed = text.match(/(\d+)\s+failed/);
  const errors = text.match(/(\d+)\s+error/);
  const skipped = text.match(/(\d+)\s+skipped/);
  const collected = text.match(/(\d+)\s+tests? collected/);
  const seconds = text.match(/in\s+([\d.]+)s/);

  if (!passed && !collected) return null;

  const failures = (failed ? Number(failed[1]) : 0) + (errors ? Number(errors[1]) : 0);
  const passing = passed ? Number(passed[1]) : 0;
  const skippedCount = skipped ? Number(skipped[1]) : 0;
  // `pytest -q` prints the pass/fail counts but not the collected total; the
  // run total is the sum, which is what the site should quote.
  const total = collected
    ? Number(collected[1])
    : passing + failures + skippedCount;

  return {
    testsCollected: total,
    testsPassing: passing,
    testsFailing: failures,
    testsSkipped: skippedCount,
    suiteSeconds: seconds ? Number(seconds[1]) : null,
  };
}

function runPytest() {
  const candidates =
    process.platform === 'win32'
      ? [resolve(REPO_ROOT, '.venv', 'Scripts', 'python.exe'), 'python', 'python3']
      : [resolve(REPO_ROOT, '.venv', 'bin', 'python'), 'python3', 'python'];

  const python = candidates.find((c) => c === 'python' || c === 'python3' || existsSync(c));
  if (!python) throw new Error('no python interpreter found for --run');

  const opts = {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Never inherit the caller's stdin: with a piped/redirected stdin some
    // Windows tooling aborts with "stdin is not a tty" before pytest runs.
    stdio: ['ignore', 'pipe', 'pipe'],
  };

  // A red suite exits non-zero and makes execFileSync throw — the summary we
  // need is on the error object. Publishing "0 tests passed" because the run
  // failed would be worse than publishing the real failing count.
  const run = (argv) => {
    try {
      return execFileSync(python, argv, opts);
    } catch (error) {
      const captured = `${error.stdout || ''}${error.stderr || ''}`;
      if (captured.trim()) return captured;
      throw error;
    }
  };

  // The XML report is written to a scratch file, never into the repo, and it is
  // the authoritative source for the published counts.
  const reportFile = join(tmpdir(), `docharvest-pytest-${process.pid}.xml`);
  try {
    const collectedOut = run(['-m', 'pytest', '--collect-only', '-q', '-p', 'no:cacheprovider']);
    const consoleOut = run([
      '-m',
      'pytest',
      '-q',
      '-p',
      'no:cacheprovider',
      '--tb=no',
      '--junit-xml',
      reportFile,
    ]);
    const xml = existsSync(reportFile) ? readFileSync(reportFile, 'utf8') : '';
    const stats = parseJunitXml(xml);
    if (!stats) {
      console.log('sync-stats: no JUnit report produced; falling back to console output');
      return { text: `${tail(collectedOut)}\n${tail(consoleOut)}`, stats: null };
    }
    return { text: `${tail(collectedOut)}\n${tail(consoleOut)}`, stats };
  } finally {
    if (existsSync(reportFile)) rmSync(reportFile, { force: true });
  }
}

const tail = (output) => output.split('\n').slice(-4).join('\n');

function applyStats(stats) {
  const original = readFileSync(STATS_FILE, 'utf8');
  let text = original;
  const today = new Date().toISOString().slice(0, 10);

  const set = (key, value) => {
    const re = new RegExp(`(\\b${key}:\\s*)[^,]+(,)`, 'm');
    if (!re.test(text)) throw new Error(`stats.ts has no '${key}' field to update`);
    text = text.replace(re, `$1${value}$2`);
  };

  // Fields a consumer may legitimately not track (an older stats.ts, or a
  // console-parsed run that cannot see skips) must not fail the sync.
  const setOptional = (key, value) => {
    if (value === undefined || value === null) return;
    const re = new RegExp(`(\\b${key}:\\s*)[^,]+(,)`, 'm');
    if (re.test(text)) text = text.replace(re, `$1${value}$2`);
  };

  set('testsCollected', stats.testsCollected);
  set('testsPassing', stats.testsPassing);
  set('testsFailing', stats.testsFailing);
  setOptional('testsSkipped', stats.testsSkipped);
  if (stats.suiteSeconds !== null) set('suiteSeconds', stats.suiteSeconds);
  set('statsUpdated', `'${today}'`);

  if (text === original) {
    console.log('sync-stats: no change to stats.ts');
  } else {
    writeFileSync(STATS_FILE, text, 'utf8');
  }

  // The README badge is a published claim too, so it is regenerated here rather
  // than typed in — a hand-edited badge is exactly how "765 passing" outlived a
  // suite of 800+. Both halves are rewritten: the alt text shows up in screen
  // readers and whenever the image fails to load, so a stale alt is still a
  // stale claim. tests/test_stats_drift.py asserts the two agree.
  const README_FILE = resolve(REPO_ROOT, 'README.md');
  const badgeAlt = `Tests: ${stats.testsPassing} passing`;
  const badgeUrl = `https://img.shields.io/badge/tests-${stats.testsPassing}%20passing%20(${today.replace(/-/g, '--')})-f59e0b?style=flat-square&labelColor=18181b`;
  const badgeRe = /\[!\[Tests: [^\]]*\]\(https:\/\/img\.shields\.io\/badge\/tests-.*?\)\]/;
  if (existsSync(README_FILE)) {
    const readme = readFileSync(README_FILE, 'utf8');
    if (badgeRe.test(readme)) {
      const updated = readme.replace(badgeRe, `[![${badgeAlt}](${badgeUrl})]`);
      if (updated !== readme) writeFileSync(README_FILE, updated, 'utf8');
      console.log(`sync-stats: README badge -> ${stats.testsPassing} passing (${today})`);
    } else {
      // Loudly, not silently: a skipped badge is how a stale number survives.
      console.error(
        'sync-stats: WARNING — no tests badge matched in README.md, so its number is now ' +
          'stale relative to stats.ts. Fix the badge markdown or the pattern in this script.',
      );
      process.exitCode = 1;
    }
  }

  console.log(
    `sync-stats: ${stats.testsPassing}/${stats.testsCollected} passing, ` +
      `${stats.testsFailing} failing, updated ${today}`,
  );
}

let raw = '';
let stats = null;
if (wantsRun) {
  ({ text: raw, stats } = runPytest());
} else {
  const file = inputFlag !== -1 ? args[inputFlag + 1] : process.env.PYTEST_SUMMARY_FILE;
  if (file && existsSync(file)) raw = readFileSync(file, 'utf8');
}

if (!stats) stats = raw ? parsePytestSummary(raw) : null;
if (!stats) {
  console.log('sync-stats: no pytest summary available; leaving stats.ts unchanged');
  process.exit(0);
}
applyStats(stats);

// The suite contains guards that assert the *published* numbers are honest
// (tests/test_stats_drift.py, tests/test_naming_drift.py). They read whatever
// was published before this run, so a run that starts from stale numbers
// legitimately reports failures that this script has just fixed. Re-check them
// against the freshly written values; that is the state a reviewer will see.
if (wantsRun) {
  const guardFiles = ['tests/test_stats_drift.py', 'tests/test_naming_drift.py'];
  const python =
    process.platform === 'win32'
      ? resolve(REPO_ROOT, '.venv', 'Scripts', 'python.exe')
      : resolve(REPO_ROOT, '.venv', 'bin', 'python');
  const interpreter = existsSync(python) ? python : 'python';
  try {
    execFileSync(interpreter, ['-m', 'pytest', ...guardFiles, '-q', '-p', 'no:cacheprovider'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('sync-stats: published numbers satisfy their own guards');
  } catch (error) {
    const captured = `${error.stdout || ''}${error.stderr || ''}`;
    console.error(
      'sync-stats: the published numbers FAILED their own guards after writing:\n' +
        captured.split('\n').filter((line) => line.includes('assert') || 'FAILED' in line).slice(-6).join('\n'),
    );
    process.exitCode = 1;
  }
}
