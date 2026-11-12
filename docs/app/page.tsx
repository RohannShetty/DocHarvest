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
import { INDEX_DATA } from '@/lib/indexData';

/**
 * Section order is the argument order: what it is (hero) → how a capture works
 * → the four ways to run it → the GUI → what lands on disk → how an agent reads
 * it → which sites it understands → what was measured → open questions.
 */
export default function Page() {
  return (
    <ClientContainer indexData={INDEX_DATA}>
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
