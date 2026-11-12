const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const count = new Intl.NumberFormat('en-AU');
const limit = 1_000_000;

const quoteFields = [
  ['price', 'Retail price per unit (A$)', 'money'],
  ['sold', 'Units you expect to sell', 'count'],
  ['unitsPerOrder', 'Units per transaction', 'positive'],
  ['batchUnits', 'Units ordered from supplier', 'positive', 'batch'],
  ['manufacture', 'Supplier cost per unit (A$)', 'money'],
  ['inbound', 'Inbound freight and import costs (A$)', 'money'],
  ['packaging', 'Packaging per unit sold (A$)', 'money'],
  ['deliveryCharged', 'Delivery paid by customer per order (A$)', 'money', 'online'],
  ['deliveryPaid', 'Delivery and fulfilment paid per order (A$)', 'money', 'online'],
  ['processorRate', 'Payment processing rate (%)', 'percent'],
  ['processorFixed', 'Fixed payment fee per transaction (A$)', 'money'],
  ['refundRate', 'Orders expected to receive a full refund (%)', 'percent'],
  ['refundCost', 'Handling and postage per refunded order (A$)', 'money'],
  ['stall', 'Stall hire and market fees (A$)', 'money', 'market'],
  ['insurance', 'Insurance cost for this run (A$)', 'money'],
  ['paidHours', 'Paid work hours for this run', 'decimal'],
  ['hourly', 'Full cost per paid hour (A$)', 'money'],
  ['otherFixed', 'Other selling and setup costs (A$)', 'money'],
  ['prepaid', 'Other cash paid before the first payout (A$)', 'money'],
  ['target', 'Cash surplus target (A$)', 'money'],
];

function applicable(channel, mode) {
  return quoteFields.filter(([, , , condition]) => !condition || condition === channel || condition === mode);
}

function readNumber(raw, type) {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > (type === 'percent' ? 100 : limit)) return null;
  if ((type === 'count' || type === 'positive') && !Number.isInteger(value)) return null;
  if (type === 'positive' && value === 0) return null;
  return type === 'money' ? Math.round(value * 100) : value;
}

function lowestValue(max, clearsTarget) {
  if (!clearsTarget(max)) return null;
  let left = 0;
  let right = max;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (clearsTarget(mid)) right = mid;
    else left = mid + 1;
  }
  return left;
}

/**
 * A quote-backed cash scenario for one channel. Currency results are cents.
 * Assumptions are explicit: all units from a batch are paid for during the run,
 * returned products have no resale value, and GST is reserved from sales proceeds.
 */
