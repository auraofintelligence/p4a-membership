# Build status and connection checklist

Verified 7 November 2026, Australia/Brisbane. This records the local implementation and its remaining live connections.

## Scope

This is a standalone custom CRM and membership workspace for P4A. Its implementation contract is [BUILD-CONTRACT.md](../BUILD-CONTRACT.md). The review application uses fictional records and explicit demonstration identities. The existing public sites and committees project stay separately maintained and hosted.

Cloudflare is the intended hosting destination. Google Workspace is the stated storage preference. Neither a production deployment nor a live Workspace connection is established by local development. No live applications, payments, external outreach or public publication are implied by a successful preview.

## Verification results

**51 automated tests passed** (`node --test`), covering domain, privacy, HTTP, constitutional drafting and integration behaviour. Browser checks exercised the member and organiser journeys using fictional records. Tests use isolated mock Google and identity endpoints; they do not establish live service configuration.

- [x] Local application starts and serves the recognisable member and organiser experiences.
- [x] Private API responses prevent caching; private mutations require same-origin JSON requests.
- [x] Anonymous views expose only explicitly allowed public fields.
- [x] Members receive their own profile, memberships and contribution records, plus projects within their permitted groups.
- [x] Organiser-only commands and project ownership checks reject unauthorised actors.
- [x] Local demonstration sessions are unavailable in the production Worker.
- [x] Missing production identity or storage configuration fails closed.
- [x] Command replay is idempotent; stale revisions return a conflict without overwriting newer work.
- [x] Joining and leaving a group do not silently create political-party membership.
- [x] Movement applications acknowledge the actual in-formation status; organisers cannot approve their own application.
- [x] Projects support participation, tasks, discussion, status changes and reasoned priority review.
- [x] Missing Middle and Verse Box appear as connected project types with accurate proposal status.
- [x] Contribution verification prevents self-verification and duplicate receipts; hours have no monetary conversion.
- [x] Export respects the requesting person's access; public reporting contains no raw private register.
- [x] Browser checks covered desktop and narrow layouts, member and organiser forms, saved state, public totals and downloaded records. Browser console checks found no errors in the exercised paths. Full accessibility and production acceptance audits remain outstanding.
- [x] Workspace bridge checks cover its signed requests, locking, revision handling and retry behaviour.

Validation: `node --check public/app.mjs`, `node --check public/constitution.mjs` and `node --test`. Browser review covered a 1366px desktop viewport, the approximately 450px app panel and a 390px narrow viewport; the narrow constitution document had no page-level horizontal overflow. The reviewer created a fictional project, task and comment, applied as a member, accepted the application as another organiser, recorded and independently verified 1.25 voluntary hours, confirmed the consented public total and inspected the downloaded member JSON for other-person email and auth-subject leaks (none). The Verse Box note downloaded locally and its content was absent from the stored CRM. Priority review retained the previous assessment.

The constitution journey was exercised through proposal, discussion and independent merge: the document and clause advanced to version 2, retained earlier wording, and stayed unadopted. A separate local-charter document was created, and a new eleventh clause was proposed and independently merged while the movement draft remained separate. Keyboard Escape dismissed the amendment dialog. Automated tests cover stale parallel amendments, self-review rejection, author withdrawal and safe migration of existing local records.

Passing local tests does not establish a live Google deployment or complete jurisdiction-specific compliance.

### Navigation and local-node update

The home page now gives the constitution workbench its own prominent entry card alongside Strange But True. A separate Local nodes destination identifies Strange But True as P4A’s live L1 outreach example on Minjerribah / North Stradbroke Island and links to its public site. This is a public resource connection, not a new CRM group or political-party membership. Source: the P4A `#act-ground` section and the Strange But True public site.

An unchanged generated PNG supplies sixteen colourful illustrations through CSS sprite positions. Every sidebar destination has a distinct symbol; compact navigation also retains visible text. The image-generation prompts and sprite mapping are in [ICON-SHEET.md](ICON-SHEET.md).

After this update, all 31 automated tests passed. Browser checks confirmed the home constitution link opens the existing draft, the Local nodes link and external Strange But True URL are correct, and home, constitution and local-node pages have no page-level horizontal overflow at a 390px viewport. The 1366px desktop view and narrow sidebar were visually inspected.

### Scroll-position repair

Selecting a constitution clause previously replaced its navigation markup and reset the horizontal row to the start. The shared render now remembers keyed scroll containers before replacement and restores their positions afterwards. Each constitution document has its own key; the people and contribution tables and workspace sidebar also retain their offsets. Selecting a clause restores keyboard focus without moving the page and reveals only any clipped horizontal edge of the selected button.

Browser verification selected clauses 10 and 9 without losing the row's 1241px offset, then activated clause 10 with Tab/Enter. Switching to the separate local charter started that document at 0; returning restored the movement draft's clause 10 and 1241px offset. At 390px, selections 9 and 10 remained visible at nonzero offsets with no page overflow. Console checks were clear and all 31 automated tests passed. Scroll memory lasts within the open application, not across a page reload.

### Gamify Democracy component

The home page and sidebar now open separate monetary (AUD) and voluntary (C-Hour) leaderboards. The public endpoint supports all-time and current Brisbane calendar-year periods, public-project filters and explicitly published working groups. Equal totals share a competition rank. Private group labels and IDs remain hidden unless that group is explicitly marked public; existing group records retain their choices.

