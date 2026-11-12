const staffingRules = 'https://maps.finance.gov.au/pay-and-employment/mops-act-employment/recruitment-and-establishing-positions/salary-employment-types-and-positions';
const parliamentStaff = 'https://www.aph.gov.au/About_Parliament/House_of_Representatives/Powers_practice_and_procedure/Practice7/HTML/Chapter6/Staff_of_the_House_and_administration';
const ggOffice = 'https://www.gg.gov.au/office-official-secretary-governor-general';

const staffingByRegion = [
  {
    title: 'Federal Parliament',
    body: 'An MP or senator can employ up to five full-time-equivalent electorate staff under the 2025 determination. An approved second or third electorate office adds one position per office. Personal staff for other offices have a separate allocation. For example, Finance recorded seven personal staff positions each for the Speaker and Senate President on 1 February 2026. That is a dated allocation of positions. Check the current approval before recruiting.',
    sources: [
      ['Electorate staffing determination, section 7', 'https://www.legislation.gov.au/F2025N00144/asmade/text'],
      ['Finance estimates table for 1 February 2026, page 9', 'https://www.aph.gov.au/-/media/Estimates/fpa/add2526/12_Personal_Employee_Positions.pdf#page=9'],
      ['Finance guide to personal staff allocations', staffingRules],
    ],
  },
  {
    title: 'New South Wales',
    body: 'Your council’s expenses and facilities policy sets councillor and mayoral support. The 2026 state determination provides ordinary lower-house MPs three staff per electorate office and ordinary upper-house MPs one, with some extra crossbench and independent support. From 1 May 2027 the lower-house baseline adds one position for Parliament or an electorate office and the upper-house baseline rises to two. Ministers employ office staff under Premier-approved arrangements. The Speaker and Legislative Council President have separate arrangements for their office staff.',
    sources: [
      ['NSW guide to council support for mayors and councillors', 'https://www.olg.nsw.gov.au/sites/default/files/2026-02/guidelines-for-the-payment-of-expenses-and-the-provision-of-facilities-for-mayors-and-councillors-in-nsw.pdf'],
      ['NSW 2026 staffing determination, clause 7.2', 'https://www.nsw.gov.au/sites/default/files/2026-07/prt-2026-annual-determination.pdf#page=180'],
      ['NSW Members of Parliament Staff Act', 'https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2013-041'],
    ],
  },
  {
    title: 'Victoria',
    body: 'Councils provide reasonable facilities and resources to mayors and councillors, and the council CEO appoints council staff. MPs nominate their electorate officers, who are jointly employed by the Speaker and Legislative Council President. Parliament reported funding equivalent to 2.5 full-time electorate officers per MP at June 2025 estimates. Ministers have separate staff employed by the Premier. Parliamentary officers serve the houses under the parliamentary administration overseen by the Speaker and President.',
    sources: [
      ['Victorian Local Government Act, sections 42 and 48', 'https://www.legislation.vic.gov.au/in-force/acts/local-government-act-2020'],
      ['Victorian Parliament evidence to June 2025 budget estimates', 'https://www.parliament.vic.gov.au/49e8f9/contentassets/66906231a9de408e80dc1a4f49688783/paec-2025-26-budget-estimates-12-june-parliamentary-departments.pdf'],
      ['People in the Victorian Parliament', 'https://www.parliament.vic.gov.au/about/how-parliament-works/people-in-parliament'],
      ['Victoria’s Ministerial Code of Conduct', 'https://www.vic.gov.au/ministerial-code-of-conduct'],
    ],
  },
  {
    title: 'Queensland',
    body: 'Council administrative support follows the council chief executive’s rules. Council advisers have their own legal arrangements. The Queensland Parliament’s May 2026 handbook provides for one full-time electorate officer and two full-time assistants for an MLA, subject to the Clerk’s approval. Some very large electorates with a second office qualify for another officer. The Premier approves ministerial staffing. The Speaker oversees the Parliamentary Service, which the Clerk manages.',
    sources: [
      ['Local Government Act, sections 170AA and 197A', 'https://www.legislation.qld.gov.au/view/whole/html/inforce/current/act-2009-017'],
      ['Queensland MPs’ handbook, electorate office staffing', 'https://documents.parliament.qld.gov.au/Members/entitlements/Remuneration%20Handbook.pdf'],
      ['Queensland ministerial office staffing', 'https://www.premiers.qld.gov.au/publications/categories/policies-and-codes/handbooks/ministerial-handbook/human-resource/office-staff.aspx'],
      ['Queensland Parliament officers', 'https://www.parliament.qld.gov.au/Visit-and-learn/About-Us/Officers-of-the-Queensland-Parliament'],
    ],
  },
  {
    title: 'Western Australia',
    body: 'The council employs the chief executive, who leads the council employees. The October 2025 Morton Review reported two full-time-equivalent electorate staff as the standard for state MPs. May 2026 estimates described extra staffing for some regional and upper-house crossbench MPs. Ministerial staff work in separately funded executive offices. The Speaker’s office sits within the Department of the Legislative Assembly alongside the Clerk and the offices that support the chamber and committees.',
    sources: [
      ['WA guide to who does what in a council', 'https://www.wa.gov.au/organisation/local-government/local-government-decision-making'],
      ['Morton Review of WA electorate office staffing, page 31', 'https://www.parliament.wa.gov.au/publications/tabledpapers.nsf/displaypaper/4210692c43fbe5c55fc5f4d748258d260006c220/%24file/tp-692.pdf'],
      ['WA Parliament May 2026 staffing evidence', 'https://www.parliament.wa.gov.au/hansard/daily/esta/2026-05-21/4'],
      ['WA Department of the Legislative Assembly', 'https://www.parliament.wa.gov.au/WebCMS/webcms.nsf/content/department-of-the-legislative-assembly'],
    ],
  },
  {
    title: 'South Australia',
    body: 'The council collectively appoints the chief executive, who manages council employees. Treasury’s April 2024 lower-house induction guide recorded two full-time-equivalent positions for an Assembly MP, an office manager and an assistant. It listed possible extras for some country MPs and office-holders, including the Speaker. The upper house has separate arrangements. The Premier appoints ministers’ personal staff. The Clerks and chamber staff support the Speaker and Legislative Council President in their parliamentary duties.',
    sources: [
      ['South Australian guide to councils and their roles', 'https://www.councilelections.sa.gov.au/about/councils'],
      ['Treasury release containing the 2024 Assembly induction guide', 'https://www.treasury.sa.gov.au/__data/assets/pdf_file/0016/1070305/FOI-Determination-T-and-F24_0997.pdf'],
      ['South Australian Public Sector Act, sections 71 and 72', 'https://www.legislation.sa.gov.au/_legislation-documents/lz/c/a/public-sector-act-2009/current/2009.37.auth.pdf'],
      ['South Australian Parliament’s officers', 'https://www.parliament.sa.gov.au/en/About-Parliament/Officers-of-the-Parliament'],
    ],
  },
  {
    title: 'Tasmania',
    body: 'The council general manager appoints and directs council employees, who can support the mayor and councillors in their duties. The Department of Premier and Cabinet administers lower-house electorate offices. Its August 2025 handbook describes funding for one full-time staff position, which can be split into part-time jobs. Actual allocations can vary. The Legislative Council administers its own members’ electorate offices. The Premier’s Chief of Staff and Premier determine staffing for ministerial offices and the Speaker’s office.',
    sources: [
      ['Tasmanian Local Government Act, section 63', 'https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-1993-095#GS63'],
      ['Tasmanian elected members’ and office-holders’ handbook', 'https://www.dpac.tas.gov.au/__data/assets/pdf_file/0032/495356/Handbook-Elected-Members-and-Prescribed-Office-Holders.PDF'],
      ['Tasmanian Parliament recruitment and support roles', 'https://www.parliament.tas.gov.au/parliament-of-tasmania-recruitment'],
    ],
  },
  {
    title: 'Australian Capital Territory',
    body: 'The ACT Assembly covers territory and local responsibilities. Separate legal instruments set salary caps for non-ministerial Assembly members and the Speaker. Ministers employ staff under the office-holder provisions of the Members’ Staff Act. The Office of the Legislative Assembly, led by the Clerk, is the independent service for the Assembly. Salary caps are budgets to check before hiring.',
    sources: [
      ['ACT Members’ Staff Act and current salary cap determinations', 'https://legislation.act.gov.au/a/1989-19/'],
      ['ACT Assembly careers and types of parliamentary employment', 'https://www.parliament.act.gov.au/functions/tru/careers'],
    ],
  },
  {
    title: 'Northern Territory',
    body: 'The council appoints the chief executive, who manages council employees. Under the Territory’s 2026 arrangements, Assembly members get one full-time-equivalent electorate officer and assistant support. Some named remote electorates also get a full-time-equivalent liaison officer. Ministers have separate executive offices. The Speaker oversees the Assembly Department and the Clerk leads its administration.',
    sources: [
      ['NT Local Government Act, sections 166 to 171', 'https://legislation.nt.gov.au/Legislation/LOCAL-GOVERNMENT-ACT-2019'],
      ['NT Assembly members’ current staffing determinations', 'https://parliament.nt.gov.au/members/entitlements'],
      ['NT Assembly Department structure', 'https://parliament.nt.gov.au/thedepartment/structure'],
      ['NT Cabinet Handbook on ministerial offices', 'https://territorystories.nt.gov.au/10070/1050213/0/28'],
    ],
  },
];

