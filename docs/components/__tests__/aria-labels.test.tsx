import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { Header } from '@/components/Header';
import { IndexSheet } from '@/components/IndexSheet';
import { InstallModal } from '@/components/InstallModal';
import { Masthead } from '@/components/Masthead';
import { Releases } from '@/components/Releases';
import { ThemeProvider } from '@/components/ThemeProvider';
import { GITHUB_FIXTURE, INDEX_PROVENANCE, INDEX_ROWS } from './sheetFixtures';

afterEach(cleanup);

const noop = () => {};
const indexData = { provenance: INDEX_PROVENANCE, rows: INDEX_ROWS };

describe('Header aria-labels', () => {
  it('names the theme toggle for the theme it switches to', () => {
    render(
      <ThemeProvider>
        <Header stars={128} onOpenInstallModal={noop} />
      </ThemeProvider>,
    );
    const themeButton = screen.getByTitle('Switch to Light Mode');
    expect(themeButton).toHaveAttribute('aria-label', 'Switch to Light Mode');
  });

  it('gives the section nav an accessible name', () => {
    render(
      <ThemeProvider>
        <Header stars={128} onOpenInstallModal={noop} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
  });
});

describe('Masthead aria-labels', () => {
  it('labels the copy action for the capture command', () => {
    render(<Masthead onOpenInstallModal={noop} indexData={indexData} />);
    expect(screen.getByLabelText('Copy capture command')).toBeInTheDocument();
  });

  it('names the primary action', () => {
    render(<Masthead onOpenInstallModal={noop} indexData={indexData} />);
    expect(screen.getByRole('button', { name: 'Install in 30 seconds' })).toBeInTheDocument();
  });
});

describe('IndexSheet aria-labels', () => {
  it('labels the filter field', () => {
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    expect(screen.getByLabelText('Filter the index')).toBeInTheDocument();
  });

  it('labels the row listbox', () => {
    render(<IndexSheet rows={INDEX_ROWS} mode="specimen" provenance={INDEX_PROVENANCE} />);
    expect(screen.getByRole('listbox', { name: 'Index rows' })).toBeInTheDocument();
  });
});

describe('InstallModal aria-labels', () => {
  it('labels the close control', () => {
    render(<InstallModal isOpen={true} onClose={noop} />);
    const buttons = screen.getAllByRole('button');
    const iconOnly = buttons.find((button) => !button.textContent?.trim());
    expect(iconOnly).toHaveAttribute('aria-label', 'Close');
  });

  it('labels the copy command control', () => {
    render(<InstallModal isOpen={true} onClose={noop} />);
    expect(screen.getByLabelText('Copy install command')).toBeInTheDocument();
  });

  it('names the dialog', () => {
    render(<InstallModal isOpen={true} onClose={noop} />);
    expect(screen.getByRole('dialog', { name: /Install DocHarvest/ })).toBeInTheDocument();
  });
});

describe('Releases aria-labels', () => {
  it('labels the verification command copy', () => {
    render(<Releases data={GITHUB_FIXTURE} />);
    expect(screen.getByLabelText('Copy verification command')).toBeInTheDocument();
  });

  it('labels every commit hash copy', () => {
    render(<Releases data={GITHUB_FIXTURE} />);
    const shaButtons = screen.getAllByLabelText('Copy commit hash');
    expect(shaButtons.length).toBeGreaterThan(0);
  });
});
