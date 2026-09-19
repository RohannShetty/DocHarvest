import React from 'react';
import { ClientContainer } from '@/components/ClientContainer';
import { FeatureBento } from '@/components/FeatureBento';
import { InteractivePlayground } from '@/components/InteractivePlayground';
import { IndexSection } from '@/components/IndexSection';
import { ManifestTree } from '@/components/ManifestTree';
import { ProviderTable } from '@/components/ProviderTable';
import { AgentTools } from '@/components/AgentTools';
import { ComparisonTable } from '@/components/ComparisonTable';
import { Workflows } from '@/components/Workflows';
import { Releases } from '@/components/Releases';
import { FaqSheet } from '@/components/FaqSheet';
import { Colophon } from '@/components/Colophon';
import { getDocHarvestGithubData } from '@/lib/github';
import { INDEX_DATA, MANIFEST } from '@/lib/indexData';

export const revalidate = 3600;

export default async function Page() {
  const githubData = await getDocHarvestGithubData();

  return (
    <ClientContainer githubData={githubData} indexData={INDEX_DATA}>
      <main>
        {/* 00. Masthead + index specimen — rendered inside ClientContainer */}

        {/* 01. The 4 Core Architectural Pillars */}
        <FeatureBento />

        {/* 02. Interactive Studio & URL Auto-detection Simulator */}
        <InteractivePlayground />

        {/* 03. The Agents: FastMCP v2 tools, multi-agent simulation, token benchmark & 14+ harness switcher */}
        <AgentTools />

        {/* 04. The Index: every emitted line, with its file and line number */}
        <IndexSection indexData={INDEX_DATA} />

        {/* 05. The Manifest: the measured output tree and its plates */}
        <ManifestTree manifest={MANIFEST} />

        {/* 06. The Providers: detection order, signals and sample sites */}
        <ProviderTable />

        {/* 07. The Comparison: eight capabilities, three columns */}
        <ComparisonTable />

        {/* 08. The Workflows: three readers, three commands */}
        <Workflows />

        {/* 09. Releases: fetched at build time, sizes only when measured */}
        <Releases data={githubData} />

        {/* 10. The FAQ: the same array the FAQPage JSON-LD reads */}
        <FaqSheet />
      </main>

      {/* 11. Colophon */}
      <Colophon />
    </ClientContainer>
  );
}
