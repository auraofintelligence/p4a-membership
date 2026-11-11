export const strangeButTrue = Object.freeze({
  name: 'Strange But True',
  place: 'Minjerribah / North Stradbroke Island',
  url: 'https://auraofintelligence.github.io/strange-but-true/',
  purpose: 'Luke Hayes’ local doorway into practical tech and AI help, creative media, community ideas and civic participation.',
  p4aSource: 'https://p4a.xyz/#act-ground',
});

export const redlandsCivicLab = Object.freeze({
  name: 'Redlands Civic Lab',
  label: 'Civic simulation · Redlands',
  description: 'Luke Hayes’ former mayoral campaign site, now a civic simulation exploring Redlands questions, projects and possibilities. The campaign has ended.',
  url: 'https://auraofintelligence.github.io/redlands-mayoral-campaign/index.html',
});

export function homeDoors(icon) {
  return `<section class="home-doors" aria-label="Build, contribute and connect locally">
    <a class="home-door gamify-door" href="#gamify">
      ${icon('gamify')}
      <div><span class="eyebrow">Recognise what we contribute</span><h2>Gamify Democracy</h2><p>See the funding and freely given time behind shared work. Explore two leaderboards, verified receipts and your recognition choices.</p><span class="door-action">Explore contribution leaderboards →</span></div>
    </a>
    <a class="home-door constitution-door" href="#constitution">
      ${icon('constitution')}
      <div><span class="eyebrow">Write the rules together</span><h2>Constitution workbench</h2><p>Read the draft, propose a clause and follow the discussion and changes.</p><span class="door-action">Open the constitution builder →</span></div>
    </a>
    <a class="home-door node-door" href="${strangeButTrue.url}" target="_blank" rel="noopener noreferrer">
      ${icon('nodes')}
      <div><span class="eyebrow">A local node · Minjerribah</span><h2>Strange But True</h2><p>Practical tech and AI help, creative work and community ideas on Straddie.</p><span class="door-action">Visit the local node ↗</span></div>
    </a>
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
    <section class="panel wide-panel subheading"><span class="eyebrow">Related civic simulation</span><h2>${redlandsCivicLab.name}</h2><p class="muted">${redlandsCivicLab.description}</p><p class="muted">It draws on the local work behind Strange But True and invites exploration of what could be adapted for greater Redlands. Luke is not contesting the 2026 Redland City mayoral by-election.</p><a class="button secondary" href="${redlandsCivicLab.url}" target="_blank" rel="noopener noreferrer">Explore the Redlands civic simulation ↗</a></section>
    <section class="panel wide-panel subheading"><h2>Grow from useful local relationships.</h2><p class="muted">P4A’s public ground-game page points to Strange But True as a local example of the pattern. A node can bring together practical help, learning, creative work and community projects, with its own people, purpose and responsibilities.</p><a class="button quiet" href="#groups">Explore working groups →</a></section>`;
}