export function calculateMerch(raw, channel) {
  const mode = raw.stockMode;
  if (!['online', 'market'].includes(channel) || !['batch', 'on-demand'].includes(mode)) {
    return { complete: false, message: 'Choose how you’ll buy stock.' };
  }
  if (!['taxable', 'no-gst'].includes(raw.gst)) {
    return { complete: false, message: 'Choose how GST applies to these sales.' };
  }

  const values = {};
  for (const [key, label, type] of applicable(channel, mode)) {
    const value = readNumber(raw[key], type);
    if (value === null) return { complete: false, message: `Enter a valid value for ${label.toLowerCase()}.` };
    values[key] = value;
  }
  const {
    sold, unitsPerOrder, batchUnits, price, manufacture, inbound, packaging, processorRate,
    processorFixed, refundRate, refundCost, insurance, paidHours, hourly, otherFixed, prepaid, target,
    deliveryCharged = 0, deliveryPaid = 0, stall = 0,
  } = values;
  if (mode === 'batch' && sold > batchUnits) {
    return { complete: false, message: 'Units sold must fit within the stock order.' };
  }

  const batchPurchase = mode === 'batch' ? batchUnits * manufacture + inbound : 0;
  const landedUnit = mode === 'batch' ? batchPurchase / batchUnits : manufacture + inbound;
  const fixedCost = stall + insurance + Math.round(paidHours * hourly) + otherFixed;
  const salesRetained = 1 - refundRate / 100;
  const gstShare = raw.gst === 'taxable' ? 1 / 11 : 0;

  function project(quantity, unitPrice) {
    const transactions = Math.ceil(quantity / unitsPerOrder);
    const goodsRevenue = quantity * unitPrice;
    const deliveryRevenue = transactions * deliveryCharged;
    const gross = goodsRevenue + deliveryRevenue;
    const refunds = gross * (1 - salesRetained);
    const netSales = gross - refunds;
    const gstReserved = netSales * gstShare;
    const fees = gross * processorRate / 100 + transactions * processorFixed;
    const packagingCosts = quantity * packaging;
    const deliveryCosts = transactions * deliveryPaid;
    const returnsCosts = transactions * refundRate / 100 * refundCost;
    const stockCost = quantity * landedUnit;
    const stockPurchased = mode === 'batch' ? batchPurchase : stockCost;
    const contribution = netSales - gstReserved - fees - packagingCosts - deliveryCosts - returnsCosts - stockCost;
    const margin = contribution - fixedCost;
    const cash = margin - (stockPurchased - stockCost);
    return { transactions, goodsRevenue, deliveryRevenue, gross, refunds, netSales, gstReserved, fees, packagingCosts, deliveryCosts, returnsCosts, stockCost, stockPurchased, contribution, margin, cash };
  }

  const result = project(sold, price);
  const otherCosts = fixedCost + result.packagingCosts + result.deliveryCosts + result.returnsCosts
    + (mode === 'on-demand' ? result.stockPurchased : 0);
  if (prepaid > Math.round(otherCosts)) {
    return { complete: false, message: 'Other cash paid before the first payout must already be included in the other quoted costs.' };
  }
  const proceedsSlope = salesRetained * (1 - gstShare) - processorRate / 100;
  const minimumPrice = cashTarget => {
    if (!sold) return null;
    if (project(sold, 0).cash >= cashTarget) return 0;
    if (proceedsSlope <= 0) return null;
    return lowestValue(limit * 100, cents => project(sold, cents).cash >= cashTarget);
  };
  const stockLimit = mode === 'batch' ? batchUnits : limit;
  const orderLimit = Math.floor(stockLimit / unitsPerOrder);
  const minimumUnits = cashTarget => {
    if (project(0, price).cash >= cashTarget) return 0;
    if (orderLimit < 1 || project(unitsPerOrder, price).cash <= project(0, price).cash) return null;
    const orders = lowestValue(orderLimit, orders => project(orders * unitsPerOrder, price).cash >= cashTarget);
    return orders === null ? null : orders * unitsPerOrder;
  };

  return {
    complete: true,
    ...result,
    units: sold,
    fixedCost,
    landedUnit,
    contributionPerUnit: sold ? result.contribution / sold : null,
    unsoldUnits: mode === 'batch' ? batchUnits - sold : 0,
    unsoldStockCost: result.stockPurchased - result.stockCost,
    upfront: batchPurchase + prepaid,
    breakEvenPrice: minimumPrice(0),
    breakEvenUnits: minimumUnits(0),
    surplusPrice: minimumPrice(target),
    surplusUnits: minimumUnits(target),
    target,
  };
}

const resultRows = [
  ['gross', 'Sales and delivery receipts'],
  ['refunds', 'Refunds paid'],
  ['gstReserved', 'GST reserved'],
  ['fees', 'Payment processing'],
  ['landedUnit', 'Landed cost per unit'],
  ['packagingCosts', 'Packaging'],
  ['deliveryCosts', 'Delivery and fulfilment'],
  ['returnsCosts', 'Refund handling'],
  ['fixedCost', 'Setup, labour and other fixed costs'],
  ['contributionPerUnit', 'Contribution per unit sold before fixed costs'],
  ['margin', 'Trading result on units sold after fixed costs'],
  ['stockPurchased', 'Total stock cash paid'],
  ['upfront', 'Cash paid before first proceeds'],
  ['unsoldUnits', 'Unsold units', 'units'],
  ['unsoldStockCost', 'Cash tied up in unsold stock'],
  ['cash', 'Cash left after the run'],
  ['breakEvenPrice', 'Break-even unit price at entered sales volume'],
  ['breakEvenUnits', 'Break-even units at entered price', 'units'],
  ['target', 'Cash surplus target'],
  ['surplusPrice', 'Unit price to reach cash surplus target'],
  ['surplusUnits', 'Units to reach cash surplus target', 'units'],
];

function profile(e, channel, title) {
  const fields = quoteFields.filter(([, , , condition]) => !condition || condition === channel || condition === 'batch');
  return `<section class="panel" aria-labelledby="merch-${channel}">
    <h3 id="merch-${channel}">${title}</h3>
    <form class="finance-fields" data-merch-profile="${channel}" autocomplete="off">
      <label class="field"><span>Stock purchase</span><select name="stockMode">
        <option value="">Choose a method</option><option value="batch">Buy a batch first</option><option value="on-demand">Buy each unit as it sells</option>
      </select></label>
      <label class="field"><span>GST on sales</span><select name="gst">
        <option value="">Choose the tax treatment</option><option value="no-gst">No GST on these sales</option><option value="taxable">Taxable sales at 10%</option>
      </select></label>
      ${fields.map(([key, label, type, condition]) => {
        const step = type === 'count' || type === 'positive' ? '1' : '0.01';
        const min = type === 'positive' ? 1 : 0;
        const max = type === 'percent' ? 100 : limit;
        const field = `<label class="field">
          <span${key === 'inbound' ? ' data-merch-freight-label' : ''}>${e(label)}</span>
          <input name="${key}" type="number" inputmode="${step === '1' ? 'numeric' : 'decimal'}" min="${min}" max="${max}" step="${step}"${condition === 'batch' ? ' disabled' : ''}${key === 'prepaid' ? ` aria-describedby="merch-prepaid-${channel}"` : ''}>
          ${key === 'prepaid' ? `<small id="merch-prepaid-${channel}">Enter the portion of other quoted costs paid before proceeds clear. Leave batch stock out of this field.</small>` : ''}
        </label>`;
        return condition === 'batch' ? `<div data-merch-batch hidden>${field}</div>` : field;
      }).join('')}
      <label class="field"><span>Quote reference or date</span><input name="reference" type="text" maxlength="160"></label>
    </form>
    <p data-merch-status="${channel}" aria-live="polite">Enter the figures for this channel. Use zero where a cost or allowance genuinely does not apply.</p>
    <button type="button" class="button secondary" data-merch-apply="${channel}" disabled>Use as a same-month budget scenario</button>
    <p data-merch-apply-status="${channel}" role="status"></p>
  </section>`;
}

