export const strangeButTrue = Object.freeze({
  name: 'Strange But True',
  place: 'Minjerribah / North Stradbroke Island',
  url: 'https://auraofintelligence.github.io/strange-but-true/',
  purpose: 'Luke Hayes’ local doorway into practical tech and AI help, creative media, community ideas and civic participation.',
  p4aSource: 'https://p4a.xyz/#act-ground',
});

export const redlandsCivicLab = Object.freeze({
  icon: 'redlands',
  name: 'Redlands Civic Lab',
  label: 'Civic simulation · Redlands',
  description: 'Luke Hayes’ former mayoral campaign site, now a civic simulation exploring Redlands questions, projects and possibilities. The campaign has ended.',
  url: 'https://auraofintelligence.github.io/redlands-mayoral-campaign/index.html',
});

const campaignCentres = [
  {
    name: 'Redlands Mayoral Command Centre',
    place: 'Redlands · Local government',
    description: 'Operations workspace from the former Redlands mayoral campaign. GitHub repository access is required.',
    url: 'https://github.com/auraofintelligence/redlands-mayoral-command-centre',
  },
];

const redlandsDataset = 'https://auraofintelligence.github.io/Redlands_draft_ES2026-2031/';
const electionLevels = {
  local: 'Local government',
  state: 'State or territory',
  federal: 'Federal',
};
const regions = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export function campaignReplicationPrompt({level, region, electorate} = {}) {
  return `Build a P4A campaign command centre, a sourced public electorate dashboard and a way to follow relevant committee inquiries for the Australian election area below.

Election level: ${electionLevels[level] || '[local government, state or territory, or federal]'}
State or territory: ${region || '[state or territory]'}
Council, ward, division or electorate: ${electorate?.trim() || '[official name]'}
Election and office: [confirmed election or by-election and office, if known]
Candidate or team: [optional working name]

Use the Redlands Mayoral Command Centre as an operations reference if I provide access: ${campaignCentres[0].url}. If access is unavailable, build from this brief.

For the public-facing site, use the former Redlands mayoral campaign page at ${redlandsCivicLab.url} as an example of presenting local issues, projects and ways to participate. It now runs as the Redlands Civic Lab simulation. Adapt the structure to the new area and treat Redlands campaign details as historical context.

For the public dashboard, study the Redlands Coast Intelligence independent draft at ${redlandsDataset} and its structured source file at ${redlandsDataset}data/dashboard.json. Adapt the structure, verify all local facts afresh, and credit material you reuse under its applicable licence.

1. Verify the area's official name, boundary version, election authority and election dates from official sources. Use the correct geography and terminology for the selected jurisdiction. If the election is unconfirmed, show that status.
2. Build a public dataset of aggregate population and housing, local economy and household costs, transport and services, projects and budgets where relevant. Start with the electoral authority, ABS and relevant government or council sources. Record each figure's definition, geography, unit, reference period, publisher, URL, date checked and limitations. Label estimates, budgets, actuals and missing data. Explain any statistical boundaries that differ from the electorate. Provide readable source cards, downloadable structured data and a dated change log.
3. Set up a private workspace for source research, optional work items, communications drafts, consented contacts, finance records and review. Start with empty private records and fictional test data. Keep private records, identifying data and credentials out of the public dashboard, source repository and public exports. Keep a human approval step for publication, messages and spending.
4. Use the P4A public site at https://p4a.xyz/ as the movement reference and follow its localisation guide at https://github.com/auraofintelligence/p4a-xyz-cinema/blob/main/LOCALISE_WITH_AN_AGENT.md. Link to P4A and the Campaign Command Centre directory at https://auraofintelligence.github.io/p4a-membership/#campaigns. Prepare a proposed directory entry with the area, election level, state or territory, public URL and verified campaign status for P4A maintainers to review. Reflect P4A’s current status as a movement in formation and show the verified status of any local candidacy or endorsement.
5. Use P4A Committees & Inquiries at https://auraofintelligence.github.io/p4a-xyz-committees-inquiries/ as a starting point for finding inquiries relevant to the electorate. Check the responsible authorities for current opportunities and coverage gaps. Link the public dashboard to the project and directly to official inquiry pages. For each relevant inquiry, record the responsible body, jurisdiction, terms of reference, status, closing date, participation and publication conditions, official submission link, date checked and relevant evidence from the electorate dataset. Keep draft submissions in the private workspace for human review. Verify details before publishing and use official submission channels.
6. Record open questions and link to current official election, disclosure and authorisation guidance. Include setup instructions, tests for private/public access and dataset provenance, and a brief walkthrough. Leave deployment and external actions for explicit approval.`;
}

