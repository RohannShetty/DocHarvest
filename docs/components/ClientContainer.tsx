'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Masthead } from './Masthead';
import { SheetRail } from './SheetRail';
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
    // The rail owns the left 56px at lg and up; everything else clears it.
    <div className="flex min-h-screen flex-col lg:pl-14">
      <SheetRail />

      <Header stars={githubData.stats.stars} onOpenInstallModal={openInstallModal} />

      {/* Line 00 — the masthead, beside the live index specimen */}
      <Masthead onOpenInstallModal={openInstallModal} indexData={indexData} />

      {/* Lines 01–09 — the sheet, rendered by the server component */}
      {children}

      <InstallModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  );
}

export default ClientContainer;
