'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { AI_AGENTS, type AgentHarness } from '../data/showcaseData';

type CategoryFilter = 'All' | 'AI IDE' | 'Terminal Agent' | 'Extension' | 'CLI Harness';

export function AgentSkillSwitcher() {
  const [selectedAgent, setSelectedAgent] = useState<AgentHarness>(AI_AGENTS[0]);
  const [activeTab, setActiveTab] = useState<'skill' | 'mcp'>('skill');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [copiedType, setCopiedType] = useState<'skill' | 'mcp' | null>(null);

  const filteredAgents = categoryFilter === 'All'
    ? AI_AGENTS
    : AI_AGENTS.filter((agent) => agent.category === categoryFilter);

  const copyText = (text: string, type: 'skill' | 'mcp') => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleAgentKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = filteredAgents.findIndex((a) => a.id === selectedAgent.id);
    if (currentIndex === -1) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % filteredAgents.length;
      setSelectedAgent(filteredAgents[nextIndex]);
      document.getElementById(`harness-tab-${filteredAgents[nextIndex].id}`)?.focus();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + filteredAgents.length) % filteredAgents.length;
      setSelectedAgent(filteredAgents[prevIndex]);
      document.getElementById(`harness-tab-${filteredAgents[prevIndex].id}`)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setSelectedAgent(filteredAgents[0]);
      document.getElementById(`harness-tab-${filteredAgents[0].id}`)?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      setSelectedAgent(filteredAgents[filteredAgents.length - 1]);
      document.getElementById(`harness-tab-${filteredAgents[filteredAgents.length - 1].id}`)?.focus();
    }
  };

  return (
    <div className="mt-12 border-t border-rule-strong pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="sheet-label">UNIVERSAL AGENT HARNESS SUITE</p>
          <h3 className="sheet-head mt-2 text-ink">
            {AI_AGENTS.length} Agent Harnesses. One Bundled Skill.
          </h3>
        </div>
        <p className="sheet-num text-[12px] text-ink-3">
          100% harness-neutral · stdio transport
        </p>
      </div>

      <p className="sheet-body mt-3 max-w-[68ch]">
        The canonical <code className="sheet-num text-ink">docharvest</code> skill text lives inside the installed package.
        Run <code className="sheet-num text-ink">gitbook-dl skill install</code> to place it into any agent&rsquo;s discovery root,
        or wire the FastMCP v2 server directly over stdio.
      </p>

      {/* Category filters */}
      <div
        role="group"
        aria-label="Filter agent harnesses by category"
        className="mt-6 flex flex-wrap gap-1 border-b border-rule pb-2"
      >
        {(['All', 'AI IDE', 'Terminal Agent', 'Extension', 'CLI Harness'] as CategoryFilter[]).map((category) => {
          const isSelected = categoryFilter === category;
          const count = category === 'All' ? AI_AGENTS.length : AI_AGENTS.filter((a) => a.category === category).length;
          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setCategoryFilter(category);
                const nextList = category === 'All' ? AI_AGENTS : AI_AGENTS.filter((a) => a.category === category);
                if (!nextList.some((a) => a.id === selectedAgent.id)) {
                  setSelectedAgent(nextList[0]);
                }
              }}
              className={`sheet-label cursor-pointer px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                isSelected
                  ? 'bg-bond-2 text-ink border-b-2 border-match'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              {category} <span className="sheet-num text-[11px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main harness switcher layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left column: Harness selector list */}
        <div
          role="tablist"
          aria-label="Select AI agent harness"
          aria-orientation="vertical"
          onKeyDown={handleAgentKeyDown}
          className="max-h-[460px] overflow-y-auto border border-rule bg-bond lg:col-span-5"
        >
          {filteredAgents.map((agent) => {
            const isSelected = agent.id === selectedAgent.id;
            return (
              <button
                key={agent.id}
                role="tab"
                id={`harness-tab-${agent.id}`}
                aria-selected={isSelected}
                aria-controls={`harness-panel-${agent.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSelectedAgent(agent)}
                className={`group flex w-full cursor-pointer items-start justify-between gap-3 border-b border-rule px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                  isSelected ? 'bg-bond-2' : 'hover:bg-bond-2/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-1.5 w-1.5 shrink-0 ${
                        isSelected ? 'bg-match' : 'bg-transparent group-hover:bg-ink-3'
                      }`}
                    />
                    <span className={`sheet-term text-[13px] font-medium truncate ${
                      isSelected ? 'text-ink' : 'text-ink-2 group-hover:text-ink'
                    }`}>
                      {agent.name}
                    </span>
                  </div>
                  <p className="sheet-num mt-1 pl-3.5 text-[11px] text-ink-3 truncate">
                    {agent.configPath}
                  </p>
                </div>
                <span className="sheet-label shrink-0 text-[10px] text-ink-3">
                  {agent.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right column: Active harness configuration panel */}
        <div
          role="tabpanel"
          id={`harness-panel-${selectedAgent.id}`}
          aria-labelledby={`harness-tab-${selectedAgent.id}`}
          tabIndex={0}
          className="border border-rule-strong bg-bond-2 p-5 lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            {/* Header with harness metadata */}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
              <div>
                <span className="sheet-label">{selectedAgent.category}</span>
                <h4 className="sheet-head mt-1 text-[18px] text-ink">{selectedAgent.name}</h4>
              </div>
              <div className="text-right">
                <span className="sheet-label">Target Skills Root</span>
                <p className="sheet-num text-[12px] text-match">{selectedAgent.skillDir}</p>
              </div>
            </div>

            <p className="sheet-body mt-3 text-[13px]">{selectedAgent.description}</p>

            {/* Sub-tabs: Skill install command vs MCP Config */}
            <div
              role="tablist"
              aria-label="Configuration format"
              className="mt-5 flex border-b border-rule"
            >
              <button
                type="button"
                role="tab"
                id={`tab-skill-${selectedAgent.id}`}
                aria-selected={activeTab === 'skill'}
                aria-controls={`panel-skill-${selectedAgent.id}`}
                onClick={() => setActiveTab('skill')}
                className={`sheet-label inline-flex cursor-pointer items-center gap-1.5 border-r border-rule px-4 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                  activeTab === 'skill' ? 'bg-bond text-match border-t-2 border-t-match' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Terminal aria-hidden="true" className="h-3.5 w-3.5" />
                1-Click Skill Install
              </button>
              <button
                type="button"
                role="tab"
                id={`tab-mcp-${selectedAgent.id}`}
                aria-selected={activeTab === 'mcp'}
                aria-controls={`panel-mcp-${selectedAgent.id}`}
                onClick={() => setActiveTab('mcp')}
                className={`sheet-label inline-flex cursor-pointer items-center gap-1.5 border-r border-rule px-4 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                  activeTab === 'mcp' ? 'bg-bond text-match border-t-2 border-t-match' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <FileCode aria-hidden="true" className="h-3.5 w-3.5" />
                FastMCP v2 Config (JSON)
              </button>
            </div>

            {/* Sub-panel content */}
            {activeTab === 'skill' ? (
              <div
                role="tabpanel"
                id={`panel-skill-${selectedAgent.id}`}
                aria-labelledby={`tab-skill-${selectedAgent.id}`}
                className="mt-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="sheet-label">Terminal command</span>
                  <span className="sheet-num text-[11px] text-ink-3">
                    writes {selectedAgent.skillDir}/docharvest/SKILL.md
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border border-rule bg-bond p-3">
                  <code className="sheet-num text-[12px] text-ink break-all">
                    {selectedAgent.skillInstallCmd}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(selectedAgent.skillInstallCmd, 'skill')}
                    aria-label={`Copy skill install command for ${selectedAgent.name}`}
                    className="sheet-num inline-flex shrink-0 cursor-pointer items-center gap-1.5 bg-match px-3 py-1.5 text-[11px] font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
                  >
                    {copiedType === 'skill' ? (
                      <>
                        <Check aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2 text-ink-3 text-[12px]">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-match mt-0.5" />
                  <p className="sheet-body text-[12px] text-ink-2">
                    Non-recursive one-level layout recognized natively by {selectedAgent.name}.
                    Includes YAML metadata with argument hints for doc querying.
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="tabpanel"
                id={`panel-mcp-${selectedAgent.id}`}
                aria-labelledby={`tab-mcp-${selectedAgent.id}`}
                className="mt-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="sheet-label">Configuration file</span>
                  <span className="sheet-num text-[11px] text-ink-3">{selectedAgent.configPath}</span>
                </div>
                <pre className="mt-2 max-h-[190px] overflow-auto border border-rule bg-bond p-3 text-[12px] leading-relaxed">
                  {selectedAgent.configSnippet}
                </pre>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => copyText(selectedAgent.configSnippet, 'mcp')}
                    aria-label={`Copy MCP configuration JSON for ${selectedAgent.name}`}
                    className="sheet-num inline-flex cursor-pointer items-center gap-1.5 bg-match px-3 py-1.5 text-[11px] font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
                  >
                    {copiedType === 'mcp' ? (
                      <>
                        <Check aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>COPIED JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>COPY JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-rule pt-3">
            <p className="sheet-label text-[10px]">
              Tip: Pass <code className="sheet-num text-ink">--force</code> to overwrite existing skills if upgrading from a prior version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentSkillSwitcher;