export function homeDoors(icon, pilot = false) {
  return `<section class="home-doors" aria-label="Build, contribute and connect locally">
    <a class="home-door onboarding-door" href="#onboarding">${icon('onboarding')}<div><h2>Membership onboarding</h2><p>See how applications, civic induction and independent review fit together.</p><span class="door-action">Explore the membership path →</span></div></a>
    <a class="home-door gamify-door" href="#gamify">
      ${icon('gamify')}
      <div><span class="eyebrow">Recognise what we contribute</span><h2>Gamify Democracy</h2><p>See the funding and freely given time behind shared work. Explore two leaderboards, verified receipts and your recognition choices.</p><span class="door-action">Explore contribution leaderboards →</span></div>
    </a>
    <a class="home-door constitution-door" href="#constitution">
      ${icon('constitution')}
      <div><span class="eyebrow">Write the rules together</span><h2>Constitution workbench</h2><p>Read the draft, propose a clause and follow the discussion and changes.</p><span class="door-action">Open the constitution builder →</span></div>
    </a>
    <a class="home-door campaign-door" href="#campaigns">
      ${icon('campaigns')}
      <div><h2>Campaign Command Centre</h2><p>Find campaign workspaces by place and see how to access them.</p><span class="door-action">Browse command centres →</span></div>
    </a>
    ${pilot ? `<a class="home-door training-door" href="#training">${icon('training')}<div><h2>Civic training</h2><p>Take part, volunteer, stand for election or learn how to serve in office.</p><span class="door-action">Choose where to start →</span></div></a>` : ''}
    <a class="home-door node-door" href="${strangeButTrue.url}" target="_blank" rel="noopener noreferrer">
      ${icon('nodes')}
      <div><span class="eyebrow">A local node · Minjerribah</span><h2>Strange But True</h2><p>Practical tech and AI help, creative work and community ideas on Straddie.</p><span class="door-action">Visit the local node ↗</span></div>
    </a>
    <a class="home-door node-door" href="${redlandsCivicLab.url}" target="_blank" rel="noopener noreferrer">
      ${icon(redlandsCivicLab.icon)}
      <div><span class="eyebrow">${redlandsCivicLab.label}</span><h2>${redlandsCivicLab.name}</h2><p>Explore local questions, projects and possibilities for greater Redlands.</p><span class="door-action">Explore the simulation ↗</span></div>
    </a>
  </section>`;
}

