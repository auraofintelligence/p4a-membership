const volumeLimits = { min: 10, max: 10000 };
const volumePresets = [10, 100, 1000, 10000];
const options = ['A', 'B', 'C'];
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const number = new Intl.NumberFormat('en-AU');
const draft = [{ id: 1, name: 'Purple anti-splash, anti-corruption lavender-scented piss mat', units: 100, profits: ['2', '5', '10'] }];
let nextProductId = 2;

const formatMoney = cents => cents == null ? '—' : money.format(cents / 100);

export function calculateMonthlyMerch(products) {
  const totals = options.map(() => ({ cents: 0, included: 0 }));
  let totalUnits = 0;
  const monthly = products.map(product => {
    const { units } = product;
    if (!Number.isInteger(units) || units < volumeLimits.min || units > volumeLimits.max) return options.map(() => null);
    totalUnits += units;
    return options.map((_, index) => {
      const profit = product.profits[index];
      if (profit == null || String(profit).trim() === '') return null;
      const value = Number(profit);
      const perItemCents = Math.round(value * 100);
      const monthlyCents = perItemCents * units;
      const total = totals[index];
      if (value < 0 || !Number.isSafeInteger(monthlyCents + total.cents)) return null;
      total.cents += monthlyCents;
      total.included++;
      return monthlyCents;
    });
  });
  return { totalUnits, monthly, totals };
}

