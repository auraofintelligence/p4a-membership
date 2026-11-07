# Membership build contract

This is a standalone custom P4A CRM and member workspace. Existing repositories stay separately hosted. All seeded records are fictional demonstration records. P4A is a movement in formation, not a registered party, and has no adopted constitution. Household Bill Check, Legal Engine, public civic resources and transparency stay publicly accessible.

## Identity and ethical admission requirement

The user requires stringent ethical KYC, substantive civic induction, independently reviewed membership admission and extensive governance transparency. Members may opt to publish name, membership and verification status, with a genuine zero-knowledge proof of identity verification. Blockchain integration starts with credential trust/status and audit verification, while private member records retain the Google storage direction. Implement the gates and acceptance criteria in [IDENTITY-AND-TRANSPARENCY.md](docs/IDENTITY-AND-TRANSPARENCY.md). This is a mandatory development requirement, not a claim that KYC, ZK proofs, blockchain or an adopted admission policy already exist. Account authentication alone must never be represented as identity proofing.

## Gamify Democracy requirement

Monetary and voluntary contribution leaderboards are a core requested capability. Keep monetary giving, paid project work, voluntary C-Hours and outcomes distinguishable, with source-linked receipts, independent verification, named-publication consent and correction/appeal. Support local nodes and wider civic scales. Evaluate blockchain and payment automation for contribution recognition and portable/auditable receipts as well as network costs. Follow [GAMIFY-DEMOCRACY.md](docs/GAMIFY-DEMOCRACY.md); the existing aggregate-publication consent is not named-leaderboard consent. No monetary conversion of C-Hours or automatic political entitlement.

## Runtime implementation

The user's personal Strange But True iCi/Solana token is separate from P4A. Do not inherit it as P4A's asset or network choice. Select P4A's payment/blockchain arrangement against Australian regulatory, accounting, privacy and member requirements using the [Australian selection criteria](docs/GAMIFY-DEMOCRACY.md#australian-selection-criteria). No P4A token or network is selected.

