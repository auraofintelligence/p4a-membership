import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateElectorateBudget, priceForWork, projectMembership, referendumVotes, monthDate, planningMonths } from '../public/electorate-budget.mjs';
import { federalFinanceDistricts } from '../public/finance-federal-data.mjs';
import { stateFinanceEnrolments } from '../public/finance-state-enrolments.mjs';
import { stateFinanceDemographics } from '../public/finance-state-demographics.mjs';
import { membershipProjection } from '../public/membership-quick.mjs';
import { calculateMerchBands } from '../public/merch-quick.mjs';
import { calculateBequests, calculateDonationPlan, calculateDonationScenario } from '../public/donation-simulator.mjs';

test('federal membership quick projection counts one payment stream at each stage', () => {
  const result = membershipProjection(3, 1000, 75);
  assert.equal(result.members, 3000);
  assert.equal(result.standardMembers, 2250);
  assert.equal(result.concessionMembers, 750);
  assert.equal(result.applicationNet, 1470000);
  assert.equal(result.quarterNet, 8085000);
  assert.equal(result.annualNet, 32340000);
  assert.equal(membershipProjection(0, 10000, 100).annualNet, 0);
  assert.equal(membershipProjection(1, 100, 0).annualNet, 784000);
});

test('merch bands use either the band volume or the sum of product volumes', () => {
  const result = calculateMerchBands([
    { units: 10, profit: '4.21', products: [{ units: 999 }] },
    { units: 10000, profit: '0.99' },
    { units: 1000, profit: '7.50', useProducts: true, products: [{ units: 25 }, { units: 75 }] },
    { units: 0, profit: '0' },
    { units: 10001, profit: '' },
  ]);
  assert.equal(result.totalUnits, 10110);
  assert.equal(result.totalCents, 1069210);
  assert.equal(result.included, 4);
  assert.deepEqual(result.bands.map(band => band.monthlyCents), [4210, 990000, 75000, 0, null]);
  assert.equal(result.bands[2].productUnits, 100);
});

test('donation scenarios separate the first round from the 12-month total', () => {
  const monthly = calculateDonationScenario(100, '25.01', 'monthly');
  assert.equal(monthly.firstReceiptCents, 250100);
  assert.equal(monthly.annualCents, 3001200);
  assert.equal(calculateDonationScenario(10000, 5, 'quarterly').annualCents, 20000000);
  assert.equal(calculateDonationScenario(0, 25, 'once').annualCents, 0);
  assert.equal(calculateDonationScenario(10001, 25, 'once'), null);
  assert.equal(calculateDonationScenario(10, '', 'monthly'), null);
});

test('donation plans total four independent giving schedules', () => {
  const plan = calculateDonationPlan({
    once: { donors: 3, amount: '10.25' },
    monthly: { donors: 2, amount: 5 },
    quarterly: { donors: 4, amount: '2.50' },
    annual: { donors: 1, amount: 100 },
  });
  assert.equal(plan.complete, true);
  assert.equal(plan.firstReceiptCents, 15075);
  assert.equal(plan.annualCents, 29075);
  assert.deepEqual(
    ['once', 'monthly', 'quarterly', 'annual'].map(key => plan.groups[key].annualCents),
    [3075, 12000, 4000, 10000],
  );
});

test('monthly and quarterly schedules combine independent gift amounts', () => {
  const plan = calculateDonationPlan({
    once: { donors: 0, amount: 25 },
    monthly: { donors: 80, amount: 10 },
    quarterly: { donors: 12, amount: 25 },
    annual: { donors: 0, amount: 25 },
  }, {
    monthly: [{ donors: 20, amount: 50 }],
    quarterly: [{ donors: 3, amount: '17.45' }],
  });

  assert.equal(plan.complete, true);
  assert.equal(plan.groups.monthly.firstReceiptCents, 180000);
  assert.equal(plan.groups.monthly.annualCents, 2160000);
  assert.equal(plan.groups.quarterly.firstReceiptCents, 35235);
  assert.equal(plan.groups.quarterly.annualCents, 140940);
  assert.equal(plan.firstReceiptCents, 215235);
  assert.equal(plan.annualCents, 2300940);
});

test('donation plans preserve zero and exclude missing or invalid schedules', () => {
  const plan = calculateDonationPlan({
    monthly: { donors: 0, amount: 25 },
    quarterly: { donors: 2, amount: '' },
    annual: { donors: 1, amount: '8.20' },
  });
  assert.equal(plan.complete, false);
  assert.equal(plan.groups.once, null);
  assert.equal(plan.groups.quarterly, null);
  assert.equal(plan.groups.monthly.annualCents, 0);
  assert.equal(plan.firstReceiptCents, 820);
  assert.equal(plan.annualCents, 820);
});

