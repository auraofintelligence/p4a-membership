export const trainingPathways = [
  {
    id: 'federal',
    title: 'Federal Parliament',
    summary: 'Compare a House run with a Senate run and prepare for federal funding and disclosure rules.',
    minutes: 8,
    sections: [
      {
        title: 'Choose the House or the Senate',
        body: 'The House of Representatives elects one member from each federal electorate. Senate candidates run across a state or territory. The Australian Electoral Commission, or AEC, runs both elections. Choose one office for elections held on the same day, then find your electorate or state or territory and the applicable nomination instructions.'
      },
      {
        title: 'Check eligibility and line up your nomination',
        body: 'You must be at least 18, an Australian citizen and eligible to enrol for a House election. Check the AEC qualification checklist early, including section 44 of the Constitution if you have another citizenship or a government position. A first-time unendorsed candidate normally needs 100 eligible nominators from the House electorate or Senate state or territory. A registered party’s officer can nominate endorsed candidates. The AEC nomination guide lists a $2,000 deposit for each candidate.'
      },
      {
        title: 'Decide how to appear on the Senate ballot',
        body: 'A Senate candidate can stand alone or request a group with at least one other candidate. Unendorsed candidates can request a group too. Each unendorsed candidate in a group needs their own set of eligible nominators. Grouped candidates have an above-the-line box for the group. A solo ungrouped candidate is listed below the line, where voters rank people by name. Ask the AEC which forms and deadlines apply before gathering signatures.'
      },
      {
        title: 'Use the rules for the date and election',
        body: 'The new Commonwealth funding and disclosure rules start on 1 January 2027. They introduce federal campaign accounts and change gift caps, spending caps and reporting. Check the AEC transition guidance before you receive gifts or spend money, especially if the campaign crosses that date. Confirm your deadlines and limits for your office and election, keep receipts and record who is responsible for reporting.'
      }
    ],
    exercise: {
      question: 'Alex and Sam want to stand for the Senate in the same state without party endorsement. They want an above-the-line box. Which step should they plan for?',
      options: [
        {
          label: 'Nominate separately and wait for the AEC to combine their names.',
          feedback: 'Grouping requires a request. Check the AEC grouping forms and deadline before submitting nominations.',
          correct: false
        },
        {
          label: 'Submit a joint grouping request and prepare a separate set of eligible nominators for each candidate.',
          feedback: 'Two or more Senate candidates can request to be grouped. The AEC nomination guide explains the separate nominators and the forms.',
          correct: true
        },
        {
          label: 'Use one set of nominators for both candidates.',
          feedback: 'Each unendorsed candidate in the group needs their own eligible nominators. Plan for each candidate’s deposit too.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'AEC candidate eligibility and qualification checklist',
        'https://www.aec.gov.au/Elections/candidates/qualification.htm'
      ],
      [
        'AEC nomination guide and forms for both houses',
        'https://www.aec.gov.au/elections/candidates/nominating.htm'
      ],
      [ 'AEC example Senate ballot', 'https://www.aec.gov.au/voting/How_to_vote/Voting_Senate.htm' ],
      [ 'AEC funding and disclosure changes from 1 January 2027', 'https://www.aec.gov.au/FADReform/' ]
    ]
  },
  {
    id: 'nsw',
    title: 'New South Wales',
    summary: 'Choose a local or state race and check who runs it, how to get on the ballot and which finance rules apply.',
    minutes: 7,
    sections: [
      {
        title: 'Find your council election and ward',
        body: 'Check your council’s election notice for who is running the election, whether there are wards and how the mayor is chosen. A council can engage the NSW Electoral Commissioner or a private election provider. The Office of Local Government encourages optional pre-election sessions. Councils provide induction and ongoing learning for mayors and councillors after election.'
      },
      {
        title: 'Get on a council ballot',
        body: 'For the route that uses voter nominations, arrange at least two eligible nominators. They must be enrolled in your ward for a ward seat, or in the council area for a mayoral or whole-council race. Check your own eligibility, the nomination form and the deposit with the election provider. The NSW Electoral Commission uses paper forms for council by-elections.'
      },
      {
        title: 'Choose a state seat',
        body: 'The NSW Electoral Commission runs state elections. The Legislative Assembly is the lower house and represents local districts. The Legislative Council is the upper house and is elected statewide. An independent Assembly candidate can be nominated by 25 electors enrolled in the district. Use the form for the house and election you are entering, and check deadlines for the deposit and any optional ballot logo.'
      },
      {
        title: 'Set up campaign finances',
        body: 'Campaign registration and ballot nomination have separate forms. If you are a new candidate, register with the NSW Electoral Commission before accepting political donations or paying campaign expenses. Check when you need a dedicated campaign account, what limits apply and when reports are due. Save receipts and record who paid for each campaign cost.'
      }
    ],
    exercise: {
      question: 'Sam has registered to accept donations and is standing for a council ward. What does Sam still need to do to get on the ballot through the voter nomination route?',
      options: [
        {
          label: 'Submit the election’s nomination form with two eligible ward nominators and pay the deposit by the deadline.',
          feedback: 'The voter nomination route uses electors enrolled in that ward. Follow the notice for where to lodge the form and how to pay.',
          correct: true
        },
        {
          label: 'Ask any two people in the council area to sign.',
          feedback: 'For a ward election, the nominators need to be enrolled in the ward being contested.',
          correct: false
        },
        {
          label: 'Add the ward to the campaign registration.',
          feedback: 'Campaign registration covers donations and payments. Submit a separate nomination for ballot entry.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'NSW Electoral Commission on council elections',
        'https://elections.nsw.gov.au/elections/how-voting-works/voting-in-new-south-wales/how-does-a-local-government-election-work'
      ],
      [
        'Council candidate nominations',
        'https://elections.nsw.gov.au/candidate-handbook-nsw-local-government-elections/nominations/the-nomination-process'
      ],
      [
        'Office of Local Government on candidate sessions and induction',
        'https://www.olg.nsw.gov.au/councils/governance/councillor-induction'
      ],
      [
        'State candidate nominations',
        'https://elections.nsw.gov.au/political-participants/candidates-and-groups/candidate-nominations-for-state-elections'
      ],
      [
        'Legislative Assembly nomination handbook',
        'https://elections.nsw.gov.au/candidate-handbook-nsw-state-by-elections/nomination/nomination-as-a-candidate-legislative-assembly'
      ],
      [
        'NSW campaign registration and financial obligations',
        'https://elections.nsw.gov.au/political-participants/candidates-and-groups/register-to-start-campaigning'
      ]
    ]
  },
  {
    id: 'vic',
    title: 'Victoria',
    summary: 'Compare local and state nominations, including the council training requirement and Melbourne’s leadership election.',
    minutes: 7,
    sections: [
      {
        title: 'Complete the council course',
        body: 'The Victorian Electoral Commission runs local council elections. Complete Local Government Victoria’s compulsory candidate training before nominating, including for a by-election. The course takes around an hour. Keep the certificate and completion date. The commission’s nomination guide says the training must have been completed within two years before election day.'
      },
      {
        title: 'Book your council nomination',
        body: 'Check your enrolment and eligibility in the council area. Use the election office’s appointment process to lodge your completed forms and bring the required fee. The general council guide lists $250 in cash. For a City of Melbourne leadership team election, the Lord Mayor and Deputy Lord Mayor candidates stand together and lodge their nominations jointly. Use the Melbourne candidate kit for that race.'
      },
      {
        title: 'Prepare a state nomination',
        body: 'The commission also runs state elections. An independent needs at least six eligible nominators for a Legislative Assembly district in the lower house, or 50 for a Legislative Council region in the upper house. A registered party uses the commission’s central process for its endorsed candidates. Check the election notice for the filing location, deadline and deposit.'
      },
      {
        title: 'Match the finance rules to the election',
        body: 'Council candidates report campaign donations to their council, including a return when there are no gifts to report. For a state campaign, check whether you need a dedicated state campaign account and check current rules on caps, disclosure and prohibited donations before handling money. Use the commission’s guidance for your candidate category.'
      }
    ],
    exercise: {
      question: 'Mika completed the Victorian council course three years before the coming council election. What should Mika do before nominating?',
      options: [
        {
          label: 'Take the official course again and keep the new completion certificate.',
          feedback: 'The Victorian Electoral Commission’s council nomination guide uses a two-year window measured from election day.',
          correct: true
        },
        {
          label: 'Submit the three-year-old certificate as current.',
          feedback: 'The certificate is older than the two-year window in the council nomination guide.',
          correct: false
        },
        {
          label: 'Use this P4A module as proof of completion.',
          feedback: 'Local Government Victoria issues the certificate for its official candidate course.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'Local Government Victoria’s official candidate course',
        'https://www.localgovernment.vic.gov.au/council-governance/candidate-training'
      ],
      [
        'Victorian Electoral Commission council nomination guide',
        'https://www.vec.vic.gov.au/candidates-and-parties/becoming-a-local-council-candidate/how-to-nominate'
      ],
      [
        'City of Melbourne leadership team and councillor handbook',
        'https://www.vec.vic.gov.au/-/media/6a40c1fbbe4b495094fe124e527e35e0.pdf'
      ],
      [
        'Council candidate eligibility and donation returns',
        'https://www.vec.vic.gov.au/candidates-and-parties/becoming-a-local-council-candidate'
      ],
      [
        'State election candidate resources',
        'https://www.vec.vic.gov.au/candidates-and-parties/become-a-state-election-candidate/state-election-candidate-resources'
      ],
      [
        'State political donations and accounts',
        'https://www.vec.vic.gov.au/candidates-and-parties/political-donations'
      ]
    ]
  },
  {
    id: 'queensland-council-nomination',
    title: 'Queensland',
    summary: 'Choose between council and state Parliament, complete any required training and prepare your nomination.',
    minutes: 8,
    sections: [
      {
        title: 'Choose the office',
        body: 'Councils decide on local matters such as parks and waste collection. Queensland’s state Parliament makes state laws and has one house, the Legislative Assembly. Each state electorate elects one member. The Electoral Commission of Queensland, or ECQ, runs both types of election. Find the council area, ward or state electorate for the office you want to contest.'
      },
      {
        title: 'Check your council eligibility and training',
        body: 'Check the ECQ eligibility list, including citizenship, age, Queensland enrolment and where you live. Council candidates must live in the council area. If you are running for council without a current council seat, complete the free Queensland Government course So you want to be a councillor? before you submit your nomination and within six months before the official nomination day. It takes about 90 minutes. Keep the certificate and enter its reference number on your form. Sitting councillors can check whether a previous completion meets the rules.'
      },
      {
        title: 'Prepare the right nomination',
        body: 'State candidates must be Australian citizens on the Queensland electoral roll and should check the state disqualification rules. An independent needs at least six enrolled voters from the area they are contesting. That could be a council ward, a whole council area or a state electorate, depending on the office. A registered party’s officer nominates its endorsed candidates. The ECQ lists a $250 deposit for both types of election. Check the election notice for the correct forms and closing time.'
      },
      {
        title: 'Set up campaign finances before you start',
        body: 'Queensland requires dedicated campaign accounts for council and state elections, with a separate account for each level. A public announcement, accepting a gift or spending money can trigger obligations before you lodge nomination papers. Check the ECQ instructions for when to notify it about your account and report gifts and loans. Keep receipts and records for your election return.'
      }
    ],
    exercise: {
      question: 'Priya is running for a Queensland council for the first time and finished this P4A module. Which course record goes on the nomination form?',
      options: [
        {
          label: 'A screenshot of the completed P4A module.',
          feedback: 'Use the Queensland Government training certificate reference on the nomination form.',
          correct: false
        },
        {
          label: 'A certificate from any local government course.',
          feedback: 'The official course is So you want to be a councillor? Check the six-month timing as well.',
          correct: false
        },
        {
          label: 'The reference number from the official Queensland Government training certificate.',
          feedback: 'Complete the official course within the required period and keep the certificate for your records.',
          correct: true
        }
      ]
    },
    sources: [
      [
        'Official Queensland Government course and certificate instructions',
        'https://www.dlgwv.qld.gov.au/local-government/for-the-community/so-you-want-to-be-a-councillor'
      ],
      [
        'ECQ council candidate eligibility and campaign obligations',
        'https://www.ecq.qld.gov.au/election-participants/local-election-participants/candidates'
      ],
      [
        'ECQ council nomination forms and deposit',
        'https://www.ecq.qld.gov.au/election-participants/local-election-participants/candidates/nomination-of-a-candidate'
      ],
      [
        'Queensland law on candidate training',
        'https://www.legislation.qld.gov.au/view/whole/html/inforce/current/act-2011-027#sec.26'
      ],
      [
        'Queensland Parliament and its electoral system',
        'https://www.parliament.qld.gov.au/Visit-and-learn/About-Us/The-Queensland-Electoral-System'
      ],
      [
        'ECQ state candidate nomination forms and deposit',
        'https://www.ecq.qld.gov.au/election-participants/state-election-participants/candidates/nomination-of-a-candidate'
      ],
      [
        'ECQ state candidate eligibility and campaign obligations',
        'https://www.ecq.qld.gov.au/election-participants/state-election-participants/candidates'
      ]
    ]
  },
  {
    id: 'wa',
    title: 'Western Australia',
    summary: 'Find the rules for the office you choose, including council induction and State Parliament nominations.',
    minutes: 8,
    sections: [
      {
        title: 'Running for council',
        body: 'Check the election notice to find the returning officer. The Western Australian Electoral Commission, or WAEC, runs postal council elections. A council can run its own in-person election. Before you nominate, finish the official Western Australian Government online candidate induction and register your completion. Keep the confirmation email. Submit your witnessed nomination, candidate profile and $100 deposit to the returning officer by the deadline.'
      },
      {
        title: 'Running for State Parliament',
        body: 'WAEC runs state elections. Choose a Legislative Assembly district or the statewide Legislative Council. The Assembly nomination deposit is $250. The Council deposit is $2,000 per candidate, with a cap for larger groups. Each Council candidate without party endorsement also needs declarations from at least 250 eligible voters. Check the current forms and closing times for your route. Allow at least 24 hours for an electronic deposit transfer before nominations close.'
      },
      {
        title: 'Set up your campaign records',
        body: 'For council, ask the council chief executive how and when to disclose election gifts. For a state campaign, check the WAEC spending limits and set up the required state campaign account before you incur election expenses. Find out which contributions you must disclose and set reminders. The reporting deadline gets shorter once the election is formally called.'
      }
    ],
    exercise: {
      question: 'You have read the P4A lesson and drafted your WA council candidate profile. What do you need to do about the induction before submitting your nomination?',
      options: [
        {
          label: 'Submit the P4A lesson completion as proof.',
          feedback: 'The WA Government’s official course provides the record you need for nomination.',
          correct: false
        },
        {
          label: 'Finish the government induction after voting day.',
          feedback: 'Complete the official candidate induction before nominating. Elected councillors have additional responsibilities after the election.',
          correct: false
        },
        {
          label: 'Complete the WA Government induction, register completion and keep the confirmation email.',
          feedback: 'Declare that you completed the course on the nomination form and have the email ready for the returning officer.',
          correct: true
        }
      ]
    },
    sources: [
      [
        'WA Government compulsory local candidate induction',
        'https://www.wa.gov.au/organisation/local-government/local-government-candidate-induction'
      ],
      [
        'WAEC council candidate guide and local gift disclosure',
        'https://www.elections.wa.gov.au/candidates-and-parties/local-government-candidates'
      ],
      [
        'WAEC who conducts local elections',
        'https://www.elections.wa.gov.au/sites/default/files/LGE2025/Stakeholder%20resources/2025%20LGE%20FAQs.pdf'
      ],
      [
        'WAEC State Parliament nominations',
        'https://www.elections.wa.gov.au/candidates-and-parties/nominations-state-elections'
      ],
      [
        'WAEC state campaign finance and disclosure',
        'https://www.elections.wa.gov.au/candidates-and-parties/funding-and-disclosure'
      ]
    ]
  },
  {
    id: 'sa',
    title: 'South Australia',
    summary: 'Compare council and State Parliament elections, then check the nomination and funding rules for your race.',
    minutes: 8,
    sections: [
      {
        title: 'Running for council',
        body: 'Start with the Electoral Commission of South Australia, or ECSA. Check the council or ward and the eligibility rules for the election you want to contest. For a council nomination, prepare your eligibility declaration and a candidate profile, then submit them to the returning officer during the nomination period. Free candidate training can help you prepare. Elected council members have mandatory training after the election. Roxby Downs has its own administration and sits outside the regular council elections.'
      },
      {
        title: 'Running for State Parliament',
        body: 'The House of Assembly is the lower house, with a seat for each district. Its independent nomination requires at least 20 eligible district voters to nominate you and a $1,000 deposit. The Legislative Council is elected across South Australia. Its independent route requires at least 250 eligible nominators and a $3,000 deposit per candidate, including when independents apply as a group. A registered party’s officer submits its endorsed candidates. Use the ECSA forms for the specific house and election.'
      },
      {
        title: 'Before accepting money or services',
        body: 'Ask ECSA which funding rules apply to your role. South Australian state election law broadly prohibits political donations and loans, with limited exceptions for candidates and groups that qualify. Check an offer of cash, discounted printing or a loan before accepting it. State candidates and groups use a dedicated state campaign account. Council campaigns use separate gift reporting rules. City of Adelaide candidates also file a campaign spending return.'
      }
    ],
    exercise: {
      question: 'Two people plan to run together as independents for the South Australian Legislative Council. They have 20 district nominators each. What should they do next?',
      options: [
        {
          label: 'Pool the 40 signatures and use the House of Assembly form.',
          feedback: 'The House of Assembly forms apply to district seats. An independent group in the Legislative Council has its own forms and requirements.',
          correct: false
        },
        {
          label: 'Use ECSA’s independent group forms and prepare 250 eligible nominators and a $3,000 deposit for each candidate.',
          feedback: 'Each independent candidate in the group needs to meet the Legislative Council requirements. Allow time for ECSA to check enrolment and receive the deposits.',
          correct: true
        },
        {
          label: 'Ask ECSA to transfer a council candidate profile to the state ballot.',
          feedback: 'A council profile is part of a local nomination. Use the separate state process to get on the Legislative Council ballot.',
          correct: false
        }
      ]
    },
    sources: [
      [ 'ECSA council candidate nominations', 'https://www.ecsa.sa.gov.au/nominate' ],
      [
        'ECSA council elections and exceptions',
        'https://www.ecsa.sa.gov.au/parties-and-candidates/council-elections'
      ],
      [
        'South Australian council candidate and elected member training',
        'https://www.councilelections.sa.gov.au/training'
      ],
      [
        'ECSA House of Assembly candidate guide',
        'https://www.ecsa.sa.gov.au/images/Compliance%20branch/Forms%20and%20guides/Guides/SE2026/RO%2016%20Candidate%20Guide%20HA.pdf'
      ],
      [
        'ECSA Legislative Council nominations',
        'https://www.ecsa.sa.gov.au/component/content/article/legislative-council-candidates?Itemid=236&catid=13%3Aparties-and-candidates'
      ],
      [
        'ECSA state election funding and donation rules',
        'https://www.ecsa.sa.gov.au/parties-and-candidates/electoral-funding-donations-reform/reforms-overview'
      ],
      [
        'ECSA council campaign disclosures',
        'https://www.ecsa.sa.gov.au/parties-and-candidates/disclosure-requirements-council-candidates'
      ]
    ]
  },
  {
    id: 'tas',
    title: 'Tasmania',
    summary: 'Compare local and parliamentary campaigns, including the different rules for nominations and campaign spending.',
    minutes: 7,
    sections: [
      {
        title: 'Check the council candidate guide',
        body: 'The Tasmanian Electoral Commission runs council elections. Its 2026 guide offered optional candidate resources. Tasmania has legislated mandatory learning for elected councillors, with that provision awaiting a start date when checked in November 2026. Use the latest commission handbook for your election or by-election to check the rules that apply to your nomination.'
      },
      {
        title: 'Prepare a council nomination and advertising return',
        body: 'Check that you are enrolled to vote in the council area and that your main home is in Tasmania. In 2026 you could run for councillor in one council area and also for mayor or deputy mayor in that same area. Your form needed signatures from at least two local electors. Keep the bills and receipts for election advertising. Candidates must file an advertising return within 45 days after the certificate of election is issued.'
      },
      {
        title: 'Choose a state house',
        body: 'The commission runs elections for the House of Assembly, the lower house, and the Legislative Council, the upper house. An independent candidate needs support from at least 10 electors in the relevant division for either house. Check the residence and eligibility rules and the dates for the division you want to represent. Upper-house elections are scheduled by division.'
      },
      {
        title: 'Check who can pay state campaign bills',
        body: 'Register with the commission before accepting a political donation or paying campaign expenses. A Legislative Council candidate must use a separate campaign account even with party endorsement. The candidate or their official agent can spend within the applicable limit. A party may make a lawful donation and must leave spending on that candidate’s election to the candidate or agent.'
      }
    ],
    exercise: {
      question: 'A registered party endorses Noor for the Tasmanian Legislative Council. The party treasurer wants to order and pay for Noor’s campaign flyers directly. What should Noor do?',
      options: [
        {
          label: 'Have the party treasurer pay through the party’s House of Assembly campaign account.',
          feedback: 'A Legislative Council candidate has a separate campaign account. The candidate or official agent can incur the candidate’s election spending.',
          correct: false
        },
        {
          label: 'Check the donation rules and have the candidate or registered official agent handle the purchase through the candidate’s campaign account.',
          feedback: 'Endorsement leaves the upper-house campaign spending rules in place. Check the cap and record any lawful donation and the purchase.',
          correct: true
        },
        {
          label: 'Treat the flyers as a local council campaign expense.',
          feedback: 'The Legislative Council is the upper house of the state Parliament. Its own finance and reporting rules apply.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'Tasmanian Electoral Commission council candidate information and reporting',
        'https://www.tec.tas.gov.au/local-government/elections-2026/candidate-info.html'
      ],
      [
        'Council nomination requirements',
        'https://www.tec.tas.gov.au/local-government/elections-2026/nominations.html'
      ],
      [
        'Tasmanian councillor learning provisions and commencement status',
        'https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-2026-011'
      ],
      [
        'House of Assembly candidates',
        'https://www.tec.tas.gov.au/electoral-participants/candidates/house-of-assembly/index.html'
      ],
      [
        'Legislative Council candidates',
        'https://www.tec.tas.gov.au/electoral-participants/candidates/legislative-council/index.html'
      ],
      [
        'Legislative Council campaign spending rules',
        'https://www.tec.tas.gov.au/disclosure-and-funding/electoral-expenditure/legislative-council/index.html'
      ],
      [
        'Tasmanian parliamentary campaign accounts',
        'https://www.tec.tas.gov.au/disclosure-and-funding/campaign-accounts.html'
      ]
    ]
  },
  {
    id: 'act',
    title: 'Australian Capital Territory',
    summary: 'See who handles local services and learn how to run for the ACT Legislative Assembly.',
    minutes: 7,
    sections: [
      {
        title: 'Find the right level of government',
        body: 'The ACT Legislative Assembly and ACT Government handle both territory responsibilities and local services such as rubbish collection. Canberra has no separately elected municipal council or mayor. Find your ACT electorate if you want to run for the Assembly. Elections ACT runs that election.'
      },
      {
        title: 'Prepare your Assembly nomination',
        body: 'Check eligibility, including Australian citizenship, age and whether you are entitled to vote in the ACT. If you are running without party endorsement, get signatures from at least 20 people entitled to vote in the electorate you are contesting. A registered party’s officer can nominate its candidates. Check Elections ACT for the approved form, the $250 deposit and the deadline for your election.'
      },
      {
        title: 'Read a sample ballot',
        body: 'Each of the five ACT electorates elects five members. Hare-Clark is the system that counts preferences for individual candidates. Look at an Elections ACT example to see how voters rank people on the ballot and how preferences can transfer during the count.'
      },
      {
        title: 'Plan your financial reports early',
        body: 'Check the spending cap and its dates before booking advertising. Look up which donors can give, when gifts must be reported and when your election return is due. For a first-time independent, the reporting period can start when you publicly announce your candidacy. Keep a dated record of gifts and spending from the start and check who will be responsible for filing.'
      }
    ],
    exercise: {
      question: 'Riley lives in Canberra and wants to represent their community on local services. Which elected office should Riley explore?',
      options: [
        {
          label: 'Mayor of Canberra.',
          feedback: 'The ACT Government and Legislative Assembly carry out Canberra’s municipal functions.',
          correct: false
        },
        {
          label: 'Member of the ACT Legislative Assembly for their electorate.',
          feedback: 'The Assembly deals with both territory and local responsibilities. Elections ACT explains how to nominate.',
          correct: true
        },
        {
          label: 'Member of the local council for their suburb.',
          feedback: 'The ACT combines the local and territory levels of government.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'ACT Legislative Assembly and the levels of government',
        'https://www.parliament.act.gov.au/visit-and-learn/learn/resources/fs/levels-of-gov'
      ],
      [
        'Elections ACT candidate guidance',
        'https://www.elections.act.gov.au/for-political-participants/candidates'
      ],
      [
        'Elections ACT nomination and deposit guide',
        'https://www.elections.act.gov.au/elections/education/fact-sheets/fact-sheet-nomination-of-candidates'
      ],
      [
        'Elections ACT guide to Hare-Clark voting',
        'https://www.elections.act.gov.au/elections/our-electoral-system/elections-in-the-act/hare-clark-voting-system'
      ],
      [
        'Elections ACT funding and disclosure rules',
        'https://www.elections.act.gov.au/funding-disclosures-and-registers/funding-and-disclosure-obligations'
      ]
    ]
  },
  {
    id: 'nt',
    title: 'Northern Territory',
    summary: 'Compare local and Territory candidacy, check who can nominate you and plan for different campaign reporting rules.',
    minutes: 8,
    sections: [
      {
        title: 'Running for council',
        body: 'The Northern Territory Electoral Commission, or NTEC, runs council elections. Check that your main home and enrolment are in the council area. Get at least one other person enrolled in that area to nominate you, attach a recent photo and confirm NTEC received the forms. Check the eligibility rules early if you work for the council. NTEC offers candidate guidance before election day. Mandatory training under the Local Government Act applies to council members after they take office.'
      },
      {
        title: 'Party support and remote communities',
        body: 'Council candidates nominate as individuals. Party affiliation does not appear on the local ballot. NTEC’s guide explains how candidates can disclose party membership and handle support received from a party. Check the council rules for campaign material, including the name of the person who approved it and who paid for it. If you plan to campaign in a remote community, speak with the relevant land council about any entry permit you may need.'
      },
      {
        title: 'Running for the Legislative Assembly',
        body: 'Check the NTEC eligibility rules, which include Territory and Australian residence periods. An independent needs at least six voters entitled to vote in the division to nominate them. A registered party’s officer nominates its candidate. Submit the form and photo and make sure the $500 deposit clears before nominations close. Confirm the timetable with NTEC for the exact election or by-election.'
      },
      {
        title: 'Report money under the right rules',
        body: 'Council candidates report qualifying donations and loans under local election rules. Assembly candidates have a separate Territory campaign account and different reporting duties. An endorsed Assembly candidate normally uses their party’s account. Keep records of donations, goods or services received and election spending. Check NTEC for the filing deadlines that apply to your campaign.'
      }
    ],
    exercise: {
      question: 'A friend enrolled in your council area helped nominate you for council. You now want to stand as an independent for the Territory Legislative Assembly. Which nomination rule applies?',
      options: [
        {
          label: 'One local council nominator is enough for the Assembly.',
          feedback: 'One eligible nominator is the council requirement. The Legislative Assembly has a different nomination process.',
          correct: false
        },
        {
          label: 'Gather at least six nominators entitled to vote in your Assembly division and arrange the deposit.',
          feedback: 'Use the Assembly nomination form and allow enough time for the deposit to clear before the deadline.',
          correct: true
        },
        {
          label: 'Send signatures from any six people anywhere in the Territory.',
          feedback: 'Assembly nominators must be entitled to vote in the division you are contesting. Confirm their enrolment for that division.',
          correct: false
        }
      ]
    },
    sources: [
      [
        'NTEC local candidate eligibility, nomination and campaign rules',
        'https://ntec.nt.gov.au/electoral-participants/local-government-participants/candidates'
      ],
      [
        'NTEC guidance on party support in council elections',
        'https://ntec.nt.gov.au/_resources/documents/local-government-elections/lge-factsheet-political-parties-in-local-government-elections.pdf'
      ],
      [
        'NT Local Government Act and council member training',
        'https://legislation.nt.gov.au/Legislation/LOCAL-GOVERNMENT-ACT-2019'
      ],
      [
        'NTEC Legislative Assembly candidates',
        'https://ntec.nt.gov.au/electoral-participants/legislative-assembly-participants/candidates'
      ],
      [
        'NTEC Assembly nomination process and deposit example',
        'https://ntec.nt.gov.au/elections/past-elections/legislative-assembly/2026-nightcliff-by-election/nominate-a-candidate'
      ],
      [
        'NTEC Territory and local financial disclosures',
        'https://ntec.nt.gov.au/financial-disclosure/financial-disclosure-returns'
      ]
    ]
  }
];
