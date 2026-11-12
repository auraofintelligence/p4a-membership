import { officeTrainingTrack } from './civic-office-training.mjs';
import { volunteeringTrack } from './civic-volunteering-training.mjs';
import { teamGamesLesson } from './civic-training-team-games.mjs';

const governmentLevels = 'https://peo.gov.au/understand-our-parliament/how-parliament-works/three-levels-of-government/three-levels-of-government-governing-australia';

const jraLesson = {
  id: 'joyful-responsible-abundance',
  title: 'Put Joyful Responsible Abundance into practice',
  summary: 'Use three questions to inspire truth, build trust and give everyone a fair go in the work you choose.',
  minutes: 5,
  sections: [
    {
      title: 'Joy means asking whose life could improve',
      body: 'Choose a practical improvement people want. Ask whose life could get better and what would give them more room to learn, rest, connect or create. At a repair workshop, people might come to fix a household item, learn from a neighbour or share a skill at their own pace.',
    },
    {
      title: 'Responsibility means giving people a say',
      body: 'Invite the people affected to shape the plan. Find out who can use the venue and who needs another way to take part. Agree who decides, who pays and how people choose what they share. Give people a way to raise concerns and correct mistakes.',
    },
    {
      title: 'Abundance means leaving something others can use',
      body: 'Share what the group learns in a format people can use. A short guide, a kit others can borrow or a person willing to teach the next group can make the benefit last. Agree how to keep that resource available and who will care for it.',
    },
    {
      title: 'Show what happened and listen again',
      body: 'Say what people asked for, what was tried and what changed. Share the evidence people agreed to make public, explain what is still uncertain and invite corrections. Rise above the fray by making the work useful to others, including people who disagree with you.',
    },
    {
      title: 'Know what you want powerful tools to serve',
      body: 'As AI advances and superintelligence becomes a possibility, ask what you value and what you want to protect. Think about what helps friendships, families and alliances grow. Name one useful thing you can build with others this week, and agree when you will return to see if it gave more people a fair chance to thrive.',
    },
  ],
  quote: {
    lines: ['The treaty’s not a line to sign', 'It’s a dance, a weave, a steady spine'],
    credit: '“Shifting Sands of Timeless Redlands” from A Protopian Gambit, by Luke Nathan Hayes',
    reflection: 'The lyric returns to Naree Budjong Djara on Minjerribah. Think about a relationship you want to sustain. Ask what each person has agreed to, who can speak for the group and how you will keep listening.',
  },
  exercise: {
    question: 'Your group wants to run a free repair workshop. Which plan best puts the three values into practice?',
    options: [
      { label: 'Pick a busy venue and use the number of photos as the measure of success.', feedback: 'Ask who can use the venue, what people want to learn and whether they want to appear in photos.', correct: false },
      { label: 'Ask people what would help, agree on access and costs, and leave a guide and kit others can use.', feedback: 'This gives people a say, makes the responsibilities clear and shares a benefit that can last beyond the event.', correct: true },
      { label: 'Buy a kit and count it as a result as soon as it arrives.', feedback: 'Check who can use it, what people gain from using it and who can maintain it before reporting the outcome.', correct: false },
    ],
  },
  sources: [
    ['Joyful Responsible Abundance introduction by Luke Nathan Hayes', 'https://auraofintelligence.github.io/joyful-responsible-abundance/start-here.html'],
    ['Superintelligence and Australian sovereignty', 'https://auraofintelligence.github.io/joyful-responsible-abundance/sovereignty.html'],
  ],
};