test('larger one-off and annual gifts add to the matching schedule once per year', () => {
  const plan = calculateDonationPlan({
    once: { donors: 100, amount: 25 },
    monthly: { donors: 10, amount: 15 },
    quarterly: { donors: 5, amount: 40 },
    annual: { donors: 2, amount: 50 },
  }, {
    once: [{ donors: 1, amount: 1000 }, { donors: 2, amount: 5000 }, { donors: 1, amount: '12345.67' }],
    annual: [{ donors: 3, amount: 25000 }],
  });

  assert.equal(plan.complete, true);
  assert.equal(plan.firstReceiptCents, 10129567);
  assert.equal(plan.annualCents, 10354567);
  assert.deepEqual(plan.groups.once, {
    donors: 100, amountCents: 2500, contributions: 1, firstReceiptCents: 2584567, annualCents: 2584567,
  });
  assert.equal(plan.groups.annual.firstReceiptCents, 7510000);
  assert.equal(plan.groups.annual.annualCents, 7510000);
  assert.deepEqual(plan.largerGifts.once.map(gift => gift.annualCents), [100000, 1000000, 1234567]);
  assert.equal(plan.largerGifts.annual[0].annualCents, 7500000);
});

test('an incomplete larger gift keeps valid gifts and explicit zero donors in the plan', () => {
  const plan = calculateDonationPlan({
    once: { donors: 1, amount: 25 },
    monthly: { donors: 1, amount: 25 },
    quarterly: { donors: 0, amount: 25 },
    annual: { donors: 0, amount: 25 },
  }, {
    once: [{ donors: 1, amount: '' }, { donors: 0, amount: 10000 }],
    annual: [{ donors: 1, amount: 5000 }],
  });

  assert.equal(plan.complete, false);
  assert.equal(plan.largerGifts.once[0], null);
  assert.equal(plan.largerGifts.once[1].annualCents, 0);
  assert.equal(plan.groups.once.annualCents, 2500);
  assert.equal(plan.firstReceiptCents, 505000);
  assert.equal(plan.annualCents, 532500);
});

test('bequests total separately from scheduled donations and exclude incomplete entries', () => {
  const bequests = calculateBequests([
    { donors: 1, amount: 100000 },
    { donors: 2, amount: '50000.25' },
    { donors: 0, amount: 25000 },
    { donors: 1, amount: '' },
  ]);
  const donations = calculateDonationPlan({
    once: { donors: 0, amount: 25 },
    monthly: { donors: 1, amount: 25 },
    quarterly: { donors: 0, amount: 25 },
    annual: { donors: 0, amount: 25 },
  });

  assert.equal(bequests.complete, false);
  assert.equal(bequests.totalCents, 20000050);
  assert.deepEqual(bequests.gifts.map(gift => gift?.firstReceiptCents ?? null), [10000000, 10000050, 0, null]);
  assert.equal(donations.firstReceiptCents, 2500);
  assert.equal(donations.annualCents, 30000);
});

test('a zero-cash plan cannot spend hoped-for grants or later sales', () => {
  const rows = calculateElectorateBudget([
    { campaignActivity: 55, technology: 25, stock: 50, trade: 80 },
    { stock: 40, campaignActivity: 55, receivedFunding: 60 },
  ], {});
  assert.equal(rows[0].op.opening, 0);
  assert.equal(rows[0].op.lines[0].deferred, 5000);
  assert.equal(rows[0].op.closing, 5500);
  assert.equal(rows[0].campaign.closing, 0);
  assert.equal(rows[0].campaign.deferred, 5500);
  assert.equal(rows[1].op.lines[0].funded, 4000);
  assert.equal(rows[1].op.closing, 1500);
  assert.equal(rows[1].campaign.closing, 500);
});

test('merch quotes require opening cash for prepayments and only count remaining proceeds once', () => {
  const entries = [{ onlineUpfront: 280, onlinePayout: 465, operatingGifts: 300 }, { onlineUpfront: 280, onlinePayout: 465 }];
  const rows = calculateElectorateBudget(entries, {});
  assert.equal(rows[0].op.deferred, 28000);
  assert.equal(rows[0].op.quotedReceipts, 0);
  assert.equal(rows[0].op.closing, 30000);
  assert.equal(rows[1].op.quotedReceipts, 46500);
  assert.equal(rows[1].op.closing, 48500);
  assert.equal(rows[1].op.cashMovement, 18500);
});