Payment-funded token acquisition is a candidate automation where a measured benefit supports credential/blockchain operations or financial reporting. Follow the receipt, settlement, permitted-use, budget, authorisation and reconciliation requirements in [IDENTITY-AND-TRANSPARENCY.md](docs/IDENTITY-AND-TRANSPARENCY.md#payment-funded-blockchain-operations). Record original receipts and subsequent conversions separately. No token, network, provider, amount or live purchase is authorised or configured by this design note.

Buildless HTML/CSS/ES modules in `public/`. Cloudflare Worker in `src/worker.mjs`. Node local preview in `scripts/serve.mjs`, loopback port 8791. Shared application commands in `src/domain.mjs`. No third-party runtime dependencies. Local preview persists only fictional review data to ignored `.local/state.json`. Local demo identities are explicit and unavailable in production. Production fails closed until identity and Workspace storage are configured. No live payment collection in this build: operator, provider and pricing are undecided.

## API contract

JSON `{error: string}` errors. Every private mutation requires same-origin protection and `Content-Type: application/json`. Every response containing private data is `Cache-Control: no-store`. An authenticated actor has `{id, name, role: 'member'|'organiser'}`.

- `GET /api/bootstrap`: returns `{mode: 'demo'|'live', actor: null|actor, revision, people, groups, projects, memberships, contributions, financialContributions, decisions, activity, billing: {enabled: false}, integrations: {workspace: boolean}}`. Anonymous returns only public projection collections, no people, memberships or private activity. Member gets self profile, self memberships, group-visible projects and contributions belonging to self. Organiser gets CRM records. Public records explicitly marked for publication, separate from private fields.
- `POST /api/demo/session` body `{role: 'member'|'organiser'|'public'}`: localhost review only; sets HttpOnly SameSite cookie. Member actor `person-1`, organiser `person-2`. Response actor. Use endpoint only in local server, never Worker.
- `POST /api/commands` body `{id: crypto.randomUUID(), revision: number, type, data}`: optimistic revision, idempotent command ID, validated bounded fields, append audit event, return `{ok:true, revision}`; conflict 409. Commands below.
- `GET /api/export`: actor-scoped JSON export. No anonymous export.
- `GET /api/public`: allowlisted public transparency projection, never raw private CRM.
- `GET /api/gamify?period=all|year&groupId=&projectId=`: public contribution boards, consented totals and allowed filter options. Only verified, consented receipts for public projects qualify. Group metadata additionally requires `group.public === true`. Rows expose chosen names, totals, receipt counts and project breakdowns; no raw contributor IDs or receipt evidence.

## Records and commands

People: `{id,name,email,place,skills,interests,directoryConsent:boolean,contactConsent:boolean}`. Text skills/interests. `profile.update` only actor's profile, data name/place/skills/interests/consents (no role). `person.create` organiser only, data name/email/place/skills/interests; new people have both consents false, not automatically formal members.

Groups: `{id,name,level,place,description,memberIds:[]}`. `group.join` data groupId; `group.leave` same. Join local working group only, no automatic party affiliation. Projects: `{id,title,summary,groupId,theme,status:'proposed'|'active'|'review'|'complete',urgency:1..5,importance:1..5,reason,evidenceUrl,reviewDate,ownerId,participantIds:[],tasks:[],comments:[]}`. Tasks `{id,title,done,assigneeId}`. Comments `{id,personId,text,createdAt}`. `project.create` data title/summary/groupId/theme/urgency/importance/reason/evidenceUrl/reviewDate; actor must belong group. `project.join` data projectId. `project.priority` data projectId/urgency/importance/reason/evidenceUrl/reviewDate; organiser or owner. `task.add` data projectId/title; `task.toggle` data projectId/taskId; `comment.add` data projectId/text; all require project participation or organiser. `project.status` organiser or owner data projectId/status.

Memberships: `{id,personId,organisationId:'p4a-movement',status:'pending'|'accepted'|'withdrawn',kind:'movement',createdAt}`. `membership.apply` acknowledges `{acknowledged:true}` actual in-formation movement status. `membership.review` organiser data membershipId/status accepted or withdrawn; no self approval. `membership.withdraw` own current membership. No legal party registration or political voting rights implied.

Contributions: `{id,personId,projectId,date,hours,description,status:'pending'|'verified'|'rejected',verifierId:null,publicConsent:false,namedConsent:false,createdBy,history:[]}`. `contribution.log` actor, projectId/date/hours/description/publicConsent; hours finite 0.25..24. `contribution.review` organiser data contributionId/status verified or rejected. Never self verify, duplicate exact receipt blocked, date <= today. Verified hours counted once; no money conversion.

Gamify commands extend voluntary records with owner-only `contribution.sharing {contributionId,publicConsent,namedConsent}`, `contribution.correct {contributionId,date,hours,description,reason}` and independent organiser `contribution.revoke {contributionId,reason}`. Existing aggregate consent never implies named consent. Corrections retain history, reset status to pending and clear both publication choices. Verification records the review reason when supplied.

Financial records belong to `p4a-movement` and store integer AUD cents, `personId`, `projectId`, date, category (`donation`, `sponsorship`, `project-funding`), private reference/description, creator, review status, separate publication choices, refunds and history. `financial.log` submits `{projectId,date,amountCents,category,reference,description,publicConsent,namedConsent}`; organisers may supply another `personId`, without granting that person's publication consent. `financial.review {contributionId,status,reason,settled}` requires an organiser other than donor or creator and `settled:true` when verified. `financial.refund {contributionId,amountCents,reference,reason}` records a completed positive adjustment within the unrefunded amount, without transferring funds. `financial.revoke`, `financial.sharing` and `financial.correct` follow the analogous controls. Financial corrections require the full receipt fields plus a reason, reserve historical references, and cannot rewrite a receipt with recorded refunds. Private exports add derived `refundedCents`/`netCents`.

All public financial totals are original verified amounts less recorded refunds/chargebacks, with no fee deduction; adjustments restate the original receipt period. Named and aggregate publication are independent permissions; public totals count their union once. Named rankings use only explicitly named receipts. Records are manually reviewed; these commands do not establish donor eligibility, perform KYC or collect funds. Live financial integrations remain disabled.

Decisions: `{id,title,summary,date,status,public:boolean}` seeded published sample decisions, clearly demonstration. Activity: `{id,type,actorId,at,summary}` metadata only.

Theme keys: `everyday-life`, `missing-middle`, `verse-box`, `civic-evidence`, `local-care`. JRA informs urgency and importance as explicit human assessment, no automatic people score or invented canonical formula. Verse Box supports optional communal learning/cultural sessions, never medical collection or participation condition. Missing Middle supports place-based shared infrastructure stewardship and capability projects.

## Ownership

Backend agent owns `src/`, `scripts/serve.mjs`, `integrations/`, `test/` and `docs/WORKSPACE.md`. Root owns `public/`, README/package/wrangler/config and delivery docs. Source concepts agent read-only. No changes to existing public sites or committee repository.
