// Keep scrollable controls in place when the buildless views replace their markup.
// Keys identify the actual control/document, so different views don't share offsets.
const positions = new Map();

export function rememberScrollPositions(root) {
  for (const element of root.querySelectorAll('[data-scroll-key]')) {
    positions.set(element.dataset.scrollKey, {left: element.scrollLeft, top: element.scrollTop});
  }
}

export function restoreScrollPositions(root) {
  for (const element of root.querySelectorAll('[data-scroll-key]')) {
    const position = positions.get(element.dataset.scrollKey);
    if (!position) continue;
    element.scrollLeft = position.left;
    element.scrollTop = position.top;
  }
}

export function focusSelectedClause(root) {
  const selected = root.querySelector('.clause-tab.selected');
  if (!selected) return;
  selected.focus({preventScroll: true});
  const row = selected.closest('[data-scroll-key]');
  if (!row || row.scrollWidth <= row.clientWidth) return;
  const itemBounds = selected.getBoundingClientRect();
  const rowBounds = row.getBoundingClientRect();
  // Reveal only a clipped edge inside this row, without scrolling the page.
  if (itemBounds.left < rowBounds.left) row.scrollLeft += itemBounds.left - rowBounds.left;
  else if (itemBounds.right > rowBounds.left + row.clientWidth) {
    row.scrollLeft += itemBounds.right - rowBounds.left - row.clientWidth;
  }
}