export function merchView(e) {
  return `<section data-electorate-merch aria-labelledby="merch-title">
    <h2 id="merch-title">Merch and market costs</h2>
    <p>Price the purple anti-splash, anti-corruption lavender-scented piss mat or another product from your own supplier, freight and selling quotes. Use one run or event for each channel. Prices and costs are in Australian dollars.</p>
    <p>Enter actual cash costs. For taxable sales, enter the GST-inclusive customer price and shipping charge. The calculator sets aside GST on sales after refunds and leaves supplier credits out of available cash.</p>
    <div class="finance-fields">${profile(e, 'online', 'Online shop')}${profile(e, 'market', 'Market stall')}</div>
    <section class="panel" aria-labelledby="merch-result-title">
      <h3 id="merch-result-title">Compare the cash results</h3>
      <p>Trading result includes the cost of units sold. Cash left includes the full stock purchase. It assumes refunded units cannot be resold and processing fees apply to the original payment. Volume thresholds use whole transactions at the entered units per order.</p>
      <div class="table-wrap"><table>
        <thead><tr><th scope="col">Measure</th><th scope="col">Online shop</th><th scope="col">Market stall</th></tr></thead>
        <tbody>${resultRows.map(([key, label]) => `<tr><th scope="row">${label}</th><td data-merch-result="online-${key}">—</td><td data-merch-result="market-${key}">—</td></tr>`).join('')}</tbody>
      </table></div>
      <p>To model a run in the selected electorate and month, apply the quote above. The scenario uses upfront cash and the proceeds left after remaining costs. For purchases and payouts in different months, enter the stock, cleared proceeds and bills in the months they fall due.</p>
    </section>
  </section>`;
}

const mounted = new WeakSet();
const draft = { online: {}, market: {} };

export function mountMerch(root, { onApply } = {}) {
  const container = root?.matches?.('[data-electorate-merch]') ? root : root?.querySelector?.('[data-electorate-merch]');
  if (!container || mounted.has(container)) return;
  mounted.add(container);

  for (const form of container.querySelectorAll('[data-merch-profile]')) {
    const channel = form.dataset.merchProfile;
    const status = container.querySelector(`[data-merch-status="${channel}"]`);
    const apply = container.querySelector(`[data-merch-apply="${channel}"]`);
    const applyStatus = container.querySelector(`[data-merch-apply-status="${channel}"]`);
    for (const field of form.elements) if (field.name && field.name in draft[channel]) field.value = draft[channel][field.name];
    let quote;
    const sync = () => {
      const mode = form.elements.stockMode.value;
      const isBatch = mode === 'batch';
      form.querySelector('[data-merch-batch]').hidden = !isBatch;
      form.elements.batchUnits.disabled = !isBatch;
      form.querySelector('[data-merch-freight-label]').textContent = isBatch
        ? 'Inbound freight and import costs for the batch (A$)'
        : 'Inbound freight and import costs per unit (A$)';
      draft[channel] = Object.fromEntries([...form.elements].filter(field => field.name).map(field => [field.name, field.value]));
      quote = calculateMerch(Object.fromEntries(new FormData(form)), channel);
      apply.disabled = !onApply || !quote.complete;
      applyStatus.textContent = '';
      status.textContent = quote.complete ? 'Calculated from the entered prices, costs and volumes.' : quote.message;
      for (const [key, , unit] of resultRows) {
        const cell = container.querySelector(`[data-merch-result="${channel}-${key}"]`);
        const value = quote[key];
        cell.textContent = !quote.complete ? '—' : value == null ? 'Unavailable at these inputs'
          : unit === 'units' ? count.format(value) : money.format(Math.abs(value) < 0.005 ? 0 : value / 100);
      }
    };
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    apply.addEventListener('click', () => { if (quote.complete && onApply) applyStatus.textContent = onApply(quote, channel); });
    sync();
  }
}
