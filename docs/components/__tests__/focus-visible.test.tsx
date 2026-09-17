import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AgentTools } from '../AgentTools';
import { Colophon } from '../Colophon';
import { ComparisonTable } from '../ComparisonTable';
import { FaqSheet } from '../FaqSheet';
import { Header } from '../Header';
import { InstallModal } from '../InstallModal';
import { ManifestTree } from '../ManifestTree';
import { Masthead } from '../Masthead';
import { ProviderTable } from '../ProviderTable';
import { Releases } from '../Releases';
import { ThemeProvider } from '../ThemeProvider';
import { GITHUB_FIXTURE, INDEX_PROVENANCE, INDEX_ROWS, MANIFEST_FIXTURE } from './sheetFixtures';

/**
 * Every control that looks clickable must carry the keyboard ring: the square
 * amber `focus-visible` outline. The guard at the bottom keeps this suite honest
 * — a component with no pointer controls must fail rather than pass vacuously.
 */
function verifyFocusVisibleControls(container: HTMLElement, componentName: string): void {
  const controls = container.querySelectorAll('button, a[href]');
  let cursorControls = 0;

  controls.forEach((control, index) => {
    const className = control.getAttribute('class') || '';
    if (!className.includes('cursor-pointer')) return;

    cursorControls++;

    expect(
      className,
      `${componentName}: control[${index}] has cursor-pointer but is missing focus-visible:outline-2`,
    ).toContain('focus-visible:outline-2');
    expect(
      className,
      `${componentName}: control[${index}] has cursor-pointer but is missing focus-visible:outline-match`,
    ).toContain('focus-visible:outline-match');
  });

  if (cursorControls === 0) {
    throw new Error(
      `${componentName}: expected at least one control with cursor-pointer to verify — guard against false positives`,
    );
  }
}

const indexData = { provenance: INDEX_PROVENANCE, rows: INDEX_ROWS };

describe('focus-visible outline on every pointer control', () => {
  it('AgentTools', () => {
    verifyFocusVisibleControls(render(<AgentTools />).container, 'AgentTools');
  });

  it('Colophon', () => {
    verifyFocusVisibleControls(render(<Colophon />).container, 'Colophon');
  });

  it('FaqSheet', () => {
    verifyFocusVisibleControls(render(<FaqSheet />).container, 'FaqSheet');
  });

  it('Header', () => {
    verifyFocusVisibleControls(
      render(
        <ThemeProvider>
          <Header stars={128} onOpenInstallModal={() => {}} />
        </ThemeProvider>,
      ).container,
      'Header',
    );
  });

  it('InstallModal', () => {
    verifyFocusVisibleControls(
      render(<InstallModal isOpen={true} onClose={() => {}} />).container,
      'InstallModal',
    );
  });

  it('ManifestTree', () => {
    verifyFocusVisibleControls(
      render(<ManifestTree manifest={MANIFEST_FIXTURE} />).container,
      'ManifestTree',
    );
  });

  it('Masthead', () => {
    verifyFocusVisibleControls(
      render(<Masthead onOpenInstallModal={() => {}} indexData={indexData} />).container,
      'Masthead',
    );
  });

  it('ProviderTable', () => {
    verifyFocusVisibleControls(render(<ProviderTable />).container, 'ProviderTable');
  });

  it('Releases', () => {
    verifyFocusVisibleControls(render(<Releases data={GITHUB_FIXTURE} />).container, 'Releases');
  });
});

describe('focus-visible guard', () => {
  it('throws when a component renders no pointer controls', () => {
    const { container } = render(<ComparisonTable />);
    expect(() => verifyFocusVisibleControls(container, 'ComparisonTable')).toThrow(
      /guard against false positives/,
    );
  });
});