function productEditor(product, e) {
  const { id } = product;
  return `<section class="panel merch-product" data-merch-product="${id}" aria-label="${e(product.name.trim() || 'Unnamed product')}">
    <div class="merch-product-heading">
      <label class="field">Product name<input type="text" maxlength="100" placeholder="Name this product" value="${e(product.name)}" data-merch-name></label>
      <button class="button secondary" type="button" data-merch-remove>Remove<span class="sr-only" data-merch-remove-label> ${e(product.name.trim() || 'unnamed product')}</span></button>
    </div>
    <div class="merch-product-controls">
      <div class="merch-options">
        ${options.map((option, index) => `<div>
          <label class="field" for="merch-profit-${id}-${index}">Option ${option}<span>Profit per item (A$)</span></label>
          <input id="merch-profit-${id}-${index}" type="number" inputmode="decimal" min="0" step="0.01" placeholder="—" value="${e(product.profits[index])}" data-merch-profit="${index}">
          <output for="merch-profit-${id}-${index} merch-units-${id}" aria-live="off" data-merch-monthly="${index}">—</output><small>per month</small>
        </div>`).join('')}
      </div>
      <div class="merch-volume">
        <div class="merch-volume-heading">
          <label class="field" for="merch-units-${id}">Items sold per month</label>
          <input id="merch-units-${id}" type="number" inputmode="numeric" min="${volumeLimits.min}" max="${volumeLimits.max}" step="1" value="${product.units}" data-merch-units>
        </div>
        <label class="sr-only" for="merch-volume-${id}">Monthly sales volume</label>
        <input id="merch-volume-${id}" type="range" min="${volumeLimits.min}" max="${volumeLimits.max}" step="1" value="${product.units}" data-merch-volume>
        <div class="merch-presets" aria-label="Monthly sales presets">
          ${volumePresets.map(units => `<button class="button secondary" type="button" data-merch-preset="${units}" aria-pressed="${product.units === units}">${number.format(units)}</button>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

export function merchQuickView({ heading, e }) {
  return `<div class="electorate-finance quick-finance merch-planner" data-merch-quick>
    ${heading('Fundraising', 'Merch', 'Compare three profit-per-item options and see what your products could earn each month.', '<button class="button" type="button" data-merch-add>Add product</button>')}
    <section class="panel" aria-labelledby="merch-summary-title">
      <h2 id="merch-summary-title">Monthly profit across products</h2>
      <p>Profit per item × items sold per month. The starter figures are examples you can edit.</p>
      <dl class="finance-metrics merch-totals" aria-live="polite" aria-atomic="true">
        ${options.map((option, index) => `<div><dt>Option ${option}</dt><dd data-merch-total="${index}">—</dd><small data-merch-total-count="${index}"></small></div>`).join('')}
      </dl>
    </section>
    <div data-merch-products>${draft.map(product => productEditor(product, e)).join('')}</div>
    <p class="finance-context" data-merch-empty ${draft.length ? 'hidden' : ''}>Add a product to start a monthly comparison.</p>
  </div>`;
}

export function mountMerchQuick(root, { e }) {
  const page = root.querySelector('[data-merch-quick]');
  if (!page) return;
  const list = page.querySelector('[data-merch-products]');
  const add = page.querySelector('[data-merch-add]');
  const empty = page.querySelector('[data-merch-empty]');

  function refresh() {
    const { totalUnits, monthly, totals } = calculateMonthlyMerch(draft);
    draft.forEach((product, index) => {
      const card = list.querySelector(`[data-merch-product="${product.id}"]`);
      card.querySelectorAll('[data-merch-monthly]').forEach((output, option) => {
        const formatted = formatMoney(monthly[index][option]);
        if (output.textContent !== formatted) output.textContent = formatted;
      });
    });
    totals.forEach(({ cents, included }, index) => {
      const amount = page.querySelector(`[data-merch-total="${index}"]`);
      const label = page.querySelector(`[data-merch-total-count="${index}"]`);
      const formatted = formatMoney(included ? cents : null);
      const context = included === draft.length && included ? `${number.format(totalUnits)} items per month` : `${included} of ${draft.length} products with profit entered`;
      if (amount.textContent !== formatted) amount.textContent = formatted;
      if (label.textContent !== context) label.textContent = context;
    });
    empty.hidden = draft.length > 0;
  }

  function setUnits(card, product, units, source) {
    product.units = units;
    const slider = card.querySelector('[data-merch-volume]');
    const exact = card.querySelector('[data-merch-units]');
    if (source !== slider) slider.value = units;
    if (source !== exact) exact.value = units;
    card.querySelectorAll('[data-merch-preset]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.merchPreset) === units)));
    refresh();
  }

  list.addEventListener('input', ({ target }) => {
    const card = target.closest('[data-merch-product]');
    const product = draft.find(item => item.id === Number(card?.dataset.merchProduct));
    if (!product) return;
    if (target.matches('[data-merch-name]')) {
      product.name = target.value;
      card.setAttribute('aria-label', product.name.trim() || 'Unnamed product');
      card.querySelector('[data-merch-remove-label]').textContent = ` ${product.name.trim() || 'unnamed product'}`;
    } else if (target.matches('[data-merch-units], [data-merch-volume]')) {
      if (target.value && target.validity.valid) setUnits(card, product, target.valueAsNumber, target);
    } else if (target.matches('[data-merch-profit]')) {
      product.profits[Number(target.dataset.merchProfit)] = target.validity.valid ? target.value : '';
      refresh();
    }
  });

  list.addEventListener('change', ({ target }) => {
    if (!target.matches('[data-merch-units]') || (target.value && target.validity.valid)) return;
    const id = Number(target.closest('[data-merch-product]').dataset.merchProduct);
    target.value = draft.find(product => product.id === id).units;
  });

  list.addEventListener('click', ({ target }) => {
    const button = target.closest('button');
    const card = button?.closest('[data-merch-product]');
    if (!card) return;
    const index = draft.findIndex(product => product.id === Number(card.dataset.merchProduct));
    if (button.matches('[data-merch-preset]')) setUnits(card, draft[index], Number(button.dataset.merchPreset));
    if (button.matches('[data-merch-remove]')) {
      const next = card.nextElementSibling || card.previousElementSibling;
      draft.splice(index, 1);
      card.remove();
      (next?.querySelector('[data-merch-name]') || add).focus();
      refresh();
    }
  });

  add.addEventListener('click', () => {
    const product = { id: nextProductId++, name: '', units: 100, profits: ['', '', ''] };
    draft.push(product);
    list.insertAdjacentHTML('beforeend', productEditor(product, e));
    list.lastElementChild.querySelector('[data-merch-name]').focus();
    refresh();
  });
  refresh();
}
