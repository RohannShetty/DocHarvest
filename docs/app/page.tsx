import React from 'react';
import { ClientContainer } from '@/components/ClientContainer';
import { HowItWorks } from '@/components/HowItWorks';
import { WorkflowPaths } from '@/components/WorkflowPaths';
import { ProductWalkthrough } from '@/components/ProductWalkthrough';
import { Outputs } from '@/components/Outputs';
import { Connectivity } from '@/components/Connectivity';
import { SupportedPlatforms } from '@/components/SupportedPlatforms';
import { Proof } from '@/components/Proof';
import { Faq } from '@/components/Faq';
import { SiteFooter } from '@/components/SiteFooter';
import { getDocHarvestGithubData } from '@/lib/github';
import { INDEX_DATA } from '@/lib/indexData';

export const revalidate = 3600;

export default async function Page() {
  const githubData = await getDocHarvestGithubData();

  return (
    <ClientContainer githubData={githubData} indexData={INDEX_DATA}>
      <main>
        <HowItWorks />
        <WorkflowPaths />
        <ProductWalkthrough />
        <Outputs />
        <Connectivity />
        <SupportedPlatforms />
        <Proof />
        <Faq />
      </main>
      <SiteFooter />
    </ClientContainer>
  );
}