export const trainingTracks = [
  {
    id: 'member-induction',
    title: 'Member induction',
    entryTitle: 'Take part in P4A',
    description: 'Find a way to take part, share evidence carefully and help shape P4A’s rules.',
    practice: 'Bring a claim people can check, make room for someone you have not heard from, and write down what the next group could use.',
    modules: [
      {
        id: 'start-here',
        title: 'Take your first step',
        summary: 'Find a public resource, a working group or a draft you can help improve.',
        minutes: 4,
        sections: [
          { title: 'Where P4A stands', body: 'P4A is a movement in formation. Party registration and adoption of a constitution are still ahead. Public resources are open to anyone. Invited workspace participants can work on projects and contribute to discussion drafts.' },
          { title: 'Find a task you can finish', body: 'Choose an issue and one useful job. You might read a council agenda, compare proposals in a state consultation or find evidence for a federal inquiry. Agree on what you will deliver, when you will review it and where the result should be shared.' },
          { title: 'Understand how admission will work', body: 'The proposed formal membership process includes identity and eligibility checks, civic induction and an independent decision. Treat your workspace access, project involvement and any future formal membership as separate steps. This training gives you practice for the induction.' },
        ],
        exercise: {
          question: 'Jo is invited into the workspace and joins a working group. What can Jo say about their role?',
          options: [
            { label: 'I am helping with the working group’s project.', feedback: 'Describe the work Jo has agreed to do and the group they are part of.', correct: true },
            { label: 'I have been formally admitted as a member of a registered party.', feedback: 'Formal admission and party registration each have their own process. A working-group invitation establishes participation in that group.', correct: false },
            { label: 'I can make decisions for P4A in public.', feedback: 'Any authority to speak or decide for P4A needs an explicit appointment and agreed scope.', correct: false },
          ],
        },
        sources: [['P4A public site', 'https://p4a.xyz/']],
      },
      jraLesson,
      teamGamesLesson,
      {
        id: 'find-the-decision-maker',
        title: 'Find who can fix the problem',
        summary: 'Work out whether a council, parliament or agency can act on your request.',
        minutes: 5,
        sections: [
          { title: 'Start with a specific change', body: 'Write down what is happening, where it happens and what should change. “Add a crossing at the park entrance” gives you a decision to ask about. “Make streets safer” gives you a topic to narrow down.' },
          { title: 'Check who manages it', body: 'Councils generally look after local services such as parks and local roads. States and territories generally look after services such as public transport and hospitals. The federal government handles matters such as Medicare and defence. Responsibilities can overlap. Check the official site to find who manages the specific road, service or rule you are asking about.' },
          { title: 'Choose the route that fits', body: 'Use a service request for an immediate repair. Use a consultation, budget process or elected representative for a policy change. When a parliamentary committee is taking submissions, read what it is investigating and its closing date. Tell the committee what happened, what supports your account and what change you want it to consider.' },
        ],
        exercise: {
          question: 'People want a safer crossing near a park on a road whose manager is unclear. What is the most useful first step?',
          options: [
            { label: 'Ask the federal Parliament to approve a crossing at that spot.', feedback: 'Start by identifying the agency that can approve changes on the specific road.', correct: false },
            { label: 'Find the road manager and ask how it assesses crossing requests.', feedback: 'The manager can tell you who decides, what evidence they need and when they will review it.', correct: true },
            { label: 'Treat every road next to a park as a council road.', feedback: 'Responsibility depends on the road. Check the relevant council or state roads information.', correct: false },
          ],
        },
        sources: [
          ['Parliamentary Education Office guide to the three levels of government', 'https://peo.gov.au/understand-our-parliament/how-parliament-works/three-levels-of-government/the-responsibilities-of-the-three-levels-of-government'],
          ['Parliament of Australia guide to making a submission', 'https://www.aph.gov.au/MakeSubmission'],
        ],
      },
      {
        id: 'evidence-and-privacy',
        title: 'Share evidence with care',
        summary: 'Show what supports a claim, protect private details and correct errors openly.',
        minutes: 5,
        sections: [
          { title: 'Separate what you know from what you think', body: 'State the claim, link to the original source and say when you checked it. Identify what you observed directly and where you are making an inference. If a number changes or a source proves unreliable, correct the claim where you shared it and say what changed.' },
          { title: 'Share what the group needs', body: 'Personal records stay private. For shared work, use only the details needed for the agreed purpose and check who can see them. Keep identity documents, private evidence and payment credentials out of group posts. For an optional named publication, check the exact details with the person first. A rare detail can identify someone even after their name is removed.' },
          { title: 'Work through disagreement', body: 'Ask which fact or assumption the other person disputes. Describe their concern fairly and respond to the point. If you have a personal interest in the outcome, explain it and ask someone independent to review the evidence.' },
        ],
        exercise: {
          question: 'A resident emails a medical letter to explain why a public building is hard for them to use. What should go in the group’s shared evidence note?',
          options: [
            { label: 'The whole letter, because it proves the account is real.', feedback: 'The original contains private health information. An accessibility description can support the work without sharing the letter.', correct: false },
            { label: 'An agreed summary of the access problem with identifying details removed.', feedback: 'Check that the summary preserves the useful evidence and that the remaining details do not identify the resident.', correct: true },
            { label: 'The letter with the name blacked out, including dates and rare medical details.', feedback: 'A combination of unusual details can reveal who the resident is. Review the whole summary for that risk.', correct: false },
          ],
        },
        sources: [['Office of the Australian Information Commissioner guidance on removing identifying details', 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act']],
      },
      {
        id: 'shape-the-rules',
        title: 'Help shape a rule',
        summary: 'Write a clear amendment and follow it from discussion to a decision.',
        minutes: 5,
        sections: [
          { title: 'Name the problem before changing the text', body: 'In the constitution workbench, open the latest version of the clause. Explain who the rule affects, what goes wrong in practice and what you would change. Show the old and proposed wording so other people can see exactly what the change would do.' },
          { title: 'Test an example', body: 'Suppose someone sets up an event for an hour and mentors a new volunteer during the final half hour. In the C-Hour trial, this counts as one hour of voluntary time. Compare a record that lists the main task with one that describes both activities. Ask which version is easier to review and how much detail should be shared.' },
          { title: 'Know which decision has happened', body: 'When a reviewer accepts an edit in the workbench, it becomes part of the working draft. Formal adoption would require an agreed process, a decision by the people with authority to make it and a record of the final version.' },
        ],
        exercise: {
          question: 'An independent reviewer accepts your proposed wording into the draft. How do you describe the result?',
          options: [
            { label: 'The wording has been added to the working draft.', feedback: 'That identifies the recorded change and leaves formal adoption to its own process.', correct: true },
            { label: 'The constitution now requires everyone to follow this wording.', feedback: 'Working-draft changes can still be discussed and revised. A formal decision would be needed to adopt the wording.', correct: false },
            { label: 'The edit changes the rules for every local or state organisation.', feedback: 'An organisation’s rules need a decision for that organisation and a clearly defined scope.', correct: false },
          ],
        },
        sources: [['Open the constitution workbench', '#constitution']],
      },
    ],
  },
  volunteeringTrack,
  {
    id: 'running-for-office',
    title: 'Running for office',
    entryTitle: 'Run for office',
    description: 'Choose an office, find the rules for your election and keep track of campaign money.',
    practice: 'Back public claims with a source, acknowledge uncertainty and correct mistakes promptly. Make campaign information usable by people with different access needs.',
    modules: [
      {
        id: 'state-and-federal-ballots',
        title: 'Choose an office and get on the ballot',
        summary: 'Explore local, state, territory and federal elections and find the rules for the office you want.',
        minutes: 5,
        sections: [
          { title: 'Choose an election and office', body: 'Check whether you want to stand for a council, a state or territory parliament, or federal Parliament. Find the official notice for the election and confirm the seat and who runs it. An area can be divided differently for each type of election.' },
          { title: 'Check eligibility before you commit', body: 'Read the eligibility rules for the office and check where you need to be enrolled or live. Find out whether any other citizenship, public job or other position affects your eligibility. Check for a training certificate, voter signatures, a deposit and the exact date and time that nominations close.' },
          { title: 'Check the ballot and nomination forms', body: 'Read a sample ballot for the office. Look for rules on appearing as an individual, a group or a candidate officially backed by a registered party. A party name on the ballot can depend on its registration for that election. Each pathway links to the relevant election authority.' },
        ],
        exercise: {
          question: 'Alex finds a nomination form online from a different election. How should Alex prepare a nomination?',
          options: [
            { label: 'Find the official notice and candidate pack for the election Alex wants to enter.', feedback: 'Use the forms and deadline for the exact election you want to enter.', correct: true },
            { label: 'Edit the old form to show the new office and date.', feedback: 'The authority running the election provides the forms and instructions it will accept.', correct: false },
            { label: 'Use any form from the same state or territory.', feedback: 'The notice for your election identifies the office, how to apply and when nominations close.', correct: false },
          ],
        },
        sources: [
          ['Choose your election pathway', '#training'],
          ['Parliamentary Education Office guide to the levels of government', governmentLevels],
        ],
      },
      {
        id: 'campaign-records',
        title: 'Keep campaign money records',
        summary: 'Work out what to check before taking a donation, paying a bill or filing a report.',
        minutes: 6,
        sections: [
          { title: 'Find the rules before money moves', body: 'Check the rules for your election and role. Find out who may donate, how to handle gifts in goods or services, what spending limits apply and which bank account to use. Check the election authority’s current guidance before accepting money or ordering campaign materials.' },
          { title: 'Record the full trail', body: 'For each transaction, keep the date, amount, purpose, source or supplier and the receipt, invoice or other evidence. Keep required identity details in the authorised records. Record any refund or correction and match the entries against bank statements. Give a named person responsibility for checking deadlines and filing returns.' },
          { title: 'Plan for deadlines after voting day', body: 'A disclosure is a report to the election authority. A funding claim is an application for a payment under the election’s rules. Check what reports you still need to file if you lose or withdraw. Use the Electoral readiness calculator to estimate funding and the official instructions to prepare the actual claim.' },
        ],
        exercise: {
          question: 'A supporter offers to pay the campaign’s printer directly. What should the campaign do first?',
          options: [
            { label: 'Accept the offer and track only money paid into the campaign bank account.', feedback: 'A payment to a supplier on the campaign’s behalf can still affect donation, spending and reporting obligations.', correct: false },
            { label: 'Wait until the election result to decide whether the payment matters.', feedback: 'Limits and reporting deadlines can apply before voting day. Check the rules before the supporter pays.', correct: false },
            { label: 'Check the applicable rules before accepting and keep a record of the offer and any payment.', feedback: 'The campaign can then assess how to handle the offer, what evidence to keep and any deadline for reporting it.', correct: true },
          ],
        },
        sources: [
          ['Open Electoral readiness and its funding calculator', '#readiness'],
          ['Choose your election pathway', '#training'],
        ],
      },
    ],
  },
  officeTrainingTrack,
];