export const officeTrainingTrack = {
  id: 'serving-in-office',
  title: 'Serving in office',
  entryTitle: 'Serve or support an office',
  description: 'Explore what elected office involves, from council decisions and office staffing to parliamentary procedure.',
  practice: 'Explain who made a decision and why. Protect people’s private details and share the public evidence others need to understand or challenge the decision.',
  modules: [
    {
      id: 'staffing-elected-office',
      title: 'Who staffs an elected office?',
      summary: 'Compare staffing for councils, electorate offices, ministers, whips and presiding officers.',
      minutes: 9,
      sections: [
        { title: 'Start with council staff and local support', body: 'A council’s chief executive or general manager runs the administration and manages staff who deliver services. Elected councillors set direction through council decisions and can use the council’s process for getting advice and administrative help. A mayor or councillor may have extra support under local rules. Ask who employs the person, who can direct their work and what the support can be used for.' },
        { title: 'Staff an MP’s electorate office', body: 'Electorate staff help with constituent enquiries, community meetings, correspondence and parliamentary work. Check the current staffing allocation and whether it is measured in positions, equivalent full-time hours or money. Two half-time staff can fill one full-time-equivalent position. In federal Parliament the MP or senator employs staff on behalf of the Commonwealth within approved arrangements, and the Department of Finance administers contracts and pay.' },
        { title: 'Check the extra allocation for a second role', body: 'A minister or assistant minister can have a team of personal advisers for their portfolio. At federal level, the Prime Minister approves those allocations and allocates personal positions to whips and opposition and minority party leaders. The Opposition Leader can assign positions to shadow ministers and other office-holders. Independents and presiding officers can also have separate allocations. Ask for the current approval for the exact role before offering a job.' },
        { title: 'Keep advice and decision-making separate', body: 'A minister’s advisers work in the minister’s office. Public servants in the portfolio department provide advice, administer programs and carry out decisions under their own responsibilities. A departmental liaison officer can work in the minister’s office while remaining a public servant. Check who can give instructions, sign off on a decision and hold the official record.' },
        { title: 'Know who serves the chamber', body: 'The Speaker or Senate President can have staff for their own office. The Clerk and staff of the parliamentary departments serve the chamber and its members. They advise on procedure, keep the official record and support committees. Party and election campaign work has its own staffing and budget. Check the public office’s rules before using its staff or resources.' },
      ],
      regions: staffingByRegion,
      exercise: {
        question: 'A federal MP becomes a shadow minister and wants to hire a policy adviser. What should the MP check first?',
        options: [
          { label: 'Assume every shadow minister automatically gets the same extra position.', feedback: 'Staffing depends on the approved allocation for that office.', correct: false },
          { label: 'Confirm the personal staffing allocation assigned to the role and recruit within it.', feedback: 'The Opposition Leader can distribute approved personal positions to shadow ministers. That allocation has its own rules alongside the electorate office allocation.', correct: true },
          { label: 'Ask the government department to appoint the shadow minister’s adviser.', feedback: 'The MP recruits an office adviser through the approved parliamentary staffing arrangements. Department staff have their own employer and responsibilities.', correct: false },
        ],
      },
      sources: [
        ['Commonwealth Members of Parliament (Staff) Act', 'https://www.legislation.gov.au/C2004A02928/latest/details'],
        ['Finance guide to electorate, ministerial and other personal positions', staffingRules],
        ['Finance guide to employment agreements and recruitment', 'https://maps.finance.gov.au/pay-and-employment/mops-act-employment/recruitment-and-establishing-positions/employment-agreements-and-contracts'],
        ['Parliamentary Workplace Support Service guide to recruiting for capability', 'https://www.pwss.gov.au/resources/recruiting-capability-factsheet'],
        ['How ministers’ offices work with departments', 'https://www.pmc.gov.au/resources/guidance-caretaker-conventions/7-avoiding-aps-involvement-election-activities'],
        ['Parliament’s guide to the Clerk and parliamentary departments', parliamentStaff],
      ],
    },
    {
      id: 'parliamentary-and-ceremonial-roles',
      title: 'The Speaker, the whip and the Governor-General',
      summary: 'Learn who chairs debate, who organises a party’s MPs, who carries the Mace and who gives Royal Assent.',
      minutes: 8,
      sections: [
        { title: 'The Speaker, President and Clerk', body: 'The House elects its Speaker and the Senate elects its President. Each chairs their chamber, applies its rules and maintains order. Deputies can take the chair. The Clerk is a parliamentary officer who advises the chair and members on procedure and oversees the official record. State and territory chambers have their own presiding officers and rules.' },
        { title: 'The whip organises the party in Parliament', body: 'A party whip is usually an MP or senator who coordinates their party’s speakers and makes sure members are available for votes. Whips can arrange a pair when someone is absent. That is an agreement between parties to balance absences for a vote. The chair still runs the debate and applies the chamber’s rules.' },
        { title: 'The Mace and the Black Rod', body: 'The Serjeant-at-Arms carries the Mace as the Speaker enters the House of Representatives and helps maintain order. The Usher of the Black Rod is a Senate officer who carries the Black Rod on formal occasions, helps maintain order and delivers messages between chambers. At the opening of a new Parliament, the Usher summons House members to the Senate for the Governor-General’s speech.' },
        { title: 'What the Governor-General actually does', body: 'The Governor-General represents the King in Australia. The King appoints the Governor-General on the Australian Prime Minister’s advice. The Governor-General gives Royal Assent to federal bills, commissions the Prime Minister and appoints ministers. The office generally acts on ministerial advice and has reserve powers for exceptional situations. Ceremonial duties include opening Parliament and presenting Australian honours.' },
        { title: 'Who supports the Governor-General and the states', body: 'The Official Secretary employs staff under the Governor-General Act. The office supports official duties, events, residences and the honours system. Each state has a Governor. The Northern Territory has an Administrator with comparable statutory, ceremonial and civic duties. The ACT has its own self-government arrangements and no territory Governor.' },
      ],
      exercise: {
        question: 'At the opening of a new federal Parliament, who summons House members to the Senate and who delivers the opening speech?',
        options: [
          { label: 'The party whip summons them and the Speaker delivers the speech.', feedback: 'The whip organises party business. The Speaker chairs the House.', correct: false },
          { label: 'The Serjeant-at-Arms summons them and the Senate President delivers the speech.', feedback: 'The Serjeant-at-Arms carries the House Mace. The President chairs the Senate.', correct: false },
          { label: 'The Usher of the Black Rod summons them and the Governor-General delivers the speech.', feedback: 'The Usher carries the Senate’s message to the House. The Governor-General addresses both chambers gathered in the Senate.', correct: true },
        ],
      },
      sources: [
        ['Parliamentary Education Office guide to opening a new Parliament', 'https://peo.gov.au/understand-our-parliament/how-parliament-works/parliament-at-work/a-new-parliament'],
        ['House guide to the Speaker, parties and whips', 'https://www.aph.gov.au/About_Parliament/House_of_Representatives/Powers_practice_and_procedure/00_-_Infosheets/Infosheet_19_-_The_House_government_and_opposition'],
        ['Serjeant-at-Arms and the Mace', 'https://peo.gov.au/understand-our-parliament/parliament-and-its-people/people-in-parliament/serjeant-at-arms'],
        ['Senate roles including the President, Clerk and Usher', 'https://www.aph.gov.au/About_Parliament/Senate/About_the_Senate'],
        ['Governor-General’s constitutional, ceremonial and community duties', 'https://www.gg.gov.au/about-governor-general/civics-and-democracy'],
        ['Office of the Official Secretary to the Governor-General', ggOffice],
        ['Governor-General Act, including how staff are employed', 'https://www.legislation.gov.au/C2004A00075/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html'],
        ['Australian Government guide to state Governors and other elected and appointed roles', 'https://immi.homeaffairs.gov.au/citizenship/test-and-interview/listen-to-podcast/transcript-episode-4'],
        ['Role of the Northern Territory Administrator', 'https://govhouse.nt.gov.au/the-administrator/role-of-the-administrator'],
        ['ACT Assembly guide to the levels of government', 'https://www.parliament.act.gov.au/visit-and-learn/learn/resources/fs/levels-of-gov'],
      ],
    },
    {
      id: 'what-councillors-do',
      title: 'What does a local councillor do?',
      summary: 'See how listening, council decisions and day-to-day service delivery fit together.',
      minutes: 5,
      sections: [
        { title: 'Make decisions for the whole area', body: 'Elected councillors help set the council’s plans, policies and budget. They listen to residents, ask staff for information through the council’s processes and vote at council meetings. A councillor may represent a ward or the whole council area. In the ACT, the Legislative Assembly is also responsible for local services.' },
        { title: 'Help a resident get to the right place', body: 'Council staff manage day-to-day services. For a damaged footpath, a councillor can help a resident find the service request process and raise patterns of repeat damage in a council discussion. Read a recent council agenda and minutes to see which decisions councillors made and how the reasons were recorded.' },
        { title: 'Raise personal interests early', body: 'If a matter could affect you, your family or your business, check the rules on declaring interests before you take part. Follow the process that applies to the kind of interest you have. The meeting record can show how it was handled.' },
      ],
      exercise: {
        question: 'A resident asks you, as a new councillor, to order a council worker to repair their footpath tomorrow. What do you do?',
        options: [
          { label: 'Direct the worker to move the request ahead of the other jobs.', feedback: 'Day-to-day work is managed by council staff. Use the council’s service process and raise wider concerns through the council.', correct: false },
          { label: 'Help the resident report it through council and follow up through the proper channel.', feedback: 'This helps the resident while keeping decisions about maintenance with the people responsible for delivering it.', correct: true },
          { label: 'Tell them every individual repair needs a vote of the council.', feedback: 'Use the service request process for an individual repair. The council can consider broader maintenance policy or budgets.', correct: false },
        ],
      },
      sources: [['Parliamentary Education Office guide to local government', 'https://peo.gov.au/understand-our-parliament/how-parliament-works/three-levels-of-government/three-levels-of-government-governing-australia']],
    },
  ],
};
