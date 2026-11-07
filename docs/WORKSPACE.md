# Google Workspace integration

The local walkthrough runs entirely on this computer with fictional records. This build also includes a configurable Cloudflare Worker and a Google Apps Script storage bridge. Luke selected his existing Aura of Intelligence Google account as the interim storage owner. A private P4A Membership folder and empty JSON register were created there on 7 November 2026. Metadata readback confirmed owner-only permissions and the intended parent folder. Exact references are retained in ignored `.local/setup/connection.json`. No demo people or activity were uploaded. The runtime, deployment and identity policy are not yet connected.

## Storage arrangement

The bridge keeps one authoritative JSON document in a private Google Drive file. The interim destination is the selected personal account's My Drive, not an organisation-owned Shared Drive. Migrate the records into an appropriately managed Workspace account and restricted organisational folder/shared drive when that organisation is established; the exact migration method needs to match Google account ownership rules. The application reads and updates this document through signed requests. It does not require every website member to hold a paid Workspace seat. Shared project Docs and their permissions are a separate integration; this build does not create or grant access to documents automatically.

This is a concrete, replaceable storage adapter, not a commitment to using one document indefinitely. The current limit is 1 MiB for a request, with whole-document reads and writes serialised by an Apps Script lock. Quotas, document size, backup retention and measured concurrency will determine when to partition records or change the storage adapter. There is no application database dependency on Cloudflare.

Only this bridge may write the authoritative file. Manual edits and other scripts do not share its lock and can overwrite application updates. Organisers use the CRM for ordinary updates. Any exceptional migration needs a maintenance window, validated backup and revision handling.

## Connecting an organisation's Workspace

1. The interim owner and private Drive destination are recorded in `.local/setup/connection.json`. Confirm administration and recovery access; select a dedicated Workspace organisation when ready. Confirm its sharing rules, storage location and retention policy before adding real member information.
2. An empty restricted register has already been prepared for the interim account; reuse its recorded file ID rather than creating a duplicate. For a new environment, create a restricted JSON file containing the complete empty application state from `emptyState()` in `src/domain.mjs`. From the project root, `node --input-type=module -e "import {emptyState} from './src/domain.mjs'; console.log(JSON.stringify(emptyState(),null,2))"` prints the initial JSON. It has `revision: 0` and empty collections, including `processed` for command idempotency. Never copy demonstration people, activities or public totals into a live register. The initial organiser needs controlled provisioning of a person ID, name, role and verified identity subject before live use.
3. Make a dedicated Apps Script project containing `integrations/google-workspace/Code.gs`. Its execution account needs access only to the intended storage resource; Apps Script's Drive scope remains broad at the account level, so use an account with narrowly scoped access.
4. Set private Script Properties `STATE_FILE_ID` and `WORKSPACE_SECRET`. Use a high-entropy random secret of at least 32 characters. Keep it out of files, source control, logs and the browser. The Worker receives the same secret through Cloudflare secret configuration.
5. Deploy the script as a web application executing as the storage account. The server-to-server endpoint must be callable without an interactive Google session, if organisational policy permits. HMAC authentication then controls application requests. Do not weaken an organisation policy to make this pattern work; use a directly authorised Drive API adapter instead if necessary. Apps Script ContentService redirects responses through Google; the Worker follows those responses without transmitting credentials in headers or URLs.
6. Configure Worker secrets `WORKSPACE_URL` (the exact `https://script.google.com/macros/s/…/exec` deployment URL) and `WORKSPACE_SECRET`. The URL is restricted to Google Apps Script deployment paths. The Worker sends a timestamped, nonce-bearing signed payload. The bridge checks HMAC, freshness and best-effort nonce replay caching; the revision check is the durable protection against repeating writes. A command retry must retain its original command ID.
7. Exercise concurrent writes, failed requests, read permissions, export and restore with non-sensitive acceptance records in that Workspace before using real data. This repository's tests cover the protocol in isolation; they do not establish account permissions or live Google service behaviour.

The bridge returns generic failures and never includes its file ID, secret or internal exception in responses. It does not use domain-wide delegation. Its lock serialises only writers in this script project. Configure operational monitoring without recording private payloads, and keep a protected backup/restore procedure. This build does not claim immutable financial auditing or disaster recovery.

## Optional production identity adapter

`src/auth.mjs` supports a Cloudflare Access application as one explicit integration option. This does not select Access as P4A's general member sign-in service. Identity providers, email delivery and public self-registration are still operational choices. A valid login identifies a person; it does not grant formal party membership, subscriptions or political rights.

For this adapter, configure `ACCESS_ISSUER` as the exact HTTPS origin of the organisation's `*.cloudflareaccess.com` team and `ACCESS_AUD` as the application's audience. Access policy, member admission and its pricing need review before using it for the public member service. The verifier checks RS256 signatures, issuer, audience, expiry and not-before time, then maps the verified subject to exactly one provisioned CRM person. That person's private `authSubject` and `role` fields must be set through a controlled administrative provisioning process. Email address alone never establishes that mapping. No endpoint grants or edits roles.

Serve the website and API on the same origin. Authentication does not replace the application's record-level authorisation or same-origin mutation checks. The local demonstration session endpoint is implemented only by the loopback Node server and is never accepted by the production Worker. Missing production configuration fails closed.

## Current boundaries

Payments remain disabled: the operator, pricing, terms and provider have not been chosen. No financial entitlements or actual billing event processing is implied by the review interface. Public transparency is a deliberately selected projection of published records, never a public link to the private CRM document. Verse Box assistance and Missing Middle opportunities are planning records, not confirmed bookings or installations.

## Constitution drafts and state upgrades

The register includes a `constitutions` collection containing working drafts, clause versions, amendment proposals, discussion and review history. These records are available to authenticated participants; they are excluded from the public transparency projection. An organiser may merge another person's proposal into a working draft. That operation never adopts a constitution or establishes an organisation, party registration or voting rights.

Older live files without `constitutions` are read as an empty collection in memory. Reading them makes no external change; the collection is retained with the next authorised application write. The Apps Script bridge accepts both older files and the extended array. The local review server separately adds one clearly identified proposed working draft on the first restart after this upgrade, preserves the existing fictional review records, advances their revision once and writes the upgrade atomically. It never copies that sample draft into live Google storage.

## Primary implementation references

- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Apps Script locks](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Apps Script web applications](https://developers.google.com/apps-script/guides/web)
- [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)
- [Google Shared Drive concepts](https://developers.google.com/workspace/drive/api/guides/about-shareddrives)
