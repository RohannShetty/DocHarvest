import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Connectivity } from '../Connectivity';
import { CONNECT_PATHS } from '../../data/showcaseData';
import { MCP_TOOLS } from '../../data/mcpTools';
import { HowItWorks } from '../HowItWorks';
import { Proof } from '../Proof';
import { RETRIEVAL_BENCHMARK } from '../../data/benchmark';
import { STATS } from '../../lib/stats';
import { WORKFLOW_PATHS, WorkflowPaths } from '../WorkflowPaths';

afterEach(cleanup);

// ─── WorkflowPaths: the four ways to run a capture ──────────────────────────

describe('WorkflowPaths', () => {
  it('offers one tab per workflow and names the command for the first', () => {
    render(<WorkflowPaths />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(WORKFLOW_PATHS.length);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(WORKFLOW_PATHS[0].command);
  });

  it('swaps the panel when another workflow is chosen', async () => {
    const user = userEvent.setup();
    render(<WorkflowPaths />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(WORKFLOW_PATHS[2].command);
  });

  it('moves left and right through the tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<WorkflowPaths />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[0]);
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Connectivity: three integration routes and the real tool list ──────────

describe('Connectivity', () => {
  it('renders one tab per integration route', () => {
    render(<Connectivity />);
    expect(screen.getAllByRole('tab')).toHaveLength(CONNECT_PATHS.length);
  });

  it('shows the MCP config first and swaps to the files route', async () => {
    const user = userEvent.setup();
    render(<Connectivity />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('mcpServers');

    await user.click(screen.getAllByRole('tab')[2]);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Path.home()');
  });

  it('lists every MCP tool the server registers', () => {
    render(<Connectivity />);
    expect(MCP_TOOLS).toHaveLength(12);
    for (const tool of MCP_TOOLS) {
      expect(screen.getAllByText(tool.name).length).toBeGreaterThan(0);
    }
  });
});

// ─── HowItWorks: three steps, each with a command ───────────────────────────

describe('HowItWorks', () => {
  it('renders the three capture steps', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Compile')).toBeInTheDocument();
    expect(screen.getByText('Use it')).toBeInTheDocument();
  });
});

// ─── Proof: two rerunnable checks ───────────────────────────────────────────

describe('Proof', () => {
  it('states the fixture retrieval result and its dataset', () => {
    render(<Proof />);
    expect(screen.getByText(RETRIEVAL_BENCHMARK.hitAtK.toFixed(2))).toBeInTheDocument();
    expect(screen.getByText(/fixture-v1/)).toBeInTheDocument();
  });

  it('states the repository test count from generated stats', () => {
    render(<Proof />);
    expect(screen.getByText(String(STATS.testsPassing))).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(STATS.statsUpdated)).length).toBeGreaterThan(0);
  });

  it('names the account requirement honestly', () => {
    render(<Proof />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });
});
