export const enrolmentSource = 'https://www.aec.gov.au/enrolling_to_vote/enrolment_stats/national/2026.htm';
export const regionalEnrolment = {
  federal: { name: 'Australia', enrolled: 18470795 },
  nsw: { name: 'New South Wales', enrolled: 5793205 },
  vic: { name: 'Victoria', enrolled: 4693934 },
  qld: { name: 'Queensland', enrolled: 3832280 },
  wa: { name: 'Western Australia', enrolled: 1927454 },
  sa: { name: 'South Australia', enrolled: 1326348 },
  tas: { name: 'Tasmania', enrolled: 416838 },
  act: { name: 'Australian Capital Territory', enrolled: 325108 },
  nt: { name: 'Northern Territory', enrolled: 155628 },
};

const scheme = (label, rate, source, note, options = {}) => ({ label, rate, source, note, kind: 'reimbursement', threshold: 4, ...options });
const federalRates = 'https://www.aec.gov.au/Parties_and_Representatives/public_funding/Current_Funding_Rate.htm';
const federalTransition = 'https://www.aec.gov.au/FADTransitionalRules/';
const vicRates = 'https://www.vec.vic.gov.au/candidates-and-parties/political-donations/indexation';
const nswRates = 'https://elections.nsw.gov.au/electoral-funding/public-funding/election-campaigns-fund/amounts-payable-for-parties';
const nswClaims = 'https://elections.nsw.gov.au/electoral-funding/public-funding/election-campaigns-fund';
const qldRates = 'https://www.ecq.qld.gov.au/donations-and-expenditure-disclosure/disclosure-of-political-donations-and-electoral-expenditure/caps-and-funding-rates';
const waRates = 'https://www.elections.wa.gov.au/candidates-and-parties/returns-and-reports/reimbursement-electoral-expenditure';
const tasRates = 'https://www.tec.tas.gov.au/disclosure-and-funding/funding/election-campaigns-fund.html';
const actRates = 'https://www.elections.act.gov.au/funding-disclosures-and-registers/public-funding';
const ntStatement = 'https://ntec.nt.gov.au/about-us/media-and-publications/media-releases/2024/2024-territory-election-financial-disclosure-election-expenditure-return';
const saRates = 'https://www.ecsa.sa.gov.au/parties-and-candidates/indexed-amounts';
const saRatesByParticipant = [
  ['Party without members of parliament', 5.80, 6.30, true],
  ['Party with a member of parliament when Parliament ends for the election', 5.80, null, true],
  ['Independent who does not already hold a seat', 8.90, 9.40, false],
  ['Independent who already holds a seat', 8.90, null, false],
];

