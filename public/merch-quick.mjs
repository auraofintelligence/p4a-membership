const quantities = [10, 100, 1000];
const maximumCost = 100000;
const maximumMarkup = 1000;
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const number = new Intl.NumberFormat('en-AU');
const draft = { cost: '', markup: '0' };
const formatMoney = cents => cents == null ? '—' : money.format(cents / 100);

export function calculateQuickMerch(unitCost, markup) {
  if (unitCost == null || unitCost === '' || markup == null || markup === '') return null;
  const cost = Number(unitCost);
  const percent = Number(markup);
  if (!Number.isFinite(cost) || cost < 0 || cost > maximumCost || !Number.isFinite(percent) || percent < 0 || percent > maximumMarkup) return null;
  const costCents = Math.round(cost * 100);
  const basisPoints = Math.round(percent * 100);
  const priceCents = Math.round(costCents * (10000 + basisPoints) / 10000);
  const contributionCents = priceCents - costCents;
  return {
    priceCents,
    contributionCents,
    batches: quantities.map(quantity => ({
      quantity,
      productCost: costCents * quantity,
      sales: priceCents * quantity,
      contribution: contributionCents * quantity,
    })),
  };
}

export function merchQuickView({ heading, e }) {
  return `<div class="electorate-finance quick-finance" data-merch-quick>
    ${heading('Fundraising', 'Merch', 'Set a supplier cost and markup, then compare runs of 10, 100 and 1,000 items.', '<a class="button secondary" href="#finance/merch">Detailed merch budget</a>')}
    <section class="panel" aria-labelledby="merch-quick-title">
      <h2 id="merch-quick-title">Price a product</h2>
      <p>Try the purple anti-splash, anti-corruption lavender-scented piss mat or any other merch item.</p>
      <div class="finance-fields">
        <label class="field">Supplier cost per item (A$)<input type="number" inputmode="decimal" min="0" max="${maximumCost}" step="0.01" placeholder="Enter your quote" value="${e(draft.cost)}" data-merch-quick-cost></label>
        <label class="field quick-mix" for="merch-quick-markup">Markup on product cost <output for="merch-quick-markup" data-merch-quick-markup-label></output><input id="merch-quick-markup" type="range" min="0" max="${maximumMarkup}" step="1" value="${e(draft.markup)}" data-merch-quick-markup></label>
      </div>
      <dl class="finance-metrics" aria-live="polite">
        <div><dt>Selling price per item</dt><dd data-merch-quick-price>—</dd></div>
        <div><dt>Contribution per item</dt><dd data-merch-quick-contribution>—</dd></div>
      </dl>
      <p class="finance-context">Price = product cost × (1 + markup ÷ 100), rounded to cents. Contribution = sales − product cost.</p>
      <div class="finance-table-wrap" tabindex="0" role="region" aria-label="Merch run comparison">
        <table class="finance-table" aria-label="Merch run comparison in Australian dollars">
          <thead><tr><th scope="col">Items sold</th><th scope="col">Product cost</th><th scope="col">Sales</th><th scope="col">Contribution</th></tr></thead>
          <tbody>${quantities.map(quantity => `<tr data-merch-quick-batch><th scope="row">${number.format(quantity)}</th><td>—</td><td>—</td><td>—</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="finance-context">Amounts in AUD. Assumes every item sells. Excludes freight, selling costs and taxes.</p>
    </section>
  </div>`;
}

export function mountMerchQuick(root) {
  const page = root.querySelector('[data-merch-quick]');
  if (!page) return;
  const cost = page.querySelector('[data-merch-quick-cost]');
  const markup = page.querySelector('[data-merch-quick-markup]');
  const markupLabel = page.querySelector('[data-merch-quick-markup-label]');
  const price = page.querySelector('[data-merch-quick-price]');
  const contribution = page.querySelector('[data-merch-quick-contribution]');
  const rows = Array.from(page.querySelectorAll('[data-merch-quick-batch]'));
  const update = () => {
    draft.cost = cost.value;
    draft.markup = markup.value;
    markupLabel.textContent = `${markup.value}% markup`;
    markup.setAttribute('aria-valuetext', markupLabel.textContent);
    const result = cost.validity.valid && markup.validity.valid ? calculateQuickMerch(draft.cost, draft.markup) : null;
    price.textContent = formatMoney(result?.priceCents);
    contribution.textContent = formatMoney(result?.contributionCents);
    rows.forEach((row, index) => {
      const batch = result?.batches[index];
      row.cells[1].textContent = formatMoney(batch?.productCost);
      row.cells[2].textContent = formatMoney(batch?.sales);
      row.cells[3].textContent = formatMoney(batch?.contribution);
    });
  };
  cost.addEventListener('input', update);
  markup.addEventListener('input', update);
  update();
}
