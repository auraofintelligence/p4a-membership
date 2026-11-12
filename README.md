# P4A: People & possibility

A working custom membership and civic CRM foundation for **P4A the Purple Party for Australia**, built on 7 November 2026. It connects people, groups, projects, reviewable priorities and voluntary contribution. The application is separate from the existing civic websites and the committees project.

## Public interactive preview

[Open the public P4A membership preview](https://auraofintelligence.github.io/p4a-membership/).

Start with the [membership guide](https://auraofintelligence.github.io/p4a-membership/apply/), then open the [application preview](https://auraofintelligence.github.io/p4a-membership/apply/application.html). GitHub Pages does not receive applications or payments.

GitHub Pages serves a separate, clearly labelled fictional browser demo. Try Public view, Member demo and Organiser demo to explore the workbench and contribution flows. Changes exist only in the open page and reset when it reloads. Do not enter real personal or financial details. This preview does not accept real memberships or payments and has no Google, identity-verification or blockchain connection.

The [worked C-Hour proposal](https://auraofintelligence.github.io/p4a-membership/#constitution/trial) demonstrates how Aura could prepare records of overlapping voluntary work from agreed evidence. Compare the drafts, choose what to share, then try evidence review, a fictional ballot, sunset and audit download.

The [Electorate finance calculator](https://auraofintelligence.github.io/p4a-membership/#finance) uses one payment per member, the standard and concession mix, and federal electorate coverage. The [Merch calculator](https://auraofintelligence.github.io/p4a-membership/#merch) groups monthly sales by dollar profit per item. [Contributions](https://auraofintelligence.github.io/p4a-membership/#hours) combines different gift amounts within each donation schedule, with a separate total for potential bequests. The [detailed cash budget](https://auraofintelligence.github.io/p4a-membership/#finance/detail) starts each electorate at A$0, keeps operating and campaign funds separate, and supports planning and local file export through 2031.

[Combine estimates](https://auraofintelligence.github.io/p4a-membership/#finance/compare) rolls the three quick calculators into a 12-month exercise with two reference electorates, adjustable donation and merch activity, and CSV export. AEC electorate types and matched ABS population, area and Census figures provide context for the assumptions you choose.

`npm run build:pages` creates an allowlisted `dist/` using public assets and shared domain rules. The Pages workflow tests the application and publishes that output on pushes to `main`. It excludes local records, credentials and live storage/authentication adapters. The Cloudflare Worker remains the separate intended production runtime.

## Private Cloudflare pilot

The pilot Worker in [wrangler.pilot.jsonc](wrangler.pilot.jsonc) uses its own D1 database. It starts with the configured organiser profile and empty working groups, projects and drafts. Changes persist across sign-ins. An organiser can create the first private working group and use it to start a project. Cloudflare Access restricts the workspace to the verified organiser aliases.

1. Create a dedicated D1 database named `p4a-membership-pilot`, apply [the pilot migrations](migrations/pilot/), and use its ID in an ignored local copy of the configuration. Resolve the entry point, assets and migration paths from the copy's location. The tracked template disables public routes.
2. Create a Cloudflare Access application for this Worker or its exact `workers.dev` hostname. Use an Allow policy with the invited email addresses and an authenticated sign-in method such as One-time PIN. Use a policy specific to the pilot.
3. Set `ACCESS_ISSUER` to the Zero Trust team URL and `ACCESS_AUD` to the application audience tag. Set `PILOT_ORGANISER_EMAILS` as a JSON array and `PILOT_ORGANISER_NAME` as the display name in Worker secrets. The aliases resolve to one organiser record. Keep these values out of tracked files.
4. Enable the pilot's `workers.dev` route once Access is set up. Verify signed-out protection and the signed-in workspace. The pilot database has a 1 MiB snapshot limit. Public member enrolment and live payments require their own setup.

See [Cloudflare Worker Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) and [application audience tags](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/#get-your-aud-tag).

## Run the working review

Use Node.js 24 for the full local site, including application submission and review. No package installation or frontend build is required.

```powershell
cd G:\GithubLocal-PC\p4a-membership
npm start
```

Open [the local workspace](http://127.0.0.1:8791/) for civic training, electoral readiness and the member and organiser views. The [membership guide](http://127.0.0.1:8791/apply/) leads to the [membership application](http://127.0.0.1:8791/apply/application.html) on the same server. Use sample details and choose **Organiser demo → Membership onboarding → Open sample applications** to review them. Sample applications are cleared when the server stops.

The local workspace keeps sample project and activity changes in ignored `.local/state.json`. The server binds to this computer, refuses unexpected Host headers and cross-origin changes, and has no live payments or Google Drive connection. The [guide](application-public/guide.html) and [application](application-public/application.html) can also be opened directly as local files for reading.

```powershell
npm test
```

## What works

- Member profiles, independent directory/contact consent and scoped record exports.
- Separate working-group participation and movement applications, with review and withdrawal.
- Organiser CRM contacts, membership review and a private activity history.
- Shared projects with participants, tasks, discussion, status and priority reviews.
- A proposed 1–5 urgency/importance method informed by **Joyful Responsible Abundance**, including reasons, evidence, Joy/Responsibility/Abundance prompts, readiness, uncertainty and a review date. Assessment history is retained.
- A **constitution workbench** with ten proposed discussion clauses, separate working documents, amendment and new-clause proposals, before/after comparison, comments, independent review, clause history and Markdown export. Merging an amendment updates a draft; it never adopts a constitution. Read [the drafting guide](docs/CONSTITUTION.md).
- **Missing Middle** opportunity projects linking host, workload, infrastructure, ownership and renewal questions to shared work.
- **Verse Box** assisted participation projects and a participant-reviewed Markdown take-home note downloaded without saving its contents to the CRM.
- Voluntary contribution receipts, independent verification, duplicate checks, and consented public aggregates. No fixed money conversion or extra political entitlement.
- **Gamify Democracy**: separate AUD and C-Hour leaderboards, all-time/current-year and project/group filters, explicit per-receipt named recognition, manual financial receipt review, corrections, recorded refunds/chargebacks and verification withdrawal. Financial records do not collect or transfer money.
- Open resource links and allowlisted public transparency. Household Bill Check and the Legal Engine retain free access.
- A prominent home-page constitution entry and a **Local nodes** section linking to **Strange But True** on Minjerribah / North Stradbroke Island, as identified by P4A’s public ground-game page.
- **Redlands Civic Lab** is linked from Connected ideas and Local nodes as a civic simulation. Luke's mayoral campaign has ended; the link does not present an active candidacy.
- Sixteen generated colourful icons, with a distinct illustration for every navigation destination and visible text labels in the compact sidebar. See [the icon sheet and prompt provenance](docs/ICON-SHEET.md).

P4A remains a movement in formation with no adopted constitution or party registration. These software flows do not create a registered party or enact its future governing rules.

## Hosting and Google storage

The required admission design now includes stringent KYC, substantive civic induction, independent review, and optional public name/membership/verification disclosures supported by zero-knowledge proofs. Blockchain integration is intended for credential trust, status and audit verification. These controls are **requirements, not implemented capabilities**; see [Identity and transparency](docs/IDENTITY-AND-TRANSPARENCY.md).

**Gamify Democracy** provides a local working contribution ledger and two separately measured leaderboards. Public names require an explicit choice for each receipt. Live payment settlement, cross-node credentials, ZKP and blockchain integration remain to be built; no token or network is selected. See [the contribution and leaderboard design](docs/GAMIFY-DEMOCRACY.md).

`wrangler.jsonc` describes a Cloudflare Worker plus static assets. `src/worker.mjs` uses the same application rules as the local server. Production contains no demo impersonation endpoint and fails closed when identity or storage is missing. The optional Cloudflare Access identity adapter verifies a token and maps it to a deliberately provisioned person; it does not settle the public member sign-in choice.

An interim private Drive folder and empty register have been prepared in the Google account Luke selected. Verified account/file references are in ignored `.local/setup/connection.json`. No fictional demo records were uploaded. The running application is **not yet connected** to that register.

The Google adapter uses signed requests, a serial writer and optimistic revisions against one private Drive JSON document. This provides a concrete Workspace integration to test, with a current 1 MiB protocol limit. It is replaceable as measured needs grow. It does not automatically share Google Docs with members or make Drive permissions follow application membership.

See the [membership onboarding guide](docs/ONBOARDING.md), [Google integration and identity setup](docs/WORKSPACE.md), [the concept mapping](docs/CONCEPTS.md) and [verification and remaining live setup](docs/BUILD-STATUS.md).

Payments are intentionally inactive: the operator, paid benefits, pricing, terms and provider remain undecided. A production billing integration, reconciliation and regulatory reporting workflows still need implementation before money is collected. The present transparency view is not a regulator filing service or an accounting ledger.

## Source layout

| Path | Purpose |
| --- | --- |
| `public/` | Responsive member and organiser interface; no secrets or CRM data |
| `application-public/` | Styled membership form and applicant guide |
| `src/domain.mjs` | Validated commands, authorisation, public and private projections |
| `src/http.mjs` | JSON API, same-origin checks and private response headers |
| `src/worker.mjs` | Cloudflare entry point |
| `src/auth.mjs` | Optional verified production identity adapter |
| `src/workspace-store.mjs` | Signed server-to-server storage protocol |
| `integrations/google-workspace/Code.gs` | Private Google Apps Script storage bridge |
| `scripts/serve.mjs` | Local review server with atomic file persistence |
| `test/` | Domain, privacy, HTTP and integration verification |

## Attribution and rights

P4A and the connected civic concepts are by Luke Nathan Hayes / Strange But True / Aura of Intelligence. Preserve the existing [Strange But True Public Source Licence](LICENCE.md) and third-party rights. This is public-source work, not a grant of unrestricted commercial or institutional reuse. No new third-party runtime packages, tracking, remote fonts or remotely hosted media were added. The locally served civic icon sheet was generated with ImageGen; its prompts and source are recorded in [ICON-SHEET.md](docs/ICON-SHEET.md).

The deployed asset root includes `public/robots.txt` and a copy of the licence at `public/LICENCE.md`. Crawl directions follow the connected Strange But True site: public search discovery is allowed, API/private paths are excluded, and the listed training crawlers are asked not to crawl. Robots directives do not enforce access control or grant reuse rights. On GitHub project Pages, the copied file is at `/p4a-membership/robots.txt`; crawler policy is controlled by the shared host's root `/robots.txt`. The project file will be authoritative when this app occupies its own host root.