test('existing bills and protected reserves precede new work in their own accounts', () => {
  const rows = calculateElectorateBudget([
    { operatingOwed: 100, campaignGifts: 150, payroll: 30, operatingReserve: 40 },
    { operatingGifts: 130, payroll: 15, campaignActivity: 140 },
    { operatingReserve: 0, payroll: 15 },
  ], {});
  assert.equal(rows[0].op.unpaidBills, 10000);
  assert.equal(rows[0].op.deferred, 3000);
  assert.equal(rows[0].campaign.closing, 15000);
  assert.equal(rows[1].op.paidBills, 10000);
  assert.equal(rows[1].op.reserve, 3000);
  assert.equal(rows[1].op.deferred, 1500);
  assert.equal(rows[1].campaign.closing, 1000);
  assert.equal(rows[2].op.plannedSpend, 1500);
  assert.equal(rows[2].op.closing, 1500);
  for (const row of rows) for (const fund of [row.op, row.campaign]) {
    assert.equal(fund.opening + fund.income - fund.paidBills - fund.plannedSpend, fund.closing);
    assert.ok(fund.closing >= 0);
  }
});

test('quarter payments, concession and annual renewal follow paid cohorts', () => {
  const entries = Array.from({ length: 16 }, () => ({}));
  entries[0] = { quarterly: 8, quarterConcessions: 3, applications: 10, annual: 8 };
  entries[3] = { annual: 10, annualConcessions: 1, qualifying: 99 };
  entries[15] = { annual: 5 };
  const fee = { applicationFee: 5, annualPrice: 80, concessionPrice: 40, processingRate: 2, processingFixed: .3 };
  const rows = calculateElectorateBudget(entries, fee);
  assert.equal(rows[0].annual, 0);
  assert.equal(rows[0].grossFees, 18000);
  assert.equal(rows[0].processingFees, 900);
  assert.equal(rows[3].annualDue, 8);
  assert.equal(rows[3].annual, 8);
  assert.equal(rows[3].grossFees, 60000);
  assert.equal(rows[3].qualifying, 8);
  assert.equal(rows[15].annualDue, 8);
  assert.equal(rows[15].active, 5);
  assert.equal(calculateElectorateBudget(entries, {})[0].active, 0);
});

test('explicit growth compounds and covers the full 2031 horizon', () => {
  const entries = Array.from({ length: planningMonths }, () => ({}));
  projectMembership(entries, 0, { applicants: 10, growth: 100, approval: 50, continuation: 80, renewal: 50, concession: 20 });
  assert.equal(entries[0].quarterly, 5);
  assert.equal(entries[3].applications, 80);
  assert.equal(entries[3].annual, 4);
  assert.equal(monthDate(planningMonths - 1).toISOString().slice(0, 10), '2031-12-01');
  assert.equal(priceForWork({ fixed: .3, rate: 1.65, directCost: 2.5, minutes: 20, hourly: 52.8 }).breakEven, 2075);
});

test('all 565 roll entries have dated sources and state ABS joins', () => {
  assert.equal(federalFinanceDistricts.length, 150);
  assert.equal(stateFinanceEnrolments.length, 415);
  assert.equal(federalFinanceDistricts.reduce((total, row) => total + row.enrolled, 0), 18470795);
  const normal = row => `${row.jurisdiction}:${row.name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const profiles = new Map(stateFinanceDemographics.map(row => [normal(row), row]));
  assert.equal(profiles.size, 415);
  for (const row of stateFinanceEnrolments) assert.ok(profiles.get(normal(row))?.population > 0, row.name);
  for (const row of [...federalFinanceDistricts, ...stateFinanceEnrolments]) {
    assert.match(row.enrolmentSource, /^https:\/\//);
    assert.match(row.enrolmentDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isInteger(row.enrolled) && row.enrolled > 0);
  }
});

test('a referendum requires a national majority and four state majorities', () => {
  const regions = Array.from({ length: 8 }, (_, index) => ({ state: index < 6, enrolled: 100, formalShare: 100, yesShare: index < 4 ? 51 : 49 }));
  assert.equal(referendumVotes(regions).doubleMajority, false);
  regions[7].yesShare = 51;
  assert.equal(referendumVotes(regions).doubleMajority, true);
  regions[3].yesShare = 50;
  assert.equal(referendumVotes(regions).doubleMajority, false);
});
