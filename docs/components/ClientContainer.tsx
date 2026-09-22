'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { InstallModal } from './InstallModal';
import type { DocHarvestGithubData } from '../lib/github';
import type { IndexData } from '../lib/indexData';

interface ClientContainerProps {
  githubData: DocHarvestGithubData;
  indexData: IndexData;
  children: React.ReactNode;
}

export function ClientContainer({ githubData, indexData, children }: ClientContainerProps) {
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const openInstallModal = () => setInstallModalOpen(true);

  return (
    <div className="flex min-h-screen flex-col">

      <Header stars={githubData.stats.stars} onOpenInstallModal={openInstallModal} />

      <Hero onOpenInstallModal={openInstallModal} indexData={indexData} />
      {children}

      <InstallModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  );
}

export default ClientContainer;
