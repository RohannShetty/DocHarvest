import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { Connectivity } from '../Connectivity';
import { Faq } from '../Faq';
import { Header } from '../Header';
import { Hero } from '../Hero';
import { InstallModal } from '../InstallModal';
import { Outputs } from '../Outputs';
import { ThemeProvider } from '../ThemeProvider';
import { WorkflowPaths } from '../WorkflowPaths';
import { INDEX_PROVENANCE, INDEX_ROWS } from './sheetFixtures';

/**
 * Every control that looks clickable must carry the keyboard ring: the square
 * amber `focus-visible` outline. The guard at the bottom keeps this suite honest
 * — a component with no pointer controls must fail rather than pass vacuously.
 */
function verifyFocusVisibleControls(container: HTMLElement, componentName: string): void {
  const controls = container.querySelectorAll('button, a[href], summary');
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
  it('Connectivity', () => {
    verifyFocusVisibleControls(render(<Connectivity />).container, 'Connectivity');
  });

  it('Faq', () => {
    verifyFocusVisibleControls(render(<Faq />).container, 'Faq');
  });

  it('Header', () => {
    verifyFocusVisibleControls(
      render(
        <ThemeProvider>
          <Header onOpenInstallModal={() => {}} />
        </ThemeProvider>,
      ).container,
      'Header',
    );
  });

  it('Hero', () => {
    verifyFocusVisibleControls(
      render(<Hero onOpenInstallModal={() => {}} indexData={indexData} />).container,
      'Hero',
    );
  });

  it('InstallModal', () => {
    verifyFocusVisibleControls(
      render(<InstallModal isOpen={true} onClose={() => {}} />).container,
      'InstallModal',
    );
  });

  it('WorkflowPaths', () => {
    verifyFocusVisibleControls(render(<WorkflowPaths />).container, 'WorkflowPaths');
  });
});

describe('focus-visible guard', () => {
  it('throws when a component renders no pointer controls', () => {
    const { container } = render(<Outputs />);
    expect(() => verifyFocusVisibleControls(container, 'Outputs')).toThrow(/guard against false positives/);
  });
});
