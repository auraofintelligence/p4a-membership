const auraSites = 'https://auraofintelligence.github.io/';
const geodeAtlas = `${auraSites}aura-genesis-geode-atlas/`;
const genesis = 'https://p4a.xyz/pages/aura-genesis.html';

export const auraResource = {
  icon: 'genesis', name: 'Aura of Intelligence', label: 'The original idea behind P4A',
  description: 'Start with personal AI and Verse Box. Explore the 60-day Genesis proposal, HBOT Geodes, Observer Studio and Truth Engine.',
  url: '#resources/aura',
};

export const verseBoxUrl = `${auraSites}aura-verse-box/`;

export function auraOverview({ heading, icon, e }) {
  const source = (label, url) => `<a class="aura-source" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} <span aria-hidden="true">↗</span></a>`;
  return `<div class="aura-overview">
    <a class="aura-source" href="#resources">← Connected ideas</a>
    ${heading('The original idea behind P4A', 'Aura of Intelligence', 'What could we build together if each of us had AI we could shape, question and correct?')}
    <section class="aura-section" aria-labelledby="aura-personal-title">
      <div class="aura-projects">
        <article class="panel aura-project">
          ${icon('relevance')}
          <h2 id="aura-personal-title">A personal Aura</h2>
          <p>Aura of Intelligence proposes personal AI shaped by the stories, relationships, values and goals you choose to share. You can revisit what your Aura understood, challenge its interpretation and correct the record as your life changes. You can develop an Aura at your own pace.</p>
          ${source('Explore Aura of Intelligence', auraSites)}
          ${source('Try Aura Matrix Studio', `${auraSites}aura-matrix-studio/`)}
        </article>
        <article class="panel aura-project">
          ${icon('verse-box')}
          <h2>Verse Box</h2>
          <p>Verse Box is a proposed lower-cost community station where you could try personal AI with someone on hand to help. Bring a question, a learning task or a project and take home what you make.</p>
          ${source('Explore the Verse Box project', verseBoxUrl)}
        </article>
      </div>
    </section>
    <section class="aura-section aura-genesis" aria-labelledby="aura-genesis-title">
      <h2 id="aura-genesis-title">The 60-day Aura Genesis program</h2>
      <p>Genesis is a proposed intensive program designed around hyperbaric oxygen therapy (HBOT) Geodes. Its ambition is to build a high-detail digital twin of body and mind through dialogue, reflection and observations the participant agrees to collect.</p>
      ${source('Read the Aura Genesis proposal', genesis)}
      <div class="aura-projects">
        <article class="panel aura-project">
          ${icon('genesis')}
          <h3>HBOT Geodes</h3>
          <p>The first proposed pathway starts with an existing seated, mask-fed HBOT chamber and a new experience layer. Crystalline Geodes are a later research concept.</p>
          ${source('Explore the Geode Atlas', geodeAtlas)}
        </article>
        <article class="panel aura-project">
          ${icon('training')}
          <h3>Observer Studio</h3>
          <p>Explore the browser studio for reflection and learning. Compare how a participant describes an experience with what an observer records, then work through what the participant would correct or add.</p>
          ${source('Open Observer Studio', `${auraSites}aura-genesis-observer-studio/index.html#overview`)}
        </article>
        <article class="panel aura-project">
          ${icon('transparency')}
          <h3>Truth Engine within Genesis</h3>
          <p>This proposed research component compares what someone says with observations from exercises they’ve agreed to. It explores how words, beliefs and actions line up in context. The participant can question an interpretation, explain what was missed and correct the record.</p>
          ${source('Read the Genesis Truth Engine design', `${geodeAtlas}truth-engine.html`)}
        </article>
      </div>
    </section>
    <section class="panel aura-section" aria-labelledby="aura-civic-title">
      <h2 id="aura-civic-title">From personal insight to civic work</h2>
      <p>A personal Aura could help you prepare a C-Hour record from agreed evidence, check the draft and choose what to share. Your private record belongs in L0. L1 is the first place you can share the part you choose.</p>
      <p>The related P4A Truth Engine proposal applies a review process to public claims. Readers should be able to find the source, see what remains uncertain, identify who reviewed the claim and follow any corrections.</p>
      <div class="button-row"><a class="aura-source" href="#hours">Contributions and C-Hours</a>${source('Read the P4A Truth Engine proposal', 'https://p4a.xyz/pages/truth-engine.html')}</div>
    </section>
    <section class="aura-section" aria-labelledby="aura-related-title">
      <h2 id="aura-related-title">Explore related work</h2>
      <ul class="aura-links">
        <li>${source('Aura Ecosystem', `${auraSites}aura-ecosystem/`)}</li>
        <li>${source('Whole of Life', `${auraSites}aura-whole-of-life/`)}</li>
        <li>${source('Child Services', `${auraSites}aura-child-services/`)}</li>
        <li>${source('Teacher Development', `${auraSites}aura-teacher-training/`)}</li>
        <li>${source('Tourism', `${auraSites}aura-tourism/`)}</li>
        <li>${source('Disaster Resilience', `${auraSites}aura-disaster-resilience/`)}</li>
        <li>${source('Aura Civic Establishment', `${auraSites}aura-civic-establishment/`)}</li>
      </ul>
      <p>Luke Nathan Hayes’s <cite>A Protopian Gambit</cite> tells this story in song. <cite>60 Days Set in Stone</cite> imagines the Genesis experience, and <cite>We Go Beyond</cite> carries it from personal reflection into civic stewardship.</p>
      ${source('Open A Protopian Gambit', `${auraSites}i-C-infinity-music-universe/albums/a-protopian-gambit/`)}
    </section>
  </div>`;
}
