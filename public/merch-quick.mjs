const maxUnits = 10000;
const maxBands = 10;
const presets = [0, 10, 100, 1000, 10000];
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const number = new Intl.NumberFormat('en-AU');
let nextBandId = 6;
let nextProductId = 2;
const bands = [2, 5, 10, 15, 25].map((profit, index) => ({
  id: index + 1,
  profit: String(profit),
  units: profit === 5 ? 100 : 0,
  useProducts: false,
  products: profit === 5 ? [{ id: 1, name: 'Purple anti-splash, anti-corruption lavender-scented piss mat', units: 100 }] : [],
}));

const formatMoney = cents => cents == null ? '—' : money.format(cents / 100);
const validUnits = (units, minimum = 0) => Number.isInteger(units) && (units === 0 || units >= minimum) && units <= maxUnits;

export function calculateMerchBands(input = []) {
  let totalUnits = 0;
  let totalCents = 0;
  let included = 0;
  const results = input.map(({ profit, units, useProducts, products = [] }) => {
    const productUnits = products.reduce((total, product) => total + (validUnits(product.units) ? product.units : 0), 0);
    const volume = useProducts ? productUnits : validUnits(units, 10) ? units : 0;
    totalUnits += volume;
    const amount = typeof profit === 'number' || typeof profit === 'string' && profit.trim() ? Number(profit) : NaN;
    const cents = Math.round(amount * 100);
    const monthlyCents = cents * volume;
    if (amount >= 0 && Number.isSafeInteger(cents) && Number.isSafeInteger(totalCents + monthlyCents)) {
      totalCents += monthlyCents;
      included++;
      return { units: volume, productUnits, monthlyCents };
    }
    return { units: volume, productUnits, monthlyCents: null };
  });
  return { bands: results, totalUnits, totalCents, included };
}

function productEditor(product, e) {
  return `<div class="merch-band-product-row" data-band-product="${product.id}">
    <label class="field">Product name<input type="text" maxlength="100" value="${e(product.name)}" placeholder="Name this product" data-band-product-name></label>
    <label class="field">Monthly sales<input type="number" inputmode="numeric" min="0" max="${maxUnits}" step="1" value="${product.units}" data-band-product-units></label>
    <button class="button secondary" type="button" data-band-product-remove>Remove<span class="sr-only" data-band-product-remove-label> ${e(product.name.trim() || 'unnamed product')}</span></button>
  </div>`;
}

function bandEditor(band, e) {
  const { id, useProducts } = band;
  return `<section class="panel merch-band" data-merch-band="${id}" aria-labelledby="merch-band-${id}">
    <div class="merch-band-heading">
      <h3 id="merch-band-${id}" data-band-heading>Band</h3>
      <button type="button" class="button secondary" data-band-remove>Remove band</button>
    </div>
    <div class="merch-band-controls">
      <label class="field">Profit per item (A$)<input type="number" inputmode="decimal" min="0" step="0.01" placeholder="Enter amount" value="${e(band.profit)}" data-band-profit></label>
      <div class="merch-volume">
        <div class="merch-volume-heading">
          <label class="field" for="merch-band-units-${id}">Band sales per month</label>
          <input id="merch-band-units-${id}" type="number" inputmode="numeric" min="0" max="${maxUnits}" step="1" value="${band.units}" data-band-units${useProducts ? ' disabled' : ''}>
        </div>
        <input type="range" min="0" max="${maxUnits}" step="1" value="${band.units}" aria-label="Adjust monthly band sales" data-band-volume${useProducts ? ' disabled' : ''}>
        <div class="merch-presets" role="group" aria-label="Monthly sales presets">
          ${presets.map(units => `<button class="button secondary" type="button" data-band-preset="${units}" aria-pressed="${band.units === units}"${useProducts ? ' disabled' : ''}>${number.format(units)}</button>`).join('')}
        </div>
      </div>
      <div class="merch-band-result"><span>Monthly profit</span><output data-band-result aria-live="off">—</output><small data-band-sales></small></div>
    </div>
    <details class="merch-band-products">
      <summary>Product breakdown <span data-band-product-count></span></summary>
      <label class="finance-check"><input type="checkbox" data-band-mode${useProducts ? ' checked' : ''}> Use the sum of product sales for this band</label>
      <div data-band-products>${band.products.map(product => productEditor(product, e)).join('')}</div>
      <p class="finance-context" data-band-product-total></p>
      <button class="button secondary" type="button" data-band-product-add>Add product</button>
    </details>
  </section>`;
}

export function merchQuickView({ heading, e }) {
  return `<div class="electorate-finance quick-finance merch-planner" data-merch-quick>
    ${heading('Fundraising', 'Merch', 'Play with different dollar profits and monthly sales across your product range.', '<button class="button" type="button" data-merch-add>Add profit band</button>')}
    <section class="panel" aria-labelledby="merch-summary-title">
      <h2 id="merch-summary-title">Across all bands</h2>
      <p>Profit per item × units sold. The starter bands and volumes are examples you can edit.</p>
      <dl class="finance-metrics" aria-live="polite" aria-atomic="true">
        <div><dt>Monthly profit</dt><dd data-merch-profit>—</dd><small data-merch-profit-note hidden></small></div>
        <div><dt>Units sold per month</dt><dd data-merch-units>0</dd></div>
      </dl>
    </section>
    <div data-merch-bands>${bands.map(band => bandEditor(band, e)).join('')}</div>
    <p class="finance-context" data-merch-empty${bands.length ? ' hidden' : ''}>Add a profit band to start a monthly estimate.</p>
  </div>`;
}