export function campaignsView({heading, icon, pilot}) {
  return `${heading('Campaign operations', 'Campaign Command Centre', 'Browse campaign workspaces by place and adapt the Redlands model to your electorate.')}
    <section class="quick-links" aria-label="Campaign workspaces and references">
      ${campaignCentres.map(centre => `<a class="resource-card" href="${centre.url}" target="_blank" rel="noopener noreferrer">
        ${icon('campaigns')}
        <small>${centre.place}</small>
        <h3>${centre.name}</h3>
        <p>${centre.description}</p>
        <span class="door-action">Open private repository ↗</span>
      </a>`).join('')}
      <a class="resource-card" href="${redlandsCivicLab.url}" target="_blank" rel="noopener noreferrer">
        ${icon(redlandsCivicLab.icon)}
        <small>Redlands · Public-facing reference</small>
        <h3>${redlandsCivicLab.name}</h3>
        <p>${redlandsCivicLab.description}</p>
        <span class="door-action">Open the former mayoral site ↗</span>
      </a>
    </section>
    ${pilot ? `<a class="home-door campaign-door readiness-door" href="#readiness">${icon('readiness')}<div><h2>Electoral readiness</h2><p>Check registration targets, six-month readiness dates and campaign rules across Australia.</p><span class="door-action">Open the electoral calendar →</span></div></a>` : ''}
    <section class="panel wide-panel subheading" aria-labelledby="campaign-model-heading">
      <h2 id="campaign-model-heading">How the Redlands model works</h2>
      <p class="muted">The Command Centre was the private operations workspace for the former Redlands mayoral campaign. It brings research, communications drafts and finance records together for review.</p>
      <p class="muted">A public dashboard gives residents access to local evidence. The Redlands example is an independent draft with dated figures on population, the economy, household costs, island communities, projects and council budgets. Each measure links to its source.</p>
      <div class="button-row subheading"><a class="button secondary" href="${redlandsDataset}" target="_blank" rel="noopener noreferrer">Explore the Redlands dataset ↗</a><a class="button quiet" href="${redlandsDataset}data/dashboard.json" target="_blank" rel="noopener noreferrer">Open the structured data ↗</a></div>
    </section>
    <section class="panel wide-panel subheading campaign-prompt-panel" id="campaign-prompt-panel" aria-labelledby="campaign-prompt-heading">
      <h2 id="campaign-prompt-heading">Set up a command centre for your electorate</h2>
      <p class="muted">Choose an election level and area, then copy the prompt into your coding assistant. You can fill in the remaining details there.</p>
      <div class="form-grid subheading">
        <label class="field">Election level<select data-campaign-field="level"><option value="">Choose a level</option>${Object.entries(electionLevels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
        <label class="field">State or territory<select data-campaign-field="region"><option value="">Choose a state or territory</option>${regions.map(region => `<option>${region}</option>`).join('')}</select></label>
        <label class="field full">Council, ward, division or electorate<input data-campaign-field="electorate" type="text" maxlength="140"></label>
      </div>
      <label class="field subheading">Replication prompt<textarea id="campaign-prompt" rows="12" readonly>${campaignReplicationPrompt()}</textarea></label>
      <div class="button-row subheading"><button class="button" type="button" data-action="copy-campaign-prompt">Copy prompt</button></div>
    </section>`;
}

export function localNodesView({heading,icon}) {
  return `${heading('The ground game','Local nodes. Real people and places.','A local doorway into useful work, shared learning and civic participation.')}
    <article class="panel local-node-detail">
      <div class="node-heading">${icon('nodes')}<div><span class="eyebrow">P4A’s live L1 outreach example</span><h2>Strange But True</h2><p class="muted">${strangeButTrue.place}</p></div></div>
      <p class="node-purpose">${strangeButTrue.purpose}</p>
      <div class="node-capabilities"><span>Tech & AI help</span><span>Creative media & events</span><span>Grants & community ideas</span><span>Digital confidence</span></div>
      <p class="muted">Based in Amity, with local help and meetings by arrangement. Follow the node’s own website for services, contact details and current availability.</p>
      <div class="button-row subheading"><a class="button" href="${strangeButTrue.url}" target="_blank" rel="noopener noreferrer">Visit Strange But True ↗</a><a class="button secondary" href="${strangeButTrue.p4aSource}" target="_blank" rel="noopener noreferrer">See the P4A connection ↗</a></div>
    </article>
    <section class="panel wide-panel subheading"><div class="node-heading">${icon(redlandsCivicLab.icon)}<div><span class="eyebrow">Related civic simulation</span><h2>${redlandsCivicLab.name}</h2></div></div><p class="muted">${redlandsCivicLab.description}</p><p class="muted">It draws on the local work behind Strange But True and invites exploration of what could be adapted for greater Redlands. Luke is not contesting the 2026 Redland City mayoral by-election.</p><a class="button secondary" href="${redlandsCivicLab.url}" target="_blank" rel="noopener noreferrer">Explore the Redlands civic simulation ↗</a></section>
    <section class="panel wide-panel subheading"><h2>Grow from useful local relationships.</h2><p class="muted">P4A’s public ground-game page points to Strange But True as a local example of the pattern. A node can bring together practical help, learning, creative work and community projects, with its own people, purpose and responsibilities.</p><a class="button quiet" href="#groups">Explore working groups →</a></section>`;
}
