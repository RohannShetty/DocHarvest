import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FaqSheet } from '../FaqSheet';
import { IndexSheet } from '../IndexSheet';
import { ManifestTree } from '../ManifestTree';
import { FAQ_ITEMS } from '../../data/showcaseData';
import { INDEX_PROVENANCE, INDEX_ROWS, MANIFEST_FIXTURE } from './sheetFixtures';

afterEach(cleanup);

// ─── FaqSheet: accordion with aria-expanded + aria-controls ───────────────────

describe('FaqSheet ARIA patterns', () => {
  it('renders one accordion button per FAQ item', () => {
    render(<FaqSheet />);
    expect(screen.getAllByRole('button')).toHaveLength(FAQ_ITEMS.length);
  });

  it('reflects open/closed state in aria-expanded', () => {
    render(<FaqSheet />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
  });

  it('gives every button an aria-controls pointing at an existing panel when open', () => {
    render(<FaqSheet />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const targetId = button.getAttribute('aria-controls');
      expect(targetId).toBeTruthy();
      expect(targetId!.length).toBeGreaterThan(0);
    });
    expect(document.getElementById(buttons[0].getAttribute('aria-controls')!)).toBeInTheDocument();
  });

  it('opens a closed panel and closes it again', async () => {
    const user = userEvent.setup();
    render(<FaqSheet />);
    const buttons = screen.getAllByRole('button');

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(buttons[1].getAttribute('aria-controls')!)).toBeInTheDocument();

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  });
});

// ─── ManifestTree: four plates as a tab set ──────────────────────────────────

describe('ManifestTree ARIA patterns', () => {
  it('renders four plates with the first selected', () => {
    render(<ManifestTree manifest={MANIFEST_FIXTURE} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[3]).toHaveAttribute('aria-selected', 'false');
  });

  it('pairs the visible panel with the selected plate', () => {
    render(<ManifestTree manifest={MANIFEST_FIXTURE} />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', screen.getAllByRole('tab')[0].id);
  });

  it('moving to another plate selects it and swaps the panel', async () => {
    const user = userEvent.setup();
    render(<ManifestTree manifest={MANIFEST_FIXTURE} />);
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[1].id);
    expect(screen.getByText(/Markdown capture of/)).toBeInTheDocument();
  });

  it('states the absence when the capture has no RAG export', async () => {
    const user = userEvent.setup();
    render(<ManifestTree manifest={MANIFEST_FIXTURE} />);
    await user.click(screen.getAllByRole('tab')[3]);
    expect(screen.getByText(/No RAG export in this capture — run capture with --rag/)).toBeInTheDocument();
  });
});

// ─── IndexSheet: combobox over the row listbox ────────────────────────────────

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
