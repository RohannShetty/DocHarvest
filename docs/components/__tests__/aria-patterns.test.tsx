import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Connectivity } from '../Connectivity';
import { IndexSheet } from '../IndexSheet';
import { InstallModal } from '../InstallModal';
import { CONNECT_PATHS, FAQ_ITEMS } from '../../data/showcaseData';
import { Faq } from '../Faq';
import { INDEX_PROVENANCE, INDEX_ROWS } from './sheetFixtures';

afterEach(cleanup);

// ─── Connectivity: tablist over three integration routes ────────────────────

describe('Connectivity ARIA patterns', () => {
  it('renders one tab per route with the first selected', () => {
    render(<Connectivity />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(CONNECT_PATHS.length);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('pairs the visible panel with the selected tab', () => {
    render(<Connectivity />);
    const tab = screen.getAllByRole('tab')[0];
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    expect(tab).toHaveAttribute('aria-controls', panel.id);
  });

  it('moves through the tabs with the arrow, Home, and End keys', async () => {
    const user = userEvent.setup();
    render(<Connectivity />);
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[0]);
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveFocus();

    await user.keyboard('{End}');
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps only the selected tab in the tab order', () => {
    render(<Connectivity />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
  });
});

// ─── Faq: native disclosure with an accessible name ─────────────────────────

describe('Faq ARIA patterns', () => {
  it('renders one disclosure per question', () => {
    render(<Faq />);
    expect(screen.getAllByText(/./, { selector: 'summary span:first-child' })).toHaveLength(FAQ_ITEMS.length);
  });

  it('keeps the answer inside the same disclosure', () => {
    render(<Faq />);
    const details = document.querySelectorAll('details');
    expect(details).toHaveLength(FAQ_ITEMS.length);
    expect(details[0].textContent).toContain(FAQ_ITEMS[0].answer);
  });
});

// ─── IndexSheet: combobox over the row listbox ──────────────────────────────

describe('IndexSheet ARIA patterns', () => {
  it('wires the filter field to the row listbox', () => {
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    const field = screen.getByRole('combobox');
    expect(field).toHaveAttribute('aria-expanded', 'true');

    const listId = field.getAttribute('aria-controls');
    expect(listId).toBeTruthy();
    expect(document.getElementById(listId!)).toBeInTheDocument();
    expect(document.getElementById(listId!)).toHaveAttribute('role', 'listbox');
  });

  it('renders one option per row and marks the active one', () => {
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(INDEX_ROWS.length);

    const field = screen.getByRole('combobox');
    expect(field.getAttribute('aria-activedescendant')).toBe(options[0].id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('walks the options with ArrowDown and ArrowUp without leaving the field', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    const field = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');

    await user.click(field);
    await user.keyboard('{ArrowDown}');
    expect(field).toHaveAttribute('aria-activedescendant', options[1].id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(field).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', options[0].id);

    await user.keyboard('{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', options[0].id);
  });
});

// ─── InstallModal: tablist and tabpanel ─────────────────────────────────────

describe('InstallModal ARIA patterns', () => {
  it('pairs the visible tabpanel with the selected tab', () => {
    render(<InstallModal isOpen={true} onClose={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    const panel = screen.getByRole('tabpanel');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id);
    expect(tabs[0]).toHaveAttribute('aria-controls', panel.id);
  });

  it('navigates tabs with keyboard arrow keys and swaps tabpanel', async () => {
    const user = userEvent.setup();
    render(<InstallModal isOpen={true} onClose={() => {}} />);
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[0]);
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[1].id);

    await user.keyboard('{ArrowLeft}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[0].id);
  });
});
