export const volunteeringTrack = {
  id: 'volunteering',
  title: 'Volunteering',
  entryTitle: 'Volunteer',
  description: 'Find a role that fits your time and skills, from preparing a campaign to helping between elections.',
  practice: 'Offer tasks that fit different lives, agree on responsibilities and expenses, and leave a clear handover that makes the next person’s work easier.',
  modules: [
    {
      id: 'find-volunteer-role',
      title: 'Find a volunteer role that fits',
      summary: 'Match what you can offer with a task, schedule and level of support that work for you.',
      minutes: 5,
      sections: [
        {
          title: 'Choose how you want to contribute',
          body: 'A fair go starts with a task that fits your life. Decide how much time you can offer and whether you want to work with people, organise behind the scenes or help remotely. You could welcome people at an event, check the accessibility of a flyer, summarise public meeting papers or help with a one-off setup. Ask which tasks you can learn on the job and which need prior experience.'
        },
        {
          title: 'Ask for the conditions you need',
          body: 'Tell the organiser what helps you contribute. That could be a shorter shift, a remote task, clear written instructions, captions, a quiet space, a step-free venue or an accessible toilet. Agree how you will stay in touch, when you can take a break and whom to contact if the arrangement needs to change.'
        },
        {
          title: 'Agree on your task and your limits',
          body: 'Before starting, ask for a clear task, a named supervisor, any training and how to report a safety or conduct concern. Check the process for travel and other expenses before spending. If the work involves personal information, use the host’s approved systems and access only what you need for the agreed task.'
        },
        {
          title: 'Check arrangements for young volunteers',
          body: 'Ask the host about minimum ages, parent or guardian permission where required, and how supervision and safe transport will work. If the task involves working with children, ask the host to check the screening and supervision requirements for the state or territory before the work starts.'
        }
      ],
      exercise: {
        question: 'Morgan can give one hour from home and needs written instructions. The listing only mentions a full day at a public event. What is a good next step?',
        options: [
          {
            label: 'Ask whether there is a defined remote task, such as checking the event information, with a named contact and a clear deadline.',
            feedback: 'A task with a clear result and contact person can fit Morgan’s availability. Agree on the instructions and how to hand the work back.',
            correct: true
          },
          {
            label: 'Accept the full shift and hope the organiser finds a different role on the day.',
            feedback: 'Discuss hours and access needs before accepting so the organiser can confirm a suitable task.',
            correct: false
          },
          {
            label: 'Request access to the volunteer database and decide what to work on.',
            feedback: 'Ask the organiser for a defined task and use only the information needed for that work.',
            correct: false
          }
        ]
      },
      sources: [
        [
          'JobAccess guide to finding volunteer roles and volunteering centres',
          'https://www.jobaccess.gov.au/i-am-a-person-with-disability/i-want-develop-my-skills/work-experience-and-volunteering'
        ],
        [
          'NSW Government guidelines on accessible volunteering',
          'https://www.nsw.gov.au/community-services/volunteering/resources-for-volunteering-nsw/nsw-disability-inclusion-volunteering-guidelines'
        ],
        [
          'Safe Work Australia guidance for volunteers',
          'https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/volunteers/whs-duties'
        ],
        [
          'Australian Criminal Intelligence Commission guide to child-related screening by jurisdiction',
          'https://www.acic.gov.au/national-police-checking-service/find-out-more-information/working-children-checks'
        ]
      ]
    },
    {
      id: 'prepare-to-volunteer',
      title: 'Help prepare a campaign',
      summary: 'Choose a first task, agree on support and check the rules before the campaign launches.',
      minutes: 7,
      sections: [
        {
          title: 'Choose the election and a task',
          body: 'Find out which council ward, state district or region, territory electorate, federal House division or Senate contest the team is working on. Local teams can check accessible venues and council boundaries. State or territory teams can prepare event checklists for their area. Federal House teams can check division maps while Senate teams can help coordinate a roster across their state or territory.'
        },
        {
          title: 'Agree on how you can take part',
          body: 'Tell the coordinator how much time you can offer and what would make the work accessible. A short remote task could be checking captions, formatting a handout or reading a public source. An in-person task could be checking the step-free entrance or laying out an event room. Confirm who will brief you, who signs off your work and how to report a problem.'
        },
        {
          title: 'Check approvals before spending or publishing',
          body: 'Ask the campaign’s finance lead what you can buy, how to get approval and whether an expense can be reimbursed. Keep the receipt for approved purchases. Ask before offering equipment, printing or paid services for free because they can trigger donation or spending rules. A campaign’s obligations can start before nominations close. Check the rules for your election before committing money or publishing material.'
        },
        {
          title: 'Set up privacy and access',
          body: 'Use campaign-approved accounts and workspaces. Ask people before using their contact details, images or stories for another purpose. Use only the information needed for your task and leave access to sensitive information with the people responsible for it. Use the campaign’s contact preferences and route requests to stop contact to the coordinator.'
        }
      ],
      exercise: {
        question: 'A friend offers a box of flyers paid for by their business before nominations. What should you do?',
        options: [
          {
            label: 'Hand them out because the business paid.',
            feedback: 'The payment can still raise donation or expenditure questions. Material may also need authorisation before distribution.',
            correct: false
          },
          {
            label: 'Ask the campaign’s finance and communications leads to check the offer and approve any material before use.',
            feedback: 'They can check how the offer is treated under the election rules and confirm the correct material, authorisation and records.',
            correct: true
          },
          {
            label: 'Pay the business yourself and ask for reimbursement later.',
            feedback: 'Get approval before spending. A personal payment may still need to be recorded and there may be restrictions on how it is paid.',
            correct: false
          }
        ]
      },
      sources: [
        [
          'AEC guidance on federal campaign authorisation',
          'https://www.aec.gov.au/About_AEC/Publications/Backgrounders/authorisation.htm'
        ],
        [
          'AEC guide to federal gifts and electoral funding reforms from 1 January 2027',
          'https://www.aec.gov.au/FADReform/factsheets/gifts.htm'
        ],
        [
          'NSW Electoral Commission guide to campaign payments',
          'https://elections.nsw.gov.au/electoral-funding/electoral-expenditure/making-payments-for-electoral-expenditure'
        ],
        [
          'Privacy regulator guidance on political parties and elections',
          'https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/political-parties-and-elections'
        ]
      ]
    },
    {
      id: 'volunteer-during-campaign',
      title: 'Take a role during the campaign',
      summary: 'Help with events, communications, accessibility or logistics while working within agreed limits.',
      minutes: 7,
      sections: [
        {
          title: 'Match the task to your time and location',
          body: 'At a council event, set up seating or keep the accessible entrance clear. In a state or territory campaign, check event access, update a roster or prepare materials for the correct electorate. In a federal House campaign, a local team can pack approved leaflets for its division. A Senate team can coordinate approved supplies across its state or territory. From home, you can proofread, check captions or help with shift reminders.'
        },
        {
          title: 'Use the approved version',
          body: 'Get materials and event details from the coordinator. Check that the leaflet, sign or digital post is for the correct contest and has any required authorisation or registration. If you spot a wrong date, old address or missing statement, pause and ask for a corrected version. Check permission and local rules before putting up signs or using someone’s property.'
        },
        {
          title: 'Plan a safe and accessible shift',
          body: 'Ask where to meet, who to call and how to end a shift safely. Arrange breaks, weather protection, transport and any access adjustments you need. Follow the site briefing and leave an unsafe situation. Escalate harassment or an injury to the coordinator and call emergency services if there is immediate danger.'
        },
        {
          title: 'Handle information and costs with care',
          body: 'Keep volunteer and voter information in approved systems. Ask before taking or publishing photographs. Follow the team’s consent and contact preferences, and do not upload contact lists to a personal tool. If a task requires buying supplies, get approval first and give the finance lead the receipt and the purpose of the expense.'
        }
      ],
      exercise: {
        question: 'You are ready to publish a campaign event graphic. It has the wrong wheelchair entrance and you cannot see the required authorisation. What should you do?',
        options: [
          {
            label: 'Publish it and put the corrected details in a comment later.',
            feedback: 'The original could direct people to the wrong entrance. The authorisation issue also needs to be checked before publication.',
            correct: false
          },
          {
            label: 'Edit the graphic and add an authorisation you found on a different campaign’s flyer.',
            feedback: 'Authorisation details must be appropriate to this communication. Get the corrected version from your campaign lead.',
            correct: false
          },
          {
            label: 'Hold the graphic, report both issues and ask for an approved replacement.',
            feedback: 'Check the event access information against the venue and publish the approved replacement when it is ready.',
            correct: true
          }
        ]
      },
      sources: [
        [
          'AEC advice for federal campaign workers',
          'https://www.aec.gov.au/Elections/candidates/party-workers.htm'
        ],
        [
          'NSW Electoral Commission rules for state and local campaign material',
          'https://elections.nsw.gov.au/political-participants/electoral-material'
        ],
        [
          'Elections ACT guidance for candidates and campaign signs',
          'https://www.elections.act.gov.au/for-political-participants/candidates'
        ],
        [
          'Safe Work Australia guidance on volunteering',
          'https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/volunteers/whs-duties'
        ]
      ]
    },
    {
      id: 'volunteer-during-voting',
      title: 'Help during voting and counting',
      summary: 'Know your role at a voting centre, in a postal election or as an appointed scrutineer.',
      minutes: 8,
      sections: [
        {
          title: 'Check how this election is run',
          body: 'Confirm whether people vote in person, by post or both. A campaign volunteer can check a roster, bring approved supplies or share the electoral authority’s voting and access information. Tasmania’s 2026 council elections used postal ballots. Federal House and Senate elections use voting centres and have their own rules. State and territory requirements can differ for early and election-day voting.'
        },
        {
          title: 'Respect access and the voting area',
          body: 'Ask the coordinator and election official where you may stand and what materials you may distribute. For federal elections the AEC applies a six-metre rule at polling places. For ACT Legislative Assembly elections the canvassing restriction extends 100 metres from the building containing a polling place. Check the instructions for your election and site, keep paths clear and refer questions about voting or assistance to election officials.'
        },
        {
          title: 'Understand the scrutineer’s job',
          body: 'A scrutineer is a formally appointed observer for a candidate or other authorised participant. Ordinary campaign shifts do not give you access to voting or counting areas. If you are appointed, get the correct form, read the rules for the activity and venue, and follow the election officials’ instructions. Scrutineers observe and raise permitted concerns. Election officials handle the ballot papers and carry out the count.'
        },
        {
          title: 'Help from outside the count',
          body: 'If you are not an appointed scrutineer, you can coordinate shift changes, collect signs when permitted or follow official published results from home. Protect the secrecy of the ballot. Leave voter assistance and any concerns about ballots or the count to election officials or the appointed scrutineer.'
        }
      ],
      exercise: {
        question: 'Your campaign shift ends at a state voting centre. A teammate asks you to stay and observe the count. What should you do?',
        options: [
          {
            label: 'Enter the count area with your campaign volunteer badge.',
            feedback: 'Campaign work does not authorise you to observe the count inside the venue.',
            correct: false
          },
          {
            label: 'Ask whether you are formally appointed for that count and have the required paperwork. Otherwise follow the official results.',
            feedback: 'Confirm the appointment, venue and activity with the relevant election authority’s guide. Follow its instructions if you are admitted.',
            correct: true
          },
          {
            label: 'Take photographs of ballot papers from the doorway to help the campaign check the count.',
            feedback: 'Protect ballot secrecy and follow the election officials’ instructions. Leave scrutiny to properly appointed observers.',
            correct: false
          }
        ]
      },
      sources: [
        [
          'AEC polling-place rules for federal campaign workers',
          'https://www.aec.gov.au/Elections/candidates/party-workers.htm'
        ],
        [
          'AEC federal scrutineer handbook',
          'https://www.aec.gov.au/elections/candidates/files/scrutineers-handbook.pdf'
        ],
        [
          'Elections ACT guide to canvassing near voting centres',
          'https://www.elections.act.gov.au/for-political-participants/candidates'
        ],
        [
          'Victorian Electoral Commission state scrutineer guide',
          'https://www.vec.vic.gov.au/candidates-and-parties/become-a-state-election-candidate/scrutineers'
        ],
        [
          'Tasmanian Electoral Commission 2026 local postal election example',
          'https://www.tec.tas.gov.au/local-government/elections-2026/'
        ]
      ]
    },
    {
      id: 'close-out-campaign',
      title: 'Close the campaign and hand over',
      summary: 'Return equipment, hand in receipts and protect records when a campaign ends or changes hands.',
      minutes: 7,
      sections: [
        {
          title: 'Pack down and return what was borrowed',
          body: 'Ask who is removing signs, when they can be removed and where equipment goes. Return keys, devices and unused supplies. If you are helping remotely, deliver the final accessible documents and send a short list of unfinished work. Use official results for a published outcome and distinguish a running count from a declared result.'
        },
        {
          title: 'Hand records to the finance lead',
          body: 'Send receipts, invoices and approvals for supplies or travel to the person responsible for finance. Keep the date, supplier, purpose and election with each record. A council campaign can have an advertising return, as in Tasmania. A state campaign can have different expenditure and disclosure forms. Federal House candidates and Senate groups should check the AEC rules for their election and which person or agent files each return.'
        },
        {
          title: 'Close access and protect required records',
          body: 'Return files through approved channels and have the coordinator remove your access when your work is finished. Ask the record owner what must be retained, for how long and what working copies can be removed. Keep receipts, approvals and other required records available to the authorised person. Leave supporter and voter details with the people responsible for those records.'
        },
        {
          title: 'Plan a handover after the result',
          body: 'Debrief with the team and record improvements for the next campaign. If someone is elected, finish the campaign handover and direct new public enquiries to the official contact channel when available. Ask before moving any records or contacts. An elected office has its own responsibilities, access arrangements and information practices. A reusable checklist or guide can help the next volunteer get started. Keep private details out of anything you share.'
        }
      ],
      exercise: {
        question: 'The campaign is over. You have receipts, a borrowed tablet and a copy of the volunteer contact list. What is the right handover?',
        options: [
          {
            label: 'Send the receipts to the finance lead, return the tablet and ask the coordinator to close your access and confirm how to deal with your copy.',
            feedback: 'The authorised team can keep the records required for reporting and handle removal of working copies.',
            correct: true
          },
          {
            label: 'Delete everything straight away, including the receipts.',
            feedback: 'The campaign may still need receipts and other records for a return, audit or disclosure.',
            correct: false
          },
          {
            label: 'Send the volunteer list to the newly elected office so it can contact everyone.',
            feedback: 'The list was collected for campaign work. Check the purpose, consent and official office arrangements before any transfer.',
            correct: false
          }
        ]
      },
      sources: [
        [
          'AEC disclosure and record keeping for federal candidates and Senate groups',
          'https://aec.gov.au/Parties_and_Representatives/financial_disclosure/guides/candidate.htm'
        ],
        [ 'AEC guide to changes from 1 January 2027', 'https://www.aec.gov.au/FADReform/whats-changing.htm' ],
        [
          'NSW Electoral Commission state and local expenditure disclosures',
          'https://elections.nsw.gov.au/electoral-funding/disclosures/annual-electoral-expenditure-disclosure'
        ],
        [
          'Tasmanian Electoral Commission local candidate advertising returns',
          'https://www.tec.tas.gov.au/local-government/elections-2026/candidate-info.html'
        ]
      ]
    },
    {
      id: 'volunteer-after-election',
      title: 'Keep contributing after an election',
      summary: 'Find practical ways to help through councils, community groups, elected offices, Parliament and the Governor-General’s public programmes.',
      minutes: 8,
      sections: [
        {
          title: 'Get involved with local government',
          body: 'Check your council’s volunteer programmes, public consultations and advisory group notices. You could help at a library, support a local environment project or offer a community group’s evidence to a consultation. Read the agenda before attending a public council meeting and check the process for questions or submissions. In the ACT, look for territory government programmes and consultations on local services.'
        },
        {
          title: 'Work with an elected representative or a party',
          body: 'Contact your local representative through their official office to ask about a community meeting or an advertised placement. You can help a community group put a short brief together with public evidence and a specific request. To continue party work, ask the party or local branch about a defined task. A campaign role gives you experience you can describe when asking about a placement. The office has to approve each placement and agree who will supervise it. Leave constituent case files, official inboxes and decisions with authorised staff.'
        },
        {
          title: 'Have a say on a minister’s portfolio',
          body: 'Find the responsible department or agency and look for an open consultation. Read what it asks, use evidence you have permission to share and submit it through the published channel. A community group can agree on a position and ask you to help draft it. For a role in a ministerial, opposition or whip’s office, follow the office’s advertised recruitment or placement process. The office approves access. Official decisions stay with the office-holder or other person authorised to make them.'
        },
        {
          title: 'Support the work of Parliament from the community',
          body: 'Find a committee inquiry and check what it is investigating, its deadline and whether submissions are published. You can help a group prepare evidence, lodge your own submission or attend a public hearing where available. To see the Speaker or Senate President at work, check the public gallery or broadcast arrangements. Apply through a formal programme if you want behind-the-scenes experience. The Parliament of Victoria has a school work experience programme with eligibility rules and an application process.'
        },
        {
          title: 'Take part in the Governor-General’s civic programmes',
          body: 'You can nominate someone for the Order of Australia for outstanding service. Use the official form, explain their contribution and follow the confidentiality instructions. Check the Government House visiting page for public events. If you want to work for the Governor-General’s office, check its official recruitment page. An honours nomination or public visit is a way to take part in civic life.'
        }
      ],
      exercise: {
        question: 'A group that volunteered in the election wants to share local evidence on transport after polling day. Someone suggests logging in to the new MP’s casework system to gather examples. What should the group do?',
        options: [
          {
            label: 'Prepare a brief with public figures and agreed community stories, then contact the MP’s office or make a submission through an open consultation.',
            feedback: 'The group can make a contribution through public channels. Ask the people involved what they agree to share and protect their personal details.',
            correct: true
          },
          {
            label: 'Use the campaign volunteer roster to request a login and copy constituent records.',
            feedback: 'The elected office has its own approval and privacy rules. Work from public or explicitly agreed evidence.',
            correct: false
          },
          {
            label: 'Send the group’s recommendations on the MP’s letterhead.',
            feedback: 'Send a brief in the group’s own name. An office decides who can communicate on its behalf.',
            correct: false
          }
        ]
      },
      sources: [
        [
          'South Australian local council volunteering examples',
          'https://www.localcouncils.sa.gov.au/careers/volunteering'
        ],
        [
          'Local Government Victoria guide to council meetings',
          'https://www.localgovernment.vic.gov.au/guide-to-councils/how-council-make-decisions/council-meetings'
        ],
        [ 'ACT Government budget consultation', 'https://www.treasury.act.gov.au/budget/budget-consultation' ],
        [ 'Contact a federal MP or senator', 'https://www.aph.gov.au/members/contact' ],
        [ 'Australian Government portfolio directory', 'https://www.directory.gov.au/portfolios' ],
        [
          'Home Affairs public consultations',
          'https://www.homeaffairs.gov.au/help-and-support/how-to-engage-us/consultations'
        ],
        [
          'Find federal parliamentary committee inquiries',
          'https://www.aph.gov.au/Parliamentary_Business/Committees/Current_Inquiries'
        ],
        [ 'Parliament of Australia guide to making a submission', 'https://www.aph.gov.au/MakeSubmission' ],
        [ 'Watch proceedings at Parliament House', 'https://www.aph.gov.au/parliament-in-action' ],
        [
          'Parliament of Victoria work experience',
          'https://www.parliament.vic.gov.au/teach-and-learn/work-experience/'
        ],
        [
          'Order of Australia community nominations',
          'https://www.gg.gov.au/australian-honours-and-awards/order-australia'
        ],
        [
          'Visit Government House',
          'https://www.gg.gov.au/about-governor-general/governor-generals-official-residences/visiting-government-house'
        ],
        [
          'Office of the Official Secretary to the Governor-General recruitment',
          'https://www.gg.gov.au/office-official-secretary-governor-general/recruitment'
        ]
      ]
    }
  ]
};