export function mountMerchQuick(root, { e }) {
  const page = root.querySelector('[data-merch-quick]');
  if (!page) return;
  const list = page.querySelector('[data-merch-bands]');
  const add = page.querySelector('[data-merch-add]');
  const empty = page.querySelector('[data-merch-empty]');
  const totalProfit = page.querySelector('[data-merch-profit]');
  const totalUnits = page.querySelector('[data-merch-units]');
  const totalNote = page.querySelector('[data-merch-profit-note]');

  function refresh() {
    const result = calculateMerchBands(bands);
    bands.forEach((band, index) => {
      const card = list.children[index];
      const { units, productUnits, monthlyCents } = result.bands[index];
      card.querySelector('[data-band-heading]').textContent = `Band ${index + 1}`;
      card.querySelector('[data-band-remove]').setAttribute('aria-label', `Remove band ${index + 1}`);
      card.querySelector('[data-band-result]').textContent = formatMoney(monthlyCents);
      card.querySelector('[data-band-sales]').textContent = `${number.format(units)} items${band.useProducts ? ' from products' : ' per month'}`;
      card.querySelector('[data-band-product-count]').textContent = band.products.length ? `(${number.format(band.products.length)})` : '';
      card.querySelector('[data-band-product-total]').textContent = `${number.format(productUnits)} monthly product sales${band.useProducts ? ' used in the band' : ''}.`;
      for (const input of card.querySelectorAll('[data-band-units], [data-band-volume], [data-band-preset]')) input.disabled = band.useProducts;
      for (const button of card.querySelectorAll('[data-band-preset]')) button.setAttribute('aria-pressed', String(Number(button.dataset.bandPreset) === band.units));
    });
    totalProfit.textContent = formatMoney(result.included ? result.totalCents : null);
    totalUnits.textContent = number.format(result.totalUnits);
    totalNote.hidden = !result.included || result.included === bands.length;
    totalNote.textContent = `${result.included} of ${bands.length} bands with profit entered`;
    add.disabled = bands.length >= maxBands;
    empty.hidden = bands.length > 0;
  }

  function setBandUnits(card, band, units, source) {
    band.units = units;
    const exact = card.querySelector('[data-band-units]');
    const slider = card.querySelector('[data-band-volume]');
    if (source !== exact) exact.value = units;
    slider.value = units;
  }

  list.addEventListener('input', ({ target }) => {
    const card = target.closest('[data-merch-band]');
    const band = bands.find(item => item.id === Number(card?.dataset.merchBand));
    if (!band) return;
    if (target.matches('[data-band-profit]')) band.profit = target.validity.valid ? target.value : '';
    else if (target.matches('[data-band-units]') && validUnits(target.valueAsNumber, 10)) setBandUnits(card, band, target.valueAsNumber, target);
    else if (target.matches('[data-band-volume]')) setBandUnits(card, band, target.valueAsNumber === 0 ? 0 : Math.max(10, target.valueAsNumber));
    else if (target.matches('[data-band-mode]')) band.useProducts = target.checked;
    else {
      const row = target.closest('[data-band-product]');
      const product = band.products.find(item => item.id === Number(row?.dataset.bandProduct));
      if (!product) return;
      if (target.matches('[data-band-product-name]')) {
        product.name = target.value;
        row.querySelector('[data-band-product-remove-label]').textContent = ` ${product.name.trim() || 'unnamed product'}`;
      } else if (target.matches('[data-band-product-units]') && validUnits(target.valueAsNumber)) product.units = target.valueAsNumber;
    }
    refresh();
  });

  list.addEventListener('change', ({ target }) => {
    const card = target.closest('[data-merch-band]');
    const band = bands.find(item => item.id === Number(card?.dataset.merchBand));
    if (!band) return;
    if (target.matches('[data-band-units]') && !validUnits(target.valueAsNumber, 10)) target.value = band.units;
    if (target.matches('[data-band-product-units]') && !validUnits(target.valueAsNumber)) {
      const product = band.products.find(item => item.id === Number(target.closest('[data-band-product]').dataset.bandProduct));
      target.value = product.units;
    }
  });

  list.addEventListener('click', ({ target }) => {
    const button = target.closest('button');
    const card = button?.closest('[data-merch-band]');
    if (!card) return;
    const index = bands.findIndex(band => band.id === Number(card.dataset.merchBand));
    const band = bands[index];
    let focus;
    if (button.matches('[data-band-preset]')) setBandUnits(card, band, Number(button.dataset.bandPreset));
    else if (button.matches('[data-band-remove]')) {
      const next = card.nextElementSibling || card.previousElementSibling;
      bands.splice(index, 1);
      card.remove();
      focus = next?.querySelector('[data-band-profit]') || add;
    } else if (button.matches('[data-band-product-add]')) {
      const product = { id: nextProductId++, name: '', units: 0 };
      const products = card.querySelector('[data-band-products]');
      band.products.push(product);
      products.insertAdjacentHTML('beforeend', productEditor(product, e));
      focus = products.lastElementChild.querySelector('[data-band-product-name]');
    } else if (button.matches('[data-band-product-remove]')) {
      const row = button.closest('[data-band-product]');
      const next = row.nextElementSibling || row.previousElementSibling;
      band.products.splice(band.products.findIndex(product => product.id === Number(row.dataset.bandProduct)), 1);
      row.remove();
      focus = next?.querySelector('[data-band-product-name]') || card.querySelector('[data-band-product-add]');
    }
    refresh();
    focus?.focus();
  });

  add.addEventListener('click', () => {
    if (bands.length >= maxBands) return;
    const band = { id: nextBandId++, profit: '', units: 0, useProducts: false, products: [] };
    bands.push(band);
    list.insertAdjacentHTML('beforeend', bandEditor(band, e));
    refresh();
    list.lastElementChild.querySelector('[data-band-profit]').focus();
  });
  refresh();
}
