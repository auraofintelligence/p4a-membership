// Original destinations use the generated 4 x 4 sheet.
export const iconNames = Object.freeze([
  'home', 'projects', 'priority', 'people',
  'groups', 'hours', 'transparency', 'resources',
  'constitution', 'profile', 'nodes', 'abundance',
  'missing-middle', 'verse-box', 'legal', 'bills',
  'gamify', 'campaigns', 'readiness', 'training', 'onboarding',
  'relevance', 'committees', 'twins', 'redlands', 'scan', 'genesis',
]);

export function civicIcon(name) {
  if (!iconNames.includes(name)) return '';
  return `<span class="civic-icon civic-icon-${name}" aria-hidden="true"></span>`;
}

export const compactLabels = Object.freeze({
  home: 'Home', projects: 'Projects', priority: 'Priorities', people: 'People',
  groups: 'Groups', nodes: 'Local nodes', hours: 'Contribution', gamify: 'Gamify',
  transparency: 'Transparency', resources: 'Ideas & tools',
  constitution: 'Constitution', profile: 'Membership', campaigns: 'Campaigns', readiness: 'Readiness', training: 'Training', onboarding: 'Onboarding',
});
