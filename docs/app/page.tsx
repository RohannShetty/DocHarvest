import React from 'react';
import { ClientContainer } from '@/components/ClientContainer';
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

        {/* 01. The index: every emitted line, with its file and line number */}
        <IndexSection indexData={INDEX_DATA} />

        {/* 02. The manifest: the measured output tree and its plates */}
        <ManifestTree manifest={MANIFEST} />

        {/* 03. The providers: detection order, signals and sample sites */}
        <ProviderTable />

        {/* 04. The agents: MCP tools, resources, prompts, configs, one transcript */}
        <AgentTools />

        {/* 05. The comparison: eight capabilities, three columns */}
        <ComparisonTable />

        {/* 06. The workflows: three readers, three commands */}
        <Workflows />

        {/* 07. Releases: fetched at build time, sizes only when measured */}
        <Releases data={githubData} />

        {/* 08. The FAQ: the same array the FAQPage JSON-LD reads */}
        <FaqSheet />
      </main>

      {/* 09. Colophon */}
      <Colophon />
    </ClientContainer>
  );
}