The private workspace supports monetary receipt submission, independent review, owner-controlled aggregate/named visibility with a disclosure preview, reasoned corrections, completed refund/chargeback records and verification withdrawal. Voluntary receipts also support visibility, correction and revocation. Corrections reset review and publication choices while retaining history. No collection, refund transaction, token purchase or payment-provider connection is performed.

All 51 tests pass, including 20 Gamify tests covering legacy data, authority, duplicate references and replay, refund reconciliation, correction/reverification, privacy, tied rankings, scope filters and separate people with identical names. Browser checks exercised a fictional $120 receipt, named consent, independent verification, a recorded $20 refund and a $100 net ranking; 1.5 verified voluntary hours remained private until named consent. Switching money to aggregate-only removed the name while retaining the authorised $100 total. Public views did not show the private receipt reference. Year/project filters and the methodology control were exercised. The 390px leaderboard and receipt dialog have no horizontal overflow after repairing shared form-control sizing.

The pre-existing local state was preserved in `.local/review/gamify-before-state.json` before review. The browser added fictional financial review records and reviewed an existing fictional voluntary sample. No demo records were uploaded to Google or any live service.

## Decisions and configuration before live operation

The user has set stringent ethical KYC, civic induction and independent admission as requirements, with optional public name/membership/verification disclosure and a genuine ZKP of ID verification. Blockchain is intended to support credential trust/status and audit verification. [IDENTITY-AND-TRANSPARENCY.md](IDENTITY-AND-TRANSPARENCY.md) records the gates, privacy and public disclosure boundaries, architecture and acceptance criteria. No live KYC provider, induction workflow, ZK credentials, blockchain connection or public member-profile publishing has been implemented. These controls must be developed and verified before claiming that the membership system meets the selected standard.

The design also evaluates bounded automatic token purchases from eligible settled funds when beneficial for blockchain operations/reporting. Original receipts, conversions and later network costs remain separate accounting events. Budget, asset, provider, custody, electoral-account treatment and operational authority are not selected; no purchase or payment integration has been executed.

| Item | Current position | What establishes readiness |
| --- | --- | --- |
| Public member sign-in | Not selected. An optional Cloudflare Access adapter is an engineering route, not an agreed member-facing sign-in experience. | Select and test identity, account recovery, organiser access and departure. |
| Workspace account and ownership | Luke selected his existing Aura of Intelligence Google account for interim storage. A private My Drive folder and empty JSON register were created and verified as owner-only. No sample records were uploaded. | Deploy and test runtime access; establish recovery ownership and later migrate the records into dedicated organisation-owned Workspace storage. Private resource references stay in ignored local configuration. |
| Workspace bridge | Deployment endpoint and credentials are unspecified. | Deploy the reviewed integration, restrict its access, configure secrets server-side and test real reads/writes and recovery using approved test data. |
| Cloudflare | No live account, domain or deployment established by this build. | Configure the intended account, routes, secrets and environment; verify private routes and logging on that deployment. |
| Operator and movement terms | P4A has no adopted constitution and is not a registered party. | Identify the actual operator and approve interim admission, departure, privacy, complaints and governance arrangements. |
| Paid benefits and pricing | Not agreed. Public civic information, transparency, Household Bill Check and the Legal Engine retain free access. | Specify the paid service, price, renewal and cancellation terms separately from political rights. |
| Payment provider | Not selected or connected. Live collection remains disabled. | Confirm support for the operator and activity; implement verified payment events, reconciliation, refunds and appropriate financial classification. |
| Collaborative Google documents | Direct editing access is separate from website membership. | Confirm external collaboration policy and test the intended participant permissions without exposing the underlying register. |
| Public transparency | Publication must be an allowlisted, reviewed projection. | Approve actual public records and reporting responsibilities; establish corrections and regulator filing procedures separately. |
| Additional parties | No party structures are created by demonstration membership records. Constitution scopes distinguish documents, not separate access audiences; all signed-in workspace participants can collaborate on them. | Establish each entity's rules, officers, consent, permissions, finances and applicable registration/reporting arrangements. |

## Operating evidence to establish

Gamify Democracy's local contribution subledger, named-consent controls and separate leaderboards are implemented as described in [GAMIFY-DEMOCRACY.md](GAMIFY-DEMOCRACY.md). Live settlement/reconciliation, paid-work records, cross-node receipts, public identity credentials and blockchain/ZKP functions remain unimplemented. No asset or network has been selected for P4A.

The full billing/paywall workflow, general accounting ledger and regulatory filing workflow are not implemented. Formal governance ballots and adoption, role succession administration and production identity provisioning also remain development work. The current constitution editor supports amendments to existing clauses and proposed new clauses; structural reordering or removal is not implemented.

Before real member records are accepted, demonstrate backup and recovery, correction and export, organiser succession, consent withdrawal, retention handling and an incident response. Confirm capacity against the chosen Workspace integration and expected use. Keep a single authoritative operational register; independently editable copies can create conflicting membership and payment state.

Develop these capabilities through balanced stages that deliver useful membership, collaboration and transparent administration together. Preserve the wider civic direction through explicit relationships and permissions rather than copying all connected repositories into the membership host.