export const fundingByJurisdiction = {
  federal: {
    schemes: [
      scheme('New federal rules · starting rate A$5.00 per vote', 5, federalTransition, 'This starting rate applies when the election’s formal legal notice, called a writ, is issued from 1 January 2027. The rate is adjusted for inflation from July 2027. For a real claim, use the AEC rate for that election and confirm the separate automatic payment, which is also adjusted for inflation.'),
      scheme('July–December 2026 · A$3.583 per vote', 3.583, federalRates, 'This rate applies to the period shown, before the new rules. The A$13,098 automatic payment is paid once to each party or other recipient that qualifies. It is part of the total, not an extra payment on top. Calculate one recipient at a time.', { automatic: 13098 }),
      scheme('2025 election · A$3.386 per vote', 3.386, federalRates, 'This is the rate used for the 2025 election. The A$12,379 automatic payment is paid once to each party or other recipient that qualifies. It is part of the total, not an extra payment on top. Calculate one recipient at a time.', { automatic: 12379 }),
    ],
    administration: { first: 7500, senateRate: 3750, period: 'per full three-month quarter', source: 'https://www.aec.gov.au/FADReform/factsheets/administrative-assistance.htm', note: 'Starting rates from 2027 for registered parties with elected representatives who meet the funding rules. Rates are adjusted for inflation. Payments are reduced for part of a quarter. Rules limit what the money can pay for and require financial checks by an auditor.' },
    comparison: { period: '2025 federal election · actual AEC payments to each party or branch named below', source: 'https://www.aec.gov.au/media/2025/11-27.htm', payments: [['Australian Labor Party (Federal)', 36999384.08], ['Liberal Party of Australia', 28235699.46], ['Pauline Hanson’s One Nation', 6078750.36], ['Queensland Greens', 2397487.77], ['Legalise Cannabis Australia', 486221.96]] },
  },
  vic: {
    schemes: [
      scheme('Lower house (Assembly) · A$7.70 per vote', 7.70, vicRates, '2026–27 rate. Each candidate must receive at least 4% of valid first-choice votes or win a seat. Check each candidate before adding their votes together. Payment cannot exceed campaign spending allowed under the rules and checked by an auditor.', { electedQualifies: true }),
      scheme('Upper house (Council) · A$3.84 per vote', 3.84, vicRates, '2026–27 rate. Check whether each candidate meets the funding rules. For candidates listed together as a group on the ballot, confirm how votes are allocated before including them in another claim.', { electedQualifies: true }),
    ],
    administration: { first: 309470, second: 103160, additional: 56740, maxSeats: 45, period: 'per full year', source: vicRates, note: '2026–27 maximum for a Victorian party. The amount depends on how many days the party meets the rules and cannot exceed its allowed spending on running the party.' },
    comparison: { period: '2022 Victoria state election · total public funding paid', source: 'https://www.vec.vic.gov.au/-/media/2cf7d4413e9a4878858e6ed282f46c61.pdf', payments: [['Labor Victoria', 12655133], ['Liberal Victoria', 10472987.48], ['Democratic Labour Party', 167345.38], ['Legalise Cannabis Victoria', 28234.01]] },
  },
  nsw: {
    schemes: [
      scheme('Party category A or C · lower house A$5.30', 5.30, nswRates, '2027 rates. NSW uses categories A–D to set party funding. Category A qualifies through its lower-house (Assembly) result. Category C is for parties outside A with at least 25 Assembly candidates. Confirm the party qualifies, then calculate its lower-house and upper-house funding separately.', { qualifyingOnly: true }),
      scheme('Party category B · lower house A$3.98', 3.98, nswRates, '2027 rates. Category B is for parties that do not qualify for category A and have 10–24 lower-house (Assembly) candidates. Confirm the party meets the funding rules first.', { qualifyingOnly: true }),
      scheme('Party categories A–C · upper house A$3.98', 3.98, nswRates, '2027 rates for the upper house (Council). Check the party’s election results, registration and funding category before using this rate.', { qualifyingOnly: true }),
      scheme('Party category D · upper house A$5.97', 5.97, nswRates, '2027 rates. Category D is for parties outside category A with fewer than 10 lower-house (Assembly) candidates. Use the party’s upper-house (Council) votes for this calculation.', { qualifyingOnly: true }),
      scheme('Individual candidate · lower house A$5.30', 5.30, nswClaims, '2027 rates. The candidate must win a seat or receive at least 4% of valid first-choice votes in the electorate. Check the other rules for claiming as an individual.', { electedQualifies: true }),
      scheme('Independent candidate · upper house A$5.97', 5.97, nswClaims, '2027 rates. Use valid votes across NSW for the upper house (Council). Candidates listed together on the ballot have group rules to check. Spending limits also apply.', { electedQualifies: true }),
    ],
    administration: { tiers: [[1, 112600], [2, 192500], [3, 240400]], extraAfter: 3, extraRate: 38800, maxSeats: 25, period: 'per full three-month quarter', source: 'https://elections.nsw.gov.au/electoral-funding/public-funding/administration-fund', note: 'Published maximum amounts for NSW parties in calendar year 2026. The party must meet rules about the previous election and continuing to have elected representatives. Check for updated rates and when the 2026 law changes take effect.' },
    comparison: { period: '2023 NSW state election · total campaign funding paid', source: 'https://elections.nsw.gov.au/about-us/reports/public-funding-claims-and-payments/2023-nsw-state-election-payments', payments: [['Labor NSW', 14016014.96], ['Liberal NSW', 9190249.49], ['Greens NSW', 3592484.60], ['Legalise Cannabis NSW', 91383.23]] },
  },
  qld: {
    schemes: [
      scheme('Registered party · A$7.127 per vote', 7.127, qldRates, '2026–27 rate. Include only electorates where the party’s officially supported candidate receives at least 4% of valid first-choice votes. The party and candidate make separate claims, each supported by their own allowed campaign spending.'),
      scheme('Candidate · A$3.564 per vote', 3.564, qldRates, '2026–27 rate. The candidate must receive at least 4% of valid first-choice votes in their electorate. Use only their own campaign spending allowed under the rules. Queensland council elections do not offer public payments towards campaign costs.'),
    ],
    comparison: { period: '2024 Queensland election · party payments recorded through 30 June 2025, excluding separate candidate claims', source: 'https://www.parliament.qld.gov.au/Work-of-the-Assembly/Tabled-Papers/docs/5825T1328/5825T1328.pdf', payments: [['LNP Queensland', 8350909.96], ['Labor Queensland', 6739721.32], ['Queensland Greens', 823329.33], ['Legalise Cannabis Queensland', 20919.57]] },
  },
  wa: {
    schemes: [
      scheme('Standard rate · A$2.43866 per vote', 2.43866, waRates, '2026–27 rate. You need more than 4% of valid first-choice votes. The payment cannot exceed campaign spending allowed under the funding rules.', { strict: true }),
      scheme('Higher rate, if chosen in time · A$4.74783 per vote', 4.74783, waRates, '2026–27 rate. A party must formally choose the higher funding scheme within 28 days of its registration notice. It still needs more than 4% of valid first-choice votes, and payment cannot exceed allowed campaign spending.', { strict: true }),
      scheme('2025 election · higher rate A$4.40', 4.40, 'https://www.elections.wa.gov.au/2025-election-returns', 'This is the higher rate used in the 2025 election for those who chose that scheme. Include only votes and campaign spending that meet its funding rules.', { strict: true }),
    ],
    comparison: { period: '2025 WA state election · public payments towards campaign costs', source: 'https://www.elections.wa.gov.au/2025-election-returns', payments: [['WA Labor', 5581972], ['The Nationals WA', 717006.40], ['The Greens (WA)', 483518.06]] },
  },
  sa: {
    schemes: [['Lower house (Assembly)', 4], ['Upper house (Council)', 2]].flatMap(([chamber, threshold]) =>
      saRatesByParticipant.map(([participant, rate, taperRate, partyAdjustment]) => scheme(`${chamber} · ${participant}`, rate, saRates,
        `2026–27 rate, adjusted for inflation. ${taperRate == null ? `A$${rate.toFixed(2)} for each first-choice vote that qualifies for funding.` : `A$${taperRate.toFixed(2)} for your first-choice votes up to a number equal to 10% of all valid votes in the contest, then A$${rate.toFixed(2)} for each further vote that qualifies for funding.`} Calculate one contest at a time. Check the rules for claiming payment and accepting donations.`,
        { singleOnly: true, electedQualifies: true, threshold, taperRate, partyAdjustment }))),
    comparison: { period: 'July–December 2025 SA payments for running parties. These are separate from payments towards election campaign costs.', source: 'https://www.ecsa.sa.gov.au/parties-and-candidates/administrative-funding/administrative-funding-payments', payments: [['Australian Labor Party (SA)', 800000], ['The Greens (SA)', 85000]] },
  },
  tas: {
    schemes: [
      scheme('Lower-house party · A$6.12 per vote', 6.12, tasRates, '2025 election rate for the House of Assembly. Add the first-choice votes for all of the party’s officially supported candidates in each electorate, called a division. The party needs at least 4% there. Payment cannot exceed campaign spending allowed under the rules.'),
      scheme('Lower-house independent · A$6.12 per vote', 6.12, tasRates, '2025 election rate for the House of Assembly. An independent candidate may qualify by winning a seat or receiving at least 4% of valid first-choice votes in their electorate.', { electedQualifies: true }),
    ],
    administration: { tiers: [[1, 11600], [2, 23100], [6, 39400]], period: 'per full three-month quarter', source: 'https://www.tec.tas.gov.au/disclosure-and-funding/funding/administration-fund.html', note: '2026 maximum amounts based on House of Assembly members who meet the funding rules. The actual payment also depends on allowed spending and the limit for each three-month quarter.' },
    comparison: { period: 'The Tasmanian Electoral Commission’s 2025 register lists the maximum available, payments made in advance and other payments separately.', source: 'https://www.tec.tas.gov.au/disclosure-and-funding/registers-and-reports/campaigns-fund/election-campaigns-fund-claims.html', payments: [] },
  },
  act: {
    schemes: [
      scheme('July–December 2026 · A$7.57412 per vote', 7.57412, actRates, 'This rate applies to the period shown. In each electorate, check the combined first-choice votes for the party’s officially supported candidates, or the votes for an individual candidate standing without a party. ACT funding is paid according to votes, rather than repaying campaign expenses.', { kind: 'direct' }),
      scheme('2024 election · A$10.15896 per vote', 10.15896, actRates, 'Use this 2024 rate to compare with the published payments below. ACT funding is paid according to votes, rather than repaying campaign expenses.', { kind: 'direct' }),
    ],
    administration: { first: 7194.38, period: 'per full three-month quarter', source: actRates, note: '2026 rate for each Member of the Legislative Assembly who meets the funding rules. For part of a quarter, adjust the amount for the days the representative belonged to the party or served as an independent.' },
    comparison: { period: '2024 ACT election · published payments rounded to whole dollars', source: 'https://www.parliament.act.gov.au/__data/assets/pdf_file/0009/2900763/D1-Electoral-Commission-report.pdf', payments: [['ACT Labor', 950564], ['Canberra Liberals', 931089], ['ACT Greens', 338984], ['Independents for Canberra', 236988]] },
  },
  nt: {
    schemes: [scheme('Northern Territory · no public election funding', 0, ntStatement, 'The NT does not make public payments towards parties’ or candidates’ election campaign costs. Campaigns still have to report their finances. Support for elected representatives’ parliamentary offices is a separate matter.', { kind: 'none' })],
  },
};
