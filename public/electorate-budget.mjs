export const firstPlanningYear = 2026;
export const lastPlanningYear = 2031;
export const planningMonths = 62;

export function monthDate(index) {
  return new Date(Date.UTC(firstPlanningYear, 10 + index, 1));
}

const numeric = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export const peopleCount = value => Math.floor(Math.min(300000, numeric(value)));
export const cashCents = value => Math.round(Math.min(1000000000, numeric(value)) * 100);
export const percentage = value => Math.min(100, numeric(value));

const operatingRequests = [
  ['technology', 'Hosting, software and included AI'],
  ['assurance', 'Accounting, legal, insurance and audit'],
  ['activities', 'Policy, outreach, training and venues'],
  ['payroll', 'Paid work and employment costs'],
];
const campaignRequests = [
  ['nomination', 'Nomination and campaign setup'],
  ['campaignStaff', 'Paid campaign work'],
  ['campaignActivity', 'Campaign travel, materials and advertising'],
];

export { operatingRequests, campaignRequests };

const reserveFor = (entry, previous) => entry == null || entry === '' ? previous?.reserveTarget || 0 : cashCents(entry);

function fundMonth(opening, income, due, reserveTarget, requests, beforeReceipts = [], existingBills = due) {
  let openingAvailable = Math.max(0, opening - existingBills - reserveTarget);
  let quotedReceipts = 0;
  const earlyLines = beforeReceipts.map(([label, requested, payout]) => {
    const feasible = openingAvailable >= requested;
    const funded = feasible ? requested : 0;
    openingAvailable -= funded;
    if (feasible) quotedReceipts += payout;
    return { label, requested, funded, deferred: requested - funded };
  });
  income += quotedReceipts;
  let balance = opening - earlyLines.reduce((sum, line) => sum + line.funded, 0) + income;
  const paidBills = Math.min(balance, due);
  balance -= paidBills;
  const unpaidBills = due - paidBills;
  const reserve = Math.min(balance, reserveTarget);
  const lines = requests.map(([label, requested]) => {
    const funded = !unpaidBills && balance - reserve >= requested ? requested : 0;
    balance -= funded;
    return { label, requested, funded, deferred: requested - funded };
  });
  lines.unshift(...earlyLines);
  const plannedSpend = lines.reduce((total, line) => total + line.funded, 0);
  return {
    opening, income, quotedReceipts, due, paidBills, unpaidBills, reserve, reserveTarget, lines, plannedSpend,
    deferred: lines.reduce((total, line) => total + line.deferred, 0),
    closing: balance, available: balance - reserve, cashMovement: balance - opening,
  };
}

function payments(count, price, feeRate, feeFixed) {
  const gross = count * price;
  const fees = price ? count * (Math.round(price * feeRate) + feeFixed) : 0;
  return { gross, fees };
}

