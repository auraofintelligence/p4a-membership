export const sourcesChecked = '2026-11-12';

const stage = (title, action, source, date, basis, time, dateLabel, pastLabel) => ({ title, action, source, date, basis, time, dateLabel, pastLabel });
const daysAfter = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

const federalDates = 'https://www.aph.gov.au/About_Parliament/Parliamentary_departments/Parliamentary_Library/Research/FlagPost/2025/August/When_is_the_next_federal_election';
const federalParty = 'https://www.aec.gov.au/FAQs/party-registration.htm';
const federalRegistration = 'https://www.aec.gov.au/Parties_and_Representatives/Party_Registration/';
const federalTimetable = 'https://www.aec.gov.au/Elections/federal_elections/Federal_Election_Timetable.htm';
const federalCandidates = 'https://www.aec.gov.au/Elections/candidates/nominating.htm';
const federalClaims = 'https://www.aec.gov.au/FADReform/guidelines/Election-Funding-Guideline-v1.pdf';
const federalFunding = 'https://www.aec.gov.au/FADTransitionalRules/';
const federalAdmin = 'https://www.aec.gov.au/FADReform/factsheets/administrative-assistance.htm';
const constitution = 'https://www.legislation.gov.au/C2004Q00685/latest/text';
const changingParties = 'https://peo.gov.au/understand-our-parliament/your-questions-on-notice/questions/if-members-of-parliament-are-elected-through-a-party-how-can-they-leave-that-party-and-still-keep-their-seat';

const vicPoll = '2026-11-28';
const vicDates = 'https://www.vec.vic.gov.au/voting/2026-state-election';
const vicCycle = 'https://www.vec.vic.gov.au/voting/types-of-elections/state-elections';
const vicParty = 'https://www.vec.vic.gov.au/candidates-and-parties/registered-political-parties/register-a-party';
const vicClaims = 'https://www.vec.vic.gov.au/candidates-and-parties/funding/funding-registered-political-parties/rpp-public-funding';
const vicAdmin = 'https://www.vec.vic.gov.au/candidates-and-parties/funding/funding-registered-political-parties/rpp-administrative-expenditure-funding';
const vicRates = 'https://www.vec.vic.gov.au/candidates-and-parties/political-donations/indexation';
const vicPolicy = 'https://www.vec.vic.gov.au/candidates-and-parties/funding/funding-registered-political-parties/rpp-policy-development-funding';
const vicLaws = 'https://www.vec.vic.gov.au/about-us/legislation/electoral-act-amendments-2026';

const nswDates = 'https://elections.nsw.gov.au/elections/state-elections/2027-nsw-state-election';
const nswParty = 'https://elections.nsw.gov.au/political-participants/political-parties/register-a-party';
const nswStatus = 'https://elections.nsw.gov.au/political-participants/political-parties/what-is-a-party/registered-political-parties';
const nswClaims = 'https://elections.nsw.gov.au/electoral-funding/public-funding/election-campaigns-fund';
const nswAdmin = 'https://elections.nsw.gov.au/electoral-funding/public-funding/administration-fund';
const nswRates = 'https://elections.nsw.gov.au/electoral-funding/public-funding/election-campaigns-fund/amounts-payable-for-parties';
const nswNew = 'https://elections.nsw.gov.au/electoral-funding/public-funding/new-parties-fund';
const nswConstitution = 'https://legislation.nsw.gov.au/view/html/inforce/current/act-1902-032';
const nswOfficers = 'https://elections.nsw.gov.au/bulletins/2027-nsw-state-election-bulletin-no-5';
const nswCycle = 'https://elections.nsw.gov.au/elections/how-voting-works/voting-in-new-south-wales/how-does-a-state-election-work';

const ntPoll = '2028-08-26';
const ntAct = 'https://legislation.nt.gov.au/en/Legislation/ELECTORAL-ACT-2004';
const ntParty = 'https://ntec.nt.gov.au/electoral-participants/legislative-assembly-participants/political-parties';
const ntHandbook = 'https://ntec.nt.gov.au/_resources/documents/political-parties/Registration-of-a-political-party-handbook.pdf';
const ntCandidates = 'https://ntec.nt.gov.au/electoral-participants/legislative-assembly-participants/candidates';
const ntFunding = 'https://ntec.nt.gov.au/about-us/media-and-publications/media-releases/2024/2024-territory-election-financial-disclosure-election-expenditure-return';
const ntGovernment = 'https://www.legislation.gov.au/C2004A01857/latest/text';

