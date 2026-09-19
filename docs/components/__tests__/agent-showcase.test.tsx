import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgentSkillSwitcher } from '../AgentSkillSwitcher';
import { MultiAgentSimulation } from '../MultiAgentSimulation';
import { TokenBenchmark } from '../TokenBenchmark';
import { AgentTools } from '../AgentTools';
import { AI_AGENTS, MULTI_AGENT_SIMULATION_STEPS, TOKEN_BENCHMARK } from '../../data/showcaseData';

afterEach(cleanup);

// ─── AgentSkillSwitcher Tests ────────────────────────────────────────────────

describe('AgentSkillSwitcher', () => {
  it('renders all harnesses in the list initially', () => {
    render(<AgentSkillSwitcher />);
    expect(screen.getByText(new RegExp(`${AI_AGENTS.length} Agent Harnesses`))).toBeInTheDocument();
  });

  it('filters harnesses by category', async () => {
    const user = userEvent.setup();
    render(<AgentSkillSwitcher />);

    const ideFilterBtn = screen.getByRole('button', { name: /AI IDE/i });
    await user.click(ideFilterBtn);

    const ideCount = AI_AGENTS.filter((a) => a.category === 'AI IDE').length;
    const tabs = screen.getAllByRole('tab').filter((t) => t.id.startsWith('harness-tab-'));
    expect(tabs).toHaveLength(ideCount);
  });

  it('switches the active harness and updates command display', async () => {
    const user = userEvent.setup();
    render(<AgentSkillSwitcher />);

    const cursorTab = screen.getByRole('tab', { name: /Cursor IDE/i });
    await user.click(cursorTab);

    expect(screen.getByText('gitbook-dl skill install docharvest -o .cursor/skills')).toBeInTheDocument();
    expect(screen.getByText('.cursor/skills')).toBeInTheDocument();
  });

  it('switches between skill install and MCP config tabs', async () => {
    const user = userEvent.setup();
    render(<AgentSkillSwitcher />);

    const mcpTab = screen.getByRole('tab', { name: /FastMCP v2 Config/i });
    await user.click(mcpTab);

    expect(screen.getByRole('button', { name: /Copy MCP configuration JSON/i })).toBeInTheDocument();
  });

  it('navigates harness tabs via keyboard arrow keys', async () => {
    const user = userEvent.setup();
    render(<AgentSkillSwitcher />);

    const firstTab = screen.getAllByRole('tab').find((t) => t.id.startsWith('harness-tab-'))!;
    await user.click(firstTab);

    await user.keyboard('{ArrowDown}');
    const secondTab = screen.getAllByRole('tab').find((t) => t.id === `harness-tab-${AI_AGENTS[1].id}`);
    expect(secondTab).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── MultiAgentSimulation Tests ──────────────────────────────────────────────

describe('MultiAgentSimulation', () => {
  it('renders all 3 simulation stages with the first stage selected', () => {
    render(<MultiAgentSimulation />);
    const stepTabs = screen.getAllByRole('tab').filter((t) => t.id.startsWith('sim-step-tab-'));
    expect(stepTabs).toHaveLength(3);
    expect(stepTabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(MULTI_AGENT_SIMULATION_STEPS[0].agentTitle)).toBeInTheDocument();
  });

  it('switches stages when clicking stage tabs', async () => {
    const user = userEvent.setup();
    render(<MultiAgentSimulation />);

    const stepTabs = screen.getAllByRole('tab').filter((t) => t.id.startsWith('sim-step-tab-'));
    await user.click(stepTabs[1]);

    expect(stepTabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(MULTI_AGENT_SIMULATION_STEPS[1].agentTitle)).toBeInTheDocument();
    expect(screen.getAllByText(/search_docs & query_doc_graph/i).length).toBeGreaterThan(0);
  });

  it('navigates through Next and Previous Agent buttons', async () => {
    const user = userEvent.setup();
    render(<MultiAgentSimulation />);

    const nextBtn = screen.getByRole('button', { name: /Next Agent/i });
    await user.click(nextBtn);

    expect(screen.getByText(MULTI_AGENT_SIMULATION_STEPS[1].agentTitle)).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /Previous Agent/i });
    await user.click(prevBtn);

    expect(screen.getByText(MULTI_AGENT_SIMULATION_STEPS[0].agentTitle)).toBeInTheDocument();
  });

  it('toggles simulation play/pause button', async () => {
    const user = userEvent.setup();
    render(<MultiAgentSimulation />);

    const playBtn = screen.getByRole('button', { name: /Start simulation playback/i });
    await user.click(playBtn);

    expect(screen.getByRole('button', { name: /Pause simulation playback/i })).toBeInTheDocument();
  });
});

// ─── TokenBenchmark Tests ────────────────────────────────────────────────────

describe('TokenBenchmark', () => {
  it('renders token reduction benchmark headline and savings', () => {
    render(<TokenBenchmark />);
    expect(screen.getByText(/~83% Token Reduction/i)).toBeInTheDocument();
    expect(screen.getByText(/tokens saved per capture set/i)).toBeInTheDocument();
  });

  it('switches between overview, noise breakdown, and preserved semantics tabs', async () => {
    const user = userEvent.setup();
    render(<TokenBenchmark />);

    const noiseTab = screen.getByRole('tab', { name: /Stripped Noise Breakdown/i });
    await user.click(noiseTab);

    expect(screen.getByText('Navigation & Sidebar DOMs')).toBeInTheDocument();
    expect(screen.getByText('Cookie Banners & Modals')).toBeInTheDocument();

    const preservedTab = screen.getByRole('tab', { name: /Preserved Semantics/i });
    await user.click(preservedTab);

    expect(screen.getByText('Syntax-Highlighted Code Blocks')).toBeInTheDocument();
    expect(screen.getByText('Cryptographic YAML Frontmatter')).toBeInTheDocument();
  });
});

// ─── AgentTools Full Section Tests ───────────────────────────────────────────

describe('AgentTools', () => {
  it('renders section 04 with protocol specification and 12 MCP tools', () => {
    render(<AgentTools />);
    expect(screen.getByText('04 — THE AGENTS')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /12 Tools Over FastMCP v2/i })).toBeInTheDocument();
    expect(screen.getAllByText('download_docs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('search_docs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('query_doc_graph').length).toBeGreaterThan(0);
    expect(screen.getAllByText('read_doc').length).toBeGreaterThan(0);
  });
});
