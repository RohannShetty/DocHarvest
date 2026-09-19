'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, Check, Sparkles, Terminal, Activity, Layers, Cpu } from 'lucide-react';
import { MULTI_AGENT_SIMULATION_STEPS, type AgentSimulationStep } from '../data/showcaseData';

export function MultiAgentSimulation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = MULTI_AGENT_SIMULATION_STEPS[currentStepIndex];

  // Auto-play simulation effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % MULTI_AGENT_SIMULATION_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStepKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentStepIndex + 1) % MULTI_AGENT_SIMULATION_STEPS.length;
      setCurrentStepIndex(nextIndex);
      document.getElementById(`sim-step-tab-${nextIndex}`)?.focus();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (currentStepIndex - 1 + MULTI_AGENT_SIMULATION_STEPS.length) % MULTI_AGENT_SIMULATION_STEPS.length;
      setCurrentStepIndex(prevIndex);
      document.getElementById(`sim-step-tab-${prevIndex}`)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setCurrentStepIndex(0);
      document.getElementById('sim-step-tab-0')?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = MULTI_AGENT_SIMULATION_STEPS.length - 1;
      setCurrentStepIndex(lastIndex);
      document.getElementById(`sim-step-tab-${lastIndex}`)?.focus();
    }
  };

  return (
    <div className="mt-12 border-t border-rule-strong pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="sheet-label">AUTONOMOUS MULTI-AGENT SIMULATION</p>
          <h3 className="sheet-head mt-2 text-ink">
            How Autonomous Agents Collaborate with DocHarvest Tools
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause simulation playback' : 'Start simulation playback'}
            className="sheet-num inline-flex cursor-pointer items-center gap-1.5 border border-rule bg-bond-2 px-3 py-1.5 text-[11px] text-ink transition-colors hover:border-rule-strong focus-visible:outline-2 focus-visible:outline-match"
          >
            {isPlaying ? (
              <>
                <Pause aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                <span>PLAY SEQUENCE</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="sheet-body mt-3 max-w-[68ch]">
        From raw URL ingestion to ranked BM25 search and AST-bounded code verification: see how
        autonomous coding agents dispatch <code className="sheet-num text-ink">download_docs</code>,{' '}
        <code className="sheet-num text-ink">search_docs</code>,{' '}
        <code className="sheet-num text-ink">query_doc_graph</code>, and{' '}
        <code className="sheet-num text-ink">read_doc</code> with zero context overflow.
      </p>

      {/* Step selection tabs */}
      <div
        role="tablist"
        aria-label="Multi-agent simulation stages"
        onKeyDown={handleStepKeyDown}
        className="mt-6 grid grid-cols-1 border-t border-rule-strong sm:grid-cols-3"
      >
        {MULTI_AGENT_SIMULATION_STEPS.map((s, index) => {
          const isActive = index === currentStepIndex;
          return (
            <button
              key={s.id}
              role="tab"
              id={`sim-step-tab-${index}`}
              aria-selected={isActive}
              aria-controls={`sim-step-panel-${s.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setCurrentStepIndex(index);
                setIsPlaying(false);
              }}
              className={`flex cursor-pointer flex-col gap-1 border-b border-r border-rule p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                isActive ? 'bg-bond-2 border-t-2 border-t-match' : 'bg-bond hover:bg-bond-2/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`sheet-num text-[11px] font-semibold ${isActive ? 'text-match' : 'text-ink-3'}`}>
                  STAGE {s.stepNum}
                </span>
                <span className="sheet-label text-[10px]">
                  {s.id === 'crawler' ? 'Ingestion' : s.id === 'architect' ? 'Synthesis' : 'Verification'}
                </span>
              </div>
              <p className="sheet-term text-[14px] font-medium text-ink truncate mt-1">
                {s.agentRole.split('/')[0].trim()}
              </p>
              <p className="sheet-num text-[11px] text-ink-3 truncate">
                tool: {s.toolCall.toolName.split('&')[0].trim()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active step display panel */}
      <div
        role="tabpanel"
        id={`sim-step-panel-${step.id}`}
        aria-labelledby={`sim-step-tab-${currentStepIndex}`}
        tabIndex={0}
        className="border border-t-0 border-rule-strong bg-bond-2 p-6"
      >
        {/* Step details header */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2">
              <span className="sheet-num bg-match px-2 py-0.5 text-[10px] font-bold text-bond">
                AGENT {step.stepNum}
              </span>
              <h4 className="sheet-head text-[18px] text-ink">{step.agentTitle}</h4>
            </div>
            <p className="sheet-body mt-2 text-[13px]">{step.purpose}</p>

            {/* Tool call declaration */}
            <div className="mt-4 border border-rule bg-bond p-3">
              <div className="flex items-center justify-between">
                <span className="sheet-label flex items-center gap-1.5 text-ink">
                  <Terminal aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                  Tool Invocation
                </span>
                <span className="sheet-num text-[11px] text-match">{step.toolCall.toolName}</span>
              </div>
              <pre className="mt-2 text-[12px] text-ink overflow-x-auto p-2 bg-bond-2 border border-rule font-mono">
                {`mcp.call_tool(\n  name="${step.toolCall.toolName}",\n  arguments={${step.toolCall.params}}\n)`}
              </pre>
            </div>
          </div>

          {/* Step Telemetry */}
          <div className="flex flex-col justify-between border-t border-rule pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <span className="sheet-label flex items-center gap-1.5">
                <Activity aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                Execution Telemetry
              </span>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-3">
                <div>
                  <dt className="sheet-label text-[10px]">Latency</dt>
                  <dd className="sheet-num text-[14px] font-semibold text-ink">{step.telemetry.latency}</dd>
                </div>
                <div>
                  <dt className="sheet-label text-[10px]">Status</dt>
                  <dd className="sheet-term text-[12px] text-match font-medium">{step.telemetry.status}</dd>
                </div>
                <div>
                  <dt className="sheet-label text-[10px]">Prompt Tokens</dt>
                  <dd className="sheet-num text-[13px] text-ink-2">{step.telemetry.tokensIn} tokens</dd>
                </div>
                <div>
                  <dt className="sheet-label text-[10px]">Emitted Tokens</dt>
                  <dd className="sheet-num text-[13px] text-ink">{step.telemetry.tokensOut} tokens</dd>
                </div>
                <div className="col-span-2">
                  <dt className="sheet-label text-[10px]">AST Precision Bound</dt>
                  <dd className="sheet-num text-[12px] text-ink-2">{step.telemetry.astBound}</dd>
                </div>
              </dl>
            </div>

            {/* Artifacts Produced */}
            <div className="mt-4 border-t border-rule pt-3">
              <span className="sheet-label flex items-center gap-1.5 text-[10px]">
                <Layers aria-hidden="true" className="h-3 w-3 text-ink-3" />
                Verified Outputs
              </span>
              <ul className="mt-2 space-y-1">
                {step.artifactsProduced.map((art) => (
                  <li key={art} className="sheet-num text-[11px] text-ink-3 flex items-center gap-1.5 truncate">
                    <Check aria-hidden="true" className="h-3 w-3 text-match shrink-0" />
                    <span>{art}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Live Stdio / Tool Output log viewer */}
        <div className="mt-6 border-t border-rule pt-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="sheet-label">stdio verification transcript</span>
            <span className="sheet-num text-[11px] text-ink-3">Live trace output</span>
          </div>
          <pre className="max-h-[200px] overflow-auto border border-rule bg-bond p-3 text-[12px] leading-relaxed text-ink font-mono">
            {step.outputLog}
          </pre>
        </div>

        {/* Navigation Stepper Controls */}
        <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
          <button
            type="button"
            onClick={() => {
              setCurrentStepIndex((prev) => (prev - 1 + MULTI_AGENT_SIMULATION_STEPS.length) % MULTI_AGENT_SIMULATION_STEPS.length);
              setIsPlaying(false);
            }}
            className="sheet-label inline-flex cursor-pointer items-center gap-1 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Previous Agent
          </button>

          <div className="flex gap-1.5">
            {MULTI_AGENT_SIMULATION_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to stage ${idx + 1}`}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`h-1.5 cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-match ${
                  idx === currentStepIndex ? 'w-6 bg-match' : 'w-2 bg-rule-strong hover:bg-ink-3'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStepIndex((prev) => (prev + 1) % MULTI_AGENT_SIMULATION_STEPS.length);
              setIsPlaying(false);
            }}
            className="sheet-label inline-flex cursor-pointer items-center gap-1 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            Next Agent
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiAgentSimulation;
