import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IndexSheet } from '../IndexSheet';
import { INDEX_PROVENANCE, INDEX_ROWS } from './sheetFixtures';

afterEach(cleanup);

/**
 * The signature interaction's contract: typing narrows the sheet to the lines
 * that actually contain the term, every rendered row contains it, the count line
 * cannot disagree with the rows on screen, and an unmatched query says so.
 */
describe('IndexSheet filtering', () => {
  it('narrows to the rows containing the typed term and marks it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />,
    );

    await user.type(screen.getByRole('combobox'), 'oauth');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    for (const option of options) {
      expect(option.textContent?.toLowerCase()).toContain('oauth');
    }

    const marks = Array.from(container.querySelectorAll('mark'));
    expect(marks).toHaveLength(2);
    marks.forEach((mark) => expect(mark.textContent).toBe('OAuth'));
  });

  it('keeps the count line equal to the number of rendered rows', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);

    const countLine = () => screen.getByTestId('index-count');
    const renderedCount = () => Number(countLine().textContent?.match(/^(\d+)/)?.[1]);

    expect(renderedCount()).toBe(screen.getAllByRole('option').length);

    await user.type(screen.getByRole('combobox'), 'oauth');
    expect(renderedCount()).toBe(screen.getAllByRole('option').length);
    expect(renderedCount()).toBe(2);
  });

  it('throttles the screen-reader live region behind a 300ms pause', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);

    const live = () => screen.getByTestId('index-live');
    expect(live()).toHaveAttribute('aria-live', 'polite');
    // Initial live text matches the full count
    expect(live().textContent).toMatch(/^3 of 3 rows/);

    await user.type(screen.getByRole('combobox'), 'oauth');
    // Visual count updates immediately…
    expect(screen.getByTestId('index-count').textContent).toMatch(/^2 of 3 rows/);
    // …but the live region still holds the stale value until the debounce fires
    expect(live().textContent).toMatch(/^3 of 3 rows/);
  });

  it('clears the query on Escape and blurs on second Escape', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    const field = screen.getByRole('combobox');

    await user.type(field, 'oauth');
    expect(field).toHaveValue('oauth');

    await user.keyboard('{Escape}');
    expect(field).toHaveValue('');
    expect(field).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(field).not.toHaveFocus();
  });

  it('focuses the filter from outside via the global / shortcut', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);
    const field = screen.getByRole('combobox');
    expect(field).not.toHaveFocus();

    await user.keyboard('/');
    expect(field).toHaveFocus();
  });

  it('shows the empty state when no line contains the query', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);

    await user.type(screen.getByRole('combobox'), 'zzzz');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText(/No line contains/)).toHaveTextContent(
      /The index holds every emitted line, not a summary of them\./,
    );
  });

  it('copies path:line for the active row on Enter', async () => {
    const user = userEvent.setup();
    render(<IndexSheet rows={INDEX_ROWS} mode="full" provenance={INDEX_PROVENANCE} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Enter}');
    expect(await navigator.clipboard.readText()).toBe('pages/docs/latest/providers.md:214');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(await navigator.clipboard.readText()).toBe('pages/docs/latest/settings.md:12');
  });
});