const actParty = 'https://www.elections.act.gov.au/elections/education/fact-sheets/fact-sheet-how-to-register-a-political-party-for-act-legislative-assembly-elections';
const actDates = 'https://www.elections.act.gov.au/for-political-participants/candidates';
const actFunding = 'https://www.elections.act.gov.au/funding-disclosures-and-registers/public-funding';
const actAct = 'https://www.legislation.act.gov.au/a/1992-71';
const actGovernment = 'https://www.legislation.gov.au/C2004A03699/latest/text';

const qldPoll = '2028-10-28';
const qldAct = 'https://www.legislation.qld.gov.au/view/whole/html/current/act-1992-028';
const qldParty = 'https://www.ecq.qld.gov.au/election-participants/state-election-participants/registered-political-parties';
const qldStages = 'https://www.ecq.qld.gov.au/election-participants/state-election-participants';
const qldDates = 'https://www.ecq.qld.gov.au/electoral-boundaries/state-electorate-boundaries';
const qldFunding = 'https://www.ecq.qld.gov.au/donations-and-expenditure-disclosure/disclosure-of-political-donations-and-electoral-expenditure/caps-and-funding-rates';
const qldCandidates = 'https://www.ecq.qld.gov.au/election-participants/state-election-participants/candidates';
const qldVacancies = 'https://www.legislation.qld.gov.au/view/whole/html/inforce/current/act-2001-081#sec.72';

const waPoll = '2029-03-10';
const waParty = 'https://www.elections.wa.gov.au/candidates-and-parties/registered-political-parties/registering-political-party';
const waLead = 'https://www.elections.wa.gov.au/sites/default/files/2021%20Fact%20Sheet%20-%20Party%20Registration%20-%20Changes%20to%20the%20Act%20%28173529.1%29.pdf';
const waDates = 'https://www.elections.wa.gov.au/sites/default/files/ed%20centre/Resources/Education%20resources%202025/Broad%20State%20Election%20timeline_FINAL.pdf';
const waFunding = 'https://www.elections.wa.gov.au/candidates-and-parties/returns-and-reports/reimbursement-electoral-expenditure';
const waAct = 'https://www.legislation.wa.gov.au/legislation/statutes.nsf/main_mrtitle_289_homepage.html';
const waFinance = 'https://www.elections.wa.gov.au/sites/default/files/CAP%20Form%20and%20guides/2026%20By-election/2026-Secret-Harbour-By-election-Funding-and-Disclosure-in-Western-Australia-Guide.pdf';

const tasParty = 'https://www.tec.tas.gov.au/electoral-participants/political-parties.html';
const tasAct = 'https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-2004-051';
const tasConstitution = 'https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-1934-094';
const tasReport = 'https://www.tec.tas.gov.au/info/Publications/ElectionReports/Report_on_Parliamentary_Elections_2024-2025_w.pdf';
const tasCouncil = 'https://www.tec.tas.gov.au/legislative-council/index.html';
const tasCouncilMoney = 'https://www.tec.tas.gov.au/disclosure-and-funding/electoral-expenditure/legislative-council/index.html';
const tasCandidates = 'https://www.tec.tas.gov.au/electoral-participants/candidates/house-of-assembly/index.html';
const tasClaims = 'https://www.tec.tas.gov.au/disclosure-and-funding/funding/election-campaigns-fund.html';
const tasAdmin = 'https://www.tec.tas.gov.au/disclosure-and-funding/funding/administration-fund.html';
const tasFundingAct = 'https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-2023-037';

const saPoll = '2030-03-16';
const saAct = 'https://www.legislation.sa.gov.au/_legislation-documents/lz/c/a/electoral-act-1985/current/1985.77.auth.pdf';
const saDates = 'https://edbc.sa.gov.au/about-the-edbc/timetable.html';
const saParty = 'https://www.ecsa.sa.gov.au/index.php?catid=13&id=147&option=com_content&view=article';
const saFinance = 'https://www.ecsa.sa.gov.au/parties-and-candidates/electoral-funding-donations-reform/reforms-overview';
const saClaims = 'https://ecsa.sa.gov.au/images/Compliance%20branch/Forms%20and%20guides/Guides/Election%20Funding%20-%20Public%20Funding%20Guide.pdf';
const saAdmin = 'https://www.ecsa.sa.gov.au/parties-and-candidates/administrative-funding';

