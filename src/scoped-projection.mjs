import { projectState, publicProjection } from './domain.mjs';
import { projectConstitution } from './constitution-seed.mjs';
import { financialProjection } from './gamify.mjs';
import { scopedCollections, effectiveAccess, isPilotOwner } from './scoped-access.mjs';
import { committeeDirectory, filterCommitteeTasks } from './committee-governance.mjs';

// Use existing UI contract, but never feed a scoped actor the legacy broad
// organiser projection. All alternate private projections share this path.
export function authorisedProjection(state, actor, mode, workspace, now = new Date()) {
  if (actor?.access !== 'scoped') {
    const result=projectState(state,actor,mode,workspace);
    if(actor)result.projects=filterCommitteeTasks(state,actor,result.projects,now);
    if(isPilotOwner(state,actor)){result.ownerTools=true;result.committeeDirectory=committeeDirectory(state,actor,now);}
    return result;
  }
  const visible = scopedCollections(state,actor,now);
  const limited = { ...state, ...visible, gamifyIdeas:state.gamifyIdeas.filter(row => row.personId === actor.id) };
  const result = projectState(limited, {id:actor.id,name:actor.name,role:'member'}, mode, workspace);
  result.actor = {id:actor.id,name:actor.name,role:'member',access:'scoped'};
  result.access = {grants:effectiveAccess(state,actor,now),admissionEnabled:false};
  // The original projection assumes group membership, while a scoped office
  // may have read access without joining. Expose only explicitly granted rows.
  result.groups = visible.groups.map(({id,name,level,place,description,public:published,memberIds}) => ({
    id,name,level,place,description,public:published,memberIds:memberIds.filter(id => id === actor.id),memberCount:memberIds.length,
  }));
  result.projects = filterCommitteeTasks(state,actor,structuredClone(visible.projects),now);
  result.committeeDirectory=committeeDirectory(state,actor,now);
  result.constitutions = visible.constitutions.map(projectConstitution);
  result.contributions = structuredClone(visible.contributions);
  result.financialContributions = visible.financialContributions.map(financialProjection);
  result.memberProfiles = result.memberProfiles.filter(row => row.id === actor.id);
  // Own profile fields must not acquire credentials/private integration data
  // if the source schema is extended.
  result.people = result.people.map(row => {
    if (row.id !== actor.id) return row;
    const {id,name,email,place,skills,interests,directoryConsent,contactConsent} = row;
    return {id,name,email,place,skills,interests,directoryConsent,contactConsent};
  });
  result.public = publicProjection(state,mode);
  result.decisions = result.public.decisions;
  return result;
}
