import { createConstitution, emptyState } from './domain.mjs';
export function createDemoConstitution() {
  return createConstitution({ id: 'constitution-1', title: 'P4A movement constitution', scope: 'movement', actorId: 'person-2', at: '2026-11-07T00:00:00.000Z' });
}
export function migrateDemoState(state) {
  return state.constitutions === undefined ? { ...state, constitutions: [createDemoConstitution()], revision: state.revision + 1 } : state;
}
export function createDemoState() {
  const state = emptyState();
  state.constitutions = [createDemoConstitution()];
  state.people = [
    { id: 'person-1', name: 'Alex River', email: 'alex@example.invalid', place: 'Example neighbourhood, QLD', skills: 'Listening, research and community gardening', interests: 'Household fairness, local learning', directoryConsent: false, contactConsent: false, role: 'member' },
    { id: 'person-2', name: 'Sam Taylor', email: 'sam@example.invalid', place: 'Example neighbourhood, QLD', skills: 'Facilitation and project coordination', interests: 'Open governance and useful local infrastructure', directoryConsent: true, contactConsent: false, role: 'organiser' },
    { id: 'person-3', name: 'Casey Banks', email: 'casey@example.invalid', place: 'Example district, VIC', skills: 'Teaching and accessibility', interests: 'Creative learning', directoryConsent: false, contactConsent: false, role: 'member' },
  ];
  state.groups = [
    { id: 'group-1', name: 'Neighbourhood working circle', level: 'Local community', place: 'Example neighbourhood', description: 'A fictional review group exploring practical local projects.', memberIds: ['person-1', 'person-2'], public: true },
    { id: 'group-2', name: 'Shared learning circle', level: 'Shared interest', place: 'Across places', description: 'A fictional group for learning, public evidence and assisted participation.', memberIds: ['person-2', 'person-3'] },
  ];
  const assessment = { urgency: 3, importance: 4, reason: 'An example human assessment for reviewing the workflow, not an evidence-based conclusion.', evidenceUrl: 'https://auraofintelligence.github.io/joyful-responsible-abundance/index.html', reviewDate: '2026-11-21', joy: 'Give people useful time and confidence.', responsibility: 'Participants choose what they share; the group reviews decisions.', abundance: 'Make useful knowledge and shared capacity more accessible.', uncertainty: 'Illustrative proposal. Participants, evidence and resources need discussion.', readiness: 'Discovery', assessedBy: 'person-2', assessedAt: '2026-11-07T00:00:00.000Z' };
  state.projects = [
    { id: 'project-1', title: 'Everyday bills, clearer answers', summary: 'An example collaborative investigation using public bill-checking tools and participant-reviewed evidence. Private household documents stay with their owners.', groupId: 'group-1', theme: 'everyday-life', status: 'active', ...assessment, urgency: 4, importance: 5, ownerId: 'person-1', participantIds: ['person-1', 'person-2'], tasks: [{ id: 'task-1', title: 'Agree which everyday question to investigate', done: true, assigneeId: 'person-1' }, { id: 'task-2', title: 'Review the public sources together', done: false, assigneeId: 'person-2' }], comments: [{ id: 'comment-1', personId: 'person-2', text: 'Example discussion: start with a sample bill and agree what may be shared.', createdAt: '2026-11-07T00:00:00.000Z' }], public: true },
    { id: 'project-2', title: 'A local Missing Middle opportunity', summary: 'Explore a possible host, useful workloads, ownership and maintenance responsibilities for shared local infrastructure. No installation, host or funding is confirmed.', groupId: 'group-1', theme: 'missing-middle', status: 'proposed', ...assessment, urgency: 3, importance: 5, ownerId: 'person-2', participantIds: ['person-2'], tasks: [{ id: 'task-3', title: 'Describe the local workload before sizing infrastructure', done: false, assigneeId: 'person-2' }], comments: [], public: true },
    { id: 'project-3', title: 'Bring the Verse Box to the neighbourhood', summary: 'Plan a supported introduction: choose an everyday task, try sample material, review a result and take home a chosen copy. This is a planning example, not a bookable event.', groupId: 'group-1', theme: 'verse-box', status: 'proposed', ...assessment, urgency: 2, importance: 4, ownerId: 'person-2', participantIds: ['person-2'], tasks: [{ id: 'task-4', title: 'Discuss host agreement, accessibility and a consented handover', done: false, assigneeId: 'person-2' }], comments: [], public: true },
  ];
  state.memberships = [{ id: 'membership-1', personId: 'person-3', organisationId: 'p4a-movement', status: 'pending', kind: 'movement', createdAt: '2026-11-06T00:00:00.000Z', acknowledgementVersion: 'movement-in-formation-2026-11-07' }];
  state.contributions = [{ id: 'contribution-1', personId: 'person-1', projectId: 'project-1', date: '2026-11-06', hours: 1.5, description: 'Fictional example: prepared sample public research questions.', status: 'pending', verifierId: null, publicConsent: false }];
  state.decisions = [{ id: 'decision-1', title: 'Example: keep civic resources open', summary: 'Demonstration decision record reflecting the design brief: public civic information, Household Bill Check and Legal Engine retain free access.', date: '2026-11-07', status: 'Published example', public: true }, { id: 'decision-2', title: 'Example: independent contribution review', summary: 'A person cannot verify their own contribution. Money, voluntary time and outcomes remain separate.', date: '2026-11-07', status: 'Published example', public: true }];
  return state;
}
