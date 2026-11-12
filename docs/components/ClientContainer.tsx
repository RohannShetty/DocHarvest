'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { InstallModal } from './InstallModal';
import type { IndexData } from '../lib/indexData';

interface ClientContainerProps {
  indexData: IndexData;
  children: React.ReactNode;
}

export function ClientContainer({ indexData, children }: ClientContainerProps) {
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const openInstallModal = () => setInstallModalOpen(true);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenInstallModal={openInstallModal} />
      <Hero onOpenInstallModal={openInstallModal} indexData={indexData} />
      {children}
      <InstallModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  );
}

export default ClientContainer;