export function calculateElectorateBudget(months, fees) {
  const calculated = [];
  const rate = percentage(fees.processingRate) / 100;
  const fixed = cashCents(fees.processingFixed);
  const appPrice = cashCents(fees.applicationFee);
  const annualPrice = cashCents(fees.annualPrice);
  const concessionPrice = Math.min(annualPrice, cashCents(fees.concessionPrice) || annualPrice);
  for (const [index, entry] of months.entries()) {
    const prior = calculated.at(-1);
    const quarterly = Math.round(annualPrice / 4) ? peopleCount(entry.quarterly) : 0;
    const annualDue = (calculated[index - 3]?.quarterly || 0) + (calculated[index - 12]?.annual || 0);
    const annualRequested = peopleCount(entry.annual);
    const annual = Math.min(annualDue, annualRequested);
    const annualConcessions = Math.min(annual, peopleCount(entry.annualConcessions));
    const quarterConcessions = Math.min(quarterly, peopleCount(entry.quarterConcessions));
    const applications = peopleCount(entry.applications);
    const feesCollected = [
      payments(applications, appPrice, rate, fixed),
      payments(quarterly - quarterConcessions, Math.round(annualPrice / 4), rate, fixed),
      payments(quarterConcessions, Math.round(concessionPrice / 4), rate, fixed),
      payments(annual - annualConcessions, annualPrice, rate, fixed),
      payments(annualConcessions, concessionPrice, rate, fixed),
    ];
    const grossFees = feesCollected.reduce((sum, payment) => sum + payment.gross, 0);
    const processingFees = feesCollected.reduce((sum, payment) => sum + payment.fees, 0);
    const operatingBills = cashCents(entry.operatingOwed) + (prior?.op.unpaidBills || 0);
    const stock = [
      ['Stock and market costs due before receipts', cashCents(entry.stock), 0],
      ['Online shop quote · upfront cash', cashCents(entry.onlineUpfront), cashCents(entry.onlinePayout)],
      ['Market stall quote · upfront cash', cashCents(entry.marketUpfront), cashCents(entry.marketPayout)],
    ].filter(([, requested, payout]) => requested || payout);
    const op = fundMonth(prior?.op.closing || 0,
      grossFees + cashCents(entry.operatingGifts) + cashCents(entry.trade) + cashCents(entry.otherOperating),
      operatingBills + processingFees, reserveFor(entry.operatingReserve, prior?.op),
      operatingRequests.map(([key, label]) => [label, cashCents(entry[key])]), stock, operatingBills);
    const campaign = fundMonth(prior?.campaign.closing || 0,
      cashCents(entry.campaignGifts) + cashCents(entry.receivedFunding),
      cashCents(entry.campaignOwed) + (prior?.campaign.unpaidBills || 0),
      reserveFor(entry.campaignReserve, prior?.campaign), campaignRequests.map(([key, label]) => [label, cashCents(entry[key])]));
    const active = (prior?.active || 0) + quarterly + annual - annualDue;
    calculated.push({
      op, campaign, quarterly, annual, annualDue, annualRequested, annualConcessions, quarterConcessions,
      applications, active, qualifying: Math.min(active, peopleCount(entry.qualifying)), grossFees, processingFees,
      volunteerHours: numeric(entry.volunteerHours), paidHours: numeric(entry.paidHours),
    });
  }
  return calculated;
}

export function priceForWork({ applications, rate, fixed, directCost, minutes, hourly, contribution }) {
  const count = peopleCount(applications);
  const direct = cashCents(directCost);
  const review = Math.round(numeric(minutes) * cashCents(hourly) / 60);
  const fixedCost = cashCents(fixed);
  const fraction = percentage(rate) / 100;
  const covered = Math.max(0, direct + review + fixedCost - cashCents(contribution));
  const breakEven = fraction >= 1 ? null : Math.ceil(covered / (1 - fraction));
  return { direct, review, breakEven, total: count * (direct + review) };
}

export function projectMembership(months, start, assumptions) {
  const growth = 1 + Math.min(1000, numeric(assumptions.growth)) / 100;
  const approval = percentage(assumptions.approval) / 100;
  const continuation = percentage(assumptions.continuation) / 100;
  const renewal = percentage(assumptions.renewal) / 100;
  const concession = percentage(assumptions.concession) / 100;
  const previous = calculateElectorateBudget(months.slice(0, start), { annualPrice: 1 });
  const first = peopleCount(assumptions.applicants);
  for (let index = start; index < months.length; index++) {
    const applications = peopleCount(Math.round(first * growth ** (index - start)));
    const quarterly = Math.round(applications * approval);
    const annual = Math.round((previous[index - 3]?.quarterly || 0) * continuation)
      + Math.round((previous[index - 12]?.annual || 0) * renewal);
    Object.assign(months[index], {
      applications, quarterly, annual,
      quarterConcessions: Math.round(quarterly * concession), annualConcessions: Math.round(annual * concession),
    });
    previous.push({ quarterly, annual });
  }
  return months;
}

export function referendumVotes(regions) {
  const results = regions.map(region => {
    const complete = region.enrolled > 0 && [region.formalShare, region.yesShare].every(value => value != null && value !== '');
    const formal = complete ? Math.round(region.enrolled * percentage(region.formalShare) / 100) : 0;
    const yes = Math.round(formal * percentage(region.yesShare) / 100);
    return { ...region, complete, formal, yes, majority: formal > 0 && 2 * yes > formal };
  });
  const formal = results.reduce((total, region) => total + region.formal, 0);
  const yes = results.reduce((total, region) => total + region.yes, 0);
  const states = results.filter(region => region.state && region.majority).length;
  const complete = results.length === 8 && results.every(region => region.complete);
  const national = formal > 0 && 2 * yes > formal;
  return { regions: results, formal, yes, states, complete, national, doubleMajority: complete && national && states >= 4 };
}