export const electoralJurisdictions = [
  {
    id: 'federal', label: 'Federal', name: 'Commonwealth', timeZone: 'Australia/Canberra', minimum: 1500,
    election: 'The federal election date has yet to be announced. If the House of Representatives and half the state Senate seats go to election together on the usual timetable, voting could be from 7 August 2027 to 20 May 2028.',
    membership: 'Count members on the electoral roll who support federal registration and whose membership the AEC can verify. Two parties cannot count the same person toward registration. Adopt a constitution, appoint officers and check the membership list. P4A aims for twice the minimum that applies to a party without a federal seat.',
    stages: [
      stage('Apply to register the party', 'Allow at least four months for the Australian Electoral Commission (AEC) to assess an application from a party without a federal seat. P4A set this target four months before 1 July 2027, the earliest usual date for a half-Senate election to be formally called. Apply earlier if ready. A House election or by-election can pause the assessment.', federalRegistration, '2027-03-01', 'planning'),
      stage('Be ready before the election is called', 'Aim to have AEC approval, candidate eligibility checks and campaign accounts ready. The AEC pauses registration assessment when a writ, the official order to hold an election, is issued for a federal election or by-election. This is the earliest usual date for a half-Senate election to be called.', federalDates, '2027-07-01', 'planning'),
      stage('Put candidates on the ballot', 'The election order sets a noon nomination deadline 10–27 days after it is issued. Check that each candidate meets section 44 of the Constitution and budget an A$2,000 deposit per person. To share a group box on the Senate ballot, at least two candidates must apply together.', federalTimetable),
      stage('Voting day', 'Plan staffing and costs for this earliest usual date for a combined House and half-Senate election, as calculated by the Parliamentary Library. The official election order sets the actual date.', federalDates, '2027-08-07', 'planning', null, 'Earliest usual voting date'),
      stage('Claim election funding', 'Keep receipts and other proof of campaign costs the scheme will cover. You can submit a part or final claim from 20 days after voting day. Claims are generally due within six months. Check the AEC timetable.', federalClaims),
    ],
    participation: 'Federal registration lets a party officially back candidates for the House and Senate across Australia. Eligible people can run as independents. Section 44 of the Constitution sets eligibility rules, including rules on foreign citizenship and certain paid public positions. See how the Senate ballot works below.',
    funding: 'To qualify, reach 4% of valid first-choice votes in the relevant race. The new scheme starts at A$5 per eligible vote, with an adjustment before 2028. To claim above the automatic payment, show proof of eligible campaign costs. Separate support for eligible administration starts at A$7,500 per House member and A$3,750 per senator per quarter.',
    switching: 'An independent or former party member can apply to join under P4A’s rules. Elected members generally keep their seats if they leave or switch parties. A serving federal MP or senator can help a party qualify for registration if it meets the AEC rules. Funding from the last election stays with the original candidate or the party that backed them. If a senator elected for a party leaves an empty seat between elections, section 15 of the Constitution generally requires the replacement to come from that same party.',
    sources: [['Federal election window', federalDates], ['AEC party registration', federalParty], ['Nominations and deposits', federalCandidates], ['2027 funding changes', federalFunding], ['Funding for administration', federalAdmin], ['Leaving a party while in Parliament', changingParties], ['Australian Constitution, sections 15 and 44', constitution]],
  },
  {
    id: 'vic', label: 'VIC', name: 'Victoria', timeZone: 'Australia/Melbourne', minimum: 500,
    election: 'State election on 28 November 2026. The next regularly scheduled election is in November 2030.',
    membership: 'Count people on the Victorian electoral roll who are valid party members and meet the rules on membership of other parties. The deadlines to apply for party registration and nominate for the 2026 election have passed.',
    stages: [
      stage('Apply to register the party', 'Submit the constitution, officer details and a list of verified Victorian members. This was the Victorian Electoral Commission’s application deadline for the 2026 election.', vicParty, '2026-06-01', 'confirmed', null, null, 'Closed'),
      stage('Candidate nominations close', 'Submit the candidate forms and deposits by noon. Arrange official party backing or the local voter signatures needed for an independent to run.', vicDates, '2026-11-09', 'confirmed', '12:00', null, 'Closed'),
      stage('Voting day', 'Organise people for polling places, check campaign materials show who authorised them and check campaign records against payments. Nominations for this election have closed.', vicDates, vicPoll, 'confirmed'),
      stage('Claim election funding', 'Within 20 weeks of voting day, submit the audited campaign spending statement and the required certificate from the auditor. The date is calculated from the published election date.', vicClaims, daysAfter(vicPoll, 140), 'calculated'),
      stage('Apply for party registration for 2030', 'The current rule requires an application at least 180 days before voting day. This date uses the regular 2030 election cycle. Check the Victorian Electoral Commission’s published timetable.', vicLaws, daysAfter('2030-11-30', -180), 'calculated'),
      stage('Next regularly scheduled state election', 'Build a verified membership list and follow the next Victorian Electoral Commission timetable when it is published. The regular date is the last Saturday in November.', vicCycle, '2030-11-30', 'statutory'),
    ],
    participation: 'A registered party submits nominations for its candidates. Independents need signatures from six enrolled voters in their Legislative Assembly district or 50 in their Legislative Council region. The deposit is A$350 per candidate. Nominations for 2026 have closed.',
    funding: 'In 2026–27, the rates are A$7.70 per Assembly vote and A$3.84 per Council vote for eligible candidates who are elected or get at least 4% of valid first-choice votes. Payments cover up to the amount of audited campaign spending. A registered party’s first MP can qualify it for up to A$309,470 a year for administration at current rates. Eligible parties can also claim separate funding to develop policy.',
    switching: 'When a sitting MP joins or is officially backed by an eligible registered party, Victorian Electoral Commission funding for administration can start from that day. The amount is adjusted for the time that qualifies, and changes must be reported. Each house of Parliament has separate rules for filling an empty seat.',
    sources: [['VEC party registration', vicParty], ['2026 timetable', vicDates], ['Current rates', vicRates], ['Funding for administration and party changes', vicAdmin], ['Policy development funding', vicPolicy]],
  },
  {
    id: 'nsw', label: 'NSW', name: 'New South Wales', timeZone: 'Australia/Sydney', minimum: 750,
    election: 'State election on 13 March 2027. It is too late for P4A to use its party name on the ballot or qualify for funding as a registered party at this election.',
    membership: 'Count people on the NSW electoral roll who complete the NSW Electoral Commission’s member declaration. The registered officer, deputy and secretary must be on that roll too. Public funding also depends on whether senior officers are on the NSW roll, including the people who actually manage or control the party.',
    stages: [
      stage('Recommended date to apply for party registration', 'The NSW Electoral Commission recommends applying at least 16 months before voting day. Allow at least 12 weeks for assessment. A party must then be registered for at least 12 months to use its name on the ballot and qualify for party funding.', nswParty, '2025-11-13', 'planning'),
      stage('Be registered to qualify for 2027 party funding', 'A party must already have been registered for at least 12 months when the election is formally called. This date uses 22 February 2027, when the election is expected to be called. The NSW Electoral Commission confirms new parties are too late to qualify for 2027 party rights.', nswClaims, '2026-02-22', 'calculated'),
      stage('Election expected to be formally called', 'Check the published timetable for voter enrolment and campaign material rules. The time from the official order to hold the election, called a writ, until the official return of results does not count towards the registration waiting period.', nswDates, '2027-02-22', 'expected'),
      stage('Candidate nominations close', 'An eligible independent can apply to get on the Assembly ballot with 25 local voter signatures. Registering to campaign and applying to appear on the ballot are separate steps.', nswDates, '2027-02-24', 'confirmed', '12:00'),
      stage('Voting day', 'Keep track of campaign materials, spending and receipts through the election. For this election, P4A cannot use the ballot rights of a party that met the waiting period.', nswDates, '2027-03-13', 'confirmed'),
      stage('Claim election funding', 'The NSW Electoral Commission’s expected claim deadline is 120 days after the scheduled date for the official return of results. Check the final timetable.', nswDates, '2027-08-23', 'expected'),
      stage('Planning date to apply for party registration for 2031', 'Apply at least 16 months before voting day. This target uses the regular date, the fourth Saturday in March. Check the next NSW Electoral Commission timetable for changes.', nswCycle, '2029-11-22', 'planning'),
    ],
    participation: 'A party must finish the NSW waiting period before it can officially back candidates and use its name on the state ballot. An eligible independent running for the Legislative Assembly, the lower house, needs 25 voters enrolled in that district to nominate them. Party registration for local council elections requires 100 members and has its own 12-month wait.',
    funding: 'The main 2027 party category pays A$5.30 per Assembly vote and A$3.98 per Council vote. Rates or rules can differ for other categories. Payments cover up to the amount of eligible campaign costs. Eligible parties that qualified before can receive money in advance. After the registration waiting period, the separate New Parties Fund can cover eligible policy development costs.',
    switching: 'Election votes and funding stay with the candidate or party that originally qualified when a member changes parties. The NSW Administration Fund generally requires a party to have officially backed an elected member at the last election and still hold representation. An independent who joins a party can lose payments they qualified for as an independent. The Legislative Council has separate rules for filling an empty seat.',
    sources: [['What a NSW registered party can do', nswStatus], ['Election timetable', nswDates], ['Enrolment rules for party officers', nswOfficers], ['Campaign funding rates', nswRates], ['Administration Fund', nswAdmin], ['New Parties Fund', nswNew], ['NSW Constitution', nswConstitution]],
  },
  {
    id: 'nt', label: 'NT', name: 'Northern Territory', timeZone: 'Australia/Darwin', minimum: 200, minimumLabel: 'Minimum using local members',
    election: 'The regular election date set by law is 26 August 2028. The timetable can change.',
    membership: 'Apply with 200 members on the NT electoral roll or apply as a federally registered party. If using the 200-member route, each person counted must meet the NT Electoral Commission’s rules on membership of other parties. Both routes require a constitution and a separate NT application.',
    stages: [
      stage('Apply for territory registration', 'Submit the application before the six months leading up to voting day. Apply before 26 February 2028 and leave time for processing.', ntHandbook, '2028-02-26', 'calculated', null, 'Apply before this date'),
      stage('Election is formally called', 'Under the usual timetable set by law, the official order to hold the election, called a writ, comes 23 days before voting day. Check the published timetable.', ntAct, daysAfter(ntPoll, -23), 'calculated'),
      stage('Put candidates on the ballot', 'Nominations usually close seven days after the election is formally called. Parties and independents use different forms.', ntAct, daysAfter(ntPoll, -16), 'calculated'),
      stage('Voting day', 'The regular election is on the fourth Saturday in August. An early territory election or a clash with a federal election can change the date.', ntAct, ntPoll, 'statutory'),
      stage('File the campaign spending report', 'File a report on campaign spending even though the NT does not reimburse it. The usual deadline is 60 days after voting day.', ntAct, daysAfter(ntPoll, 60), 'calculated'),
    ],
    participation: 'The party’s registered officer submits its candidate nominations. An independent needs six enrolled voters from their division to nominate them. The candidate deposit is A$500.',
    funding: 'The NT has no public election funding for parties or candidates. They still have reporting obligations each year and during elections. Support for parliamentary offices follows separate rules.',
    switching: 'A member of the Legislative Assembly can change parties without automatically losing their seat. A serving member joining a party does not count as an alternative to federal registration or the required number of local members. The NT does not reimburse campaign spending.',
    sources: [['NTEC registration and requirements', ntParty], ['Registration handbook', ntHandbook], ['Candidate guidance', ntCandidates], ['Election finance', ntFunding], ['NT Self-Government Act', ntGovernment]],
  },
  {
    id: 'act', label: 'ACT', name: 'Australian Capital Territory', timeZone: 'Australia/Canberra', minimum: 100,
    election: 'Legislative Assembly election on 21 October 2028.',
    membership: 'Count members on the ACT electoral roll and adopt a party constitution. Check each member’s enrolment. Keep records of who is the party’s registered officer and what they can do on its behalf.',
    stages: [
      stage('Apply for ACT party registration', 'Apply to register a party or change its name before 1 July in the election year for the application to take effect at that election.', actParty, '2028-07-01', 'statutory', null, 'Apply before this date'),
      stage('Party register closes and candidate nominations open', 'The party register closes 36 days before voting day. Use the official dates for submitting nominations and check who can sign the paperwork.', actDates, '2028-09-15', 'confirmed'),
      stage('Candidate nominations close', 'The registered officer submits party nominations. Independent candidates need voter signatures and a deposit.', actDates, '2028-09-26', 'confirmed', '12:00'),
      stage('Voting day', 'Organise people in each electorate and keep records of donations and spending through voting day.', actDates, '2028-10-21', 'confirmed'),
      stage('Election funding payments', 'Elections ACT pays qualifying parties and candidates automatically after the final vote count. There is no claim deadline for that payment. Funding for administration is paid under separate quarterly rules.', actFunding),
    ],
    participation: 'The party’s registered officer submits its candidate nominations. An independent needs 20 people eligible to vote in that electorate to nominate them, and appears on the ballot outside the party groups.',
    funding: 'Elections ACT pays election funding automatically if a party or independent gets at least 4% of valid first-choice votes in the electorate. Add together all the first-choice votes for a party’s candidates there. The July–December 2026 rate is A$7.57412 per vote. In 2026 the separate rate for eligible administration is A$7,194.38 per Assembly member per quarter.',
    switching: 'A member of the Legislative Assembly can change parties without automatically losing their seat. Funding for administration can depend on how many days the member belongs to a registered party. Election funding follows the result and who originally backed the candidate.',
    sources: [['Elections ACT registration', actParty], ['2028 nominations and poll', actDates], ['Election and administration funding', actFunding], ['ACT Electoral Act', actAct], ['ACT Self-Government Act', actGovernment]],
  },
  {
    id: 'qld', label: 'QLD', name: 'Queensland', timeZone: 'Australia/Brisbane', minimum: 500,
    election: 'The regular state election date set by law is 28 October 2028.',
    membership: 'Count members on the Queensland electoral roll, adopt a constitution that meets the rules and appoint officers. A serving Queensland Assembly member can help a party register through the separate route for parties with a seat. State elections or by-elections can interrupt registration, including membership checks.',
    stages: [
      stage('Get the party registration application ready', 'P4A aims to have its application, list of members who agreed to be counted and officers ready before the rules on authorising campaign materials start. The registration process includes time for objections and can pause when an election is formally called.', qldParty, '2027-10-28', 'planning'),
      stage('Campaign material rules start', 'Decide who will approve campaign materials and check what authorisation details must appear before these rules start. They apply until voting day.', qldStages, '2027-10-28', 'confirmed'),
      stage('Campaign spending limits start', 'Set up the state campaign account, decide who can approve spending and arrange how to report it before the limits start.', qldStages, '2028-03-27', 'confirmed'),
      stage('Put candidates on the ballot', 'Use the deadline in the official election timetable. The registered officer submits party nominations. Independents arrange signatures from enrolled local voters and pay the deposit.', qldCandidates),
      stage('Voting day', 'The regular election is on the last Saturday in October. Check for any changes and the final timetable with the Electoral Commission of Queensland.', qldDates, qldPoll, 'statutory'),
      stage('File the election summary report', 'Submit the election summary within 15 weeks after voting day. Arrange a qualified auditor and keep the campaign bank records.', qldParty, daysAfter(qldPoll, 105), 'calculated'),
      stage('Claim election funding', 'Submit proof of eligible campaign spending within 20 weeks after voting day. Check the per-vote rate and whether you qualify in that district.', qldParty, daysAfter(qldPoll, 140), 'calculated'),
    ],
    participation: 'The party’s registered officer submits its candidate nominations. An independent needs six enrolled voters from their district to nominate them, plus an A$250 deposit. Campaign account and donation rules differ for state and council elections.',
    funding: 'The 2026–27 rate is A$7.127 per eligible first-choice vote for parties and A$3.564 for candidates. You need 4% of valid first-choice votes in the district. Payments cover up to the amount of approved campaign costs. Parliament has separate funding for policy work. Queensland council elections do not reimburse campaign spending.',
    switching: 'To qualify for policy funding, a registered party must have officially backed a candidate elected at the last general election and must still have representation in Parliament. A new party does not qualify simply because a serving MP joins it. An independent’s funding can also change if they join a registered party. Separate rules apply when a seat becomes vacant.',
    sources: [['Rules for registered parties', qldParty], ['Key dates for election participants', qldStages], ['Nomination rules', qldCandidates], ['Current funding rates', qldFunding], ['Electoral Act, sections 239–244', `${qldAct}#sec.239`], ['Rules for filling an empty Assembly seat', qldVacancies]],
  },
  {
    id: 'wa', label: 'WA', name: 'Western Australia', timeZone: 'Australia/Perth', minimum: 500,
    election: 'The regular state election date set by law is 10 March 2029.',
    membership: 'Submit signed declarations from members on the WA electoral roll, the party constitution and the A$2,000 application fee. The WA Electoral Commission estimates about four months for assessment. To meet the filing deadline, the date you submit the application is what counts.',
    stages: [
      stage('Apply to register the party', 'Apply before the 12 months leading up to the official order to hold the general election, called a writ. The order is expected on 7 February 2029 on the usual timetable. Plan to apply well before the February 2028 date shown.', waLead, '2028-02-07', 'calculated', null, 'Apply before this date'),
      stage('Choose the higher reimbursement rate', 'A newly registered party has 28 days after it is notified of registration to choose the higher rate. Record the notice date when it arrives.', waFunding),
      stage('Election is called and candidate nominations approach', 'The election is usually formally called on the first Wednesday in February. Check the official timetable for the separate nomination deadlines for party and independent candidates.', waDates, '2029-02-07', 'calculated'),
      stage('Voting day', 'The regular election is on the second Saturday in March. Check for changes to the election timetable.', waDates, waPoll, 'statutory'),
      stage('File the election finance report', 'Submit the election finance report within 12 weeks of voting day. Check the timetable and other campaign finance requirements.', waFinance, daysAfter(waPoll, 84), 'calculated'),
      stage('Claim reimbursement for campaign costs', 'Submit the separate reimbursement claim within 20 weeks of voting day. Keep the invoices and proof of payment for campaign costs the scheme covers.', waFinance, daysAfter(waPoll, 140), 'calculated'),
    ],
    participation: 'Registered parties can nominate candidates under their registered name. Independents can nominate separately. Check the forms and rules for Legislative Council groups, the signatures candidates need and the deposit they must pay.',
    funding: 'The number of eligible first-choice votes sets the limit on what can be paid back for qualifying campaign costs. The vote share generally has to be above 4%. To use the higher rate, a party must choose it within 28 days of being notified of its registration. Some campaign rules also apply to unregistered parties.',
    switching: 'When a member switches parties, the funding from the original election stays with whoever qualified for it. WA still requires 500 members to register P4A if a serving MP joins. Check with the relevant house of Parliament about ongoing support and the separate rules for filling an empty seat.',
    sources: [['WAEC registration', waParty], ['Application cut-off rule', waLead], ['Ordinary election timeline', waDates], ['Reimbursement and opt-in', waFunding], ['WA Electoral Act', waAct]],
  },
  {
    id: 'tas', label: 'TAS', name: 'Tasmania', timeZone: 'Australia/Hobart', minimum: 100,
    election: 'The next House of Assembly election date has yet to be announced. Elections for some Legislative Council seats are due in May 2027.',
    membership: 'Count people on the Tasmanian electoral roll who complete the required member declaration. The public may be able to inspect the names and addresses of members counted for registration. Explain this before collecting declarations.',
    stages: [
      stage('Apply for party registration', 'Allow 30 days for objections, plus time for a decision. Processing generally pauses from the official order to hold the election, called a writ, until the official return of results. The Assembly election date can change, so apply early.', tasParty),
      stage('Voting day for the Legislative Council seats due in 2027', 'Derwent, Mersey and Windermere are due in May 2027. The law sets the first Saturday as the usual date, but another Saturday can be officially set. The Council has its own campaign spending rules.', tasCouncil, '2027-05-01', 'statutory', null, 'Usual Council voting date'),
      stage('Assembly term scheduled to end', 'This date is four years after the official return of the 2025 election results. The Assembly can be dissolved earlier. Voting day is set separately.', tasReport, '2029-08-05', 'calculated', null, 'Scheduled end of Assembly term'),
      stage('Put candidates on the Assembly ballot', 'Nominations usually close seven to 21 days after the election is formally called. Check the official order and the number of voter signatures needed for independent candidates and groups without a party.', tasAct),
      stage('Assembly voting day', 'Voting day is usually a Saturday 22 to 30 days after nominations close. The official election order and any later official notice set the date.', tasAct),
      stage('Claim Assembly campaign funding', 'Claims are usually due 120 days after the official return of results. Keep proof of campaign costs the fund will cover.', tasClaims),
    ],
    participation: 'An independent running for the Assembly needs 10 enrolled voters in their division to nominate them. A group without a party needs 100. The deposit is A$400 per candidate. Parties can officially back Legislative Council candidates. The parties themselves are barred from spending on those campaigns.',
    funding: 'Assembly election funding pays back eligible campaign costs up to a limit based on votes. In 2025 the rate was A$6.12 per vote. In 2026 the Administration Fund covers up to A$11,600 per quarter for one qualifying Assembly member. The Legislative Council has its own spending rules.',
    switching: 'A member can change parties without automatically losing their seat. When an Assembly member joins a party, they can count towards funding for administration only if the legal conditions are met. These include the party being registered at the last general election and officially backing the member throughout the quarter it claims for.',
    sources: [['TEC party registration', tasParty], ['Assembly term and Council cycles', tasConstitution], ['Assembly candidate nomination', tasCandidates], ['Council spending rules', tasCouncilMoney], ['Election Campaigns Fund', tasClaims], ['Administration Fund and party changes', tasFundingAct], ['Current administration rates', tasAdmin]],
  },
  {
    id: 'sa', label: 'SA', name: 'South Australia', timeZone: 'Australia/Adelaide', minimum: 200,
    election: 'The regular state election date set by law is 16 March 2030.',
    membership: 'Count enrolled voters who sign membership declarations, adopt a constitution that meets the rules and appoint officers. A party usually waits eight months after registration to nominate candidates and use its name on the ballot. The period from the official order to hold a general election to the official return of results does not count.',
    stages: [
      stage('Planning date for registration approval', 'Aim for approval well before this date. It is eight months before the election would usually be formally called. The time from a general election being called to the official return of results does not count towards the wait.', saAct, '2029-06-16', 'planning'),
      stage('Election expected to be formally called', 'Set up the state campaign account and get the funding certificate arrangements ready. The official order to hold the election usually comes 28 days before voting day.', saAct, daysAfter(saPoll, -28), 'calculated'),
      stage('Put candidates on the ballot', 'The usual nomination day is three days after the voter roll closes. Party nominations are due at least 48 hours before the official nomination deadline. Check the Electoral Commission of South Australia timetable for exactly when it accepts forms.', saAct, daysAfter(saPoll, -19), 'calculated', null, 'Usual nomination day'),
      stage('Voting day', 'The regular election is on the third Saturday in March. Check the official timetable and whether an exception changes the date.', saDates, saPoll, 'statutory'),
      stage('File the public funding certificate', 'Check which funding and donation rules apply before accepting campaign money. Eligible claims can use a certificate filed before voting day or, where allowed, within 14 days after voting day.', saClaims, daysAfter(saPoll, 14), 'calculated'),
      stage('File the campaign spending report', 'Check the campaign records against the bank account and submit the spending report within 60 days after voting day.', saAct, daysAfter(saPoll, 60), 'calculated'),
    ],
    participation: 'A registered party must finish the waiting period before it can use its name on the ballot and put forward candidates as a party. Independents have separate nomination and finance rules. Whether a new party or candidate can accept donations depends on how the law classifies them and the funding option they choose.',
    funding: 'Winning a seat or reaching the applicable vote share, 4% for the House of Assembly or 2% for the Legislative Council, can qualify a party or candidate for payment towards eligible campaign costs. There are limited exceptions to the donation and loan ban for newcomers. Money paid in advance may have to be repaid. To qualify for funding for administration, a party needs representation and must have been registered at the last election.',
    switching: 'Funding from the last election does not transfer when a member changes parties. A serving MP joining a new party does not meet the Administration Fund rule that the party was registered at the last election. An independent who stops qualifying for funding may have to repay money they have yet to spend.',
    sources: [['ECSA registration', saParty], ['Ordinary election cycle', saDates], ['Electoral Act and waiting period', saAct], ['Donation and funding reforms', saFinance], ['Public funding claim guide', saClaims], ['Administrative funding', saAdmin]],
  },
];
