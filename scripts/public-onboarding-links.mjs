// Public navigation contract. No intake endpoint or identity handoff exists.
// This module is build-time only; the Pages allowlist is unchanged.
export const publicOnboarding = Object.freeze({
  guide: 'https://auraofintelligence.github.io/p4a-membership/apply/',
  applicationPreview: 'https://auraofintelligence.github.io/p4a-membership/apply/application.html',
  workspacePreview: 'https://auraofintelligence.github.io/p4a-membership/',
  status: 'closed',
  liveIntake: null,
  returnRoutes: Object.freeze([
    Object.freeze({ url: 'https://p4a.xyz/', label: 'P4A civic workbench', purpose: 'Public ideas, policy and civic resources' }),
    Object.freeze({ url: 'https://auraofintelligence.github.io/p4a-xyz-committees-inquiries/', label: 'Committees and inquiries', purpose: 'Official public participation opportunities' }),
    Object.freeze({ url: 'https://auraofintelligence.github.io/redlands-mayoral-campaign/p4a.html', label: 'Redlands Civic Lab: Explore P4A', purpose: 'Independent local civic simulation, research and collaboration' }),
    Object.freeze({ url: 'https://auraofintelligence.github.io/strange-but-true/community-ledger.html', label: 'Strange But True: Community Ledger', purpose: 'Independent business and local community projects' }),
  ]),
});

export function publicOnboardingNavigation() {
  // All values are fixed reviewed strings, not applicant or browser input.
  return '<section class="panel guide-panel" id="public-pathways" aria-labelledby="public-pathways-title">' +
    '<h2 id="public-pathways-title">Public participation and connected sites</h2>' +
    '<p>Live enrolment is closed. P4A is a movement in formation, not a registered party. You can explore public resources, learn, and participate in official inquiries without joining P4A. The application preview cannot receive real applications. No fees, invitations or transfer of personal records are enabled here.</p>' +
    '<p><a href="../">Explore the fictional civic workspace</a> or <a href="./application.html">view the non-submitting application preview</a>. There is no live application link. Check this guide for future availability.</p>' +
    '<ul>' + publicOnboarding.returnRoutes.map(route => '<li><a href="' + route.url + '" rel="noreferrer">' + route.label + '</a>: ' + route.purpose + '</li>').join('') + '</ul>' +
    '<p>These sites have separate purposes and records. A civic contribution, local project, business enquiry or purchase does not create membership.</p></section>';
}
