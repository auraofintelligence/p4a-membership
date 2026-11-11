# Stringent identity, membership and public accountability

User-directed engineering requirements, 7 November 2026 (Australia/Brisbane).

Update, 11 November 2026: the user selected an initial comparison of (A) a named public money ledger with membership-register disclosure separate and (B) the named ledger plus a public membership register. The exact disclosure must be clearly presented and affirmatively chosen before participation/publication, with the same identity and admission standard for both. This qualifies the earlier optional-profile wording below; it does not authorise publication of identity documents or financial credentials, nor retroactive publication of existing records. See [the updated contribution direction](GAMIFY-DEMOCRACY.md#direction-clarified-11-november-2026). These are design requirements; the pilot and live blockchain reporting remain unimplemented.

P4A requires stringent ethical KYC, substantive civic induction and independently reviewable admission. Members may choose to disclose their name, membership and verification status publicly, supported by a zero-knowledge proof of identity verification. This is the first intended integration point for blockchain in the membership application.

These requirements govern future implementation. They are not an adopted constitution, a completed verification system, a legal compliance certification or permission to publish anyone's data. P4A remains a movement in formation. Public civic resources remain accessible.

## Admission standard

Every formal movement or party membership must pass all applicable gates before acceptance:

1. **Account control:** verify a contact channel and bind a secure account to the applicant. Email or Google login is an account check, not completed KYC.
2. **Identity proofing:** establish a real person's identity using approved reliable evidence, validate that evidence through an authorised method, and bind the person to their account/credential. Record the method, assurance policy version, evidence reference, result, verifier and review date. Check duplicates within the appropriate membership scope without making a public identity index.
3. **Eligibility:** separately establish the requirements of the named entity and jurisdiction. Electoral enrolment and registration-support eligibility are distinct from identity and ordinary community participation. Only use lawfully available evidence and authorised regulator processes; do not imply private access to electoral databases.
4. **Civic induction:** cover the movement's purpose, evidence and correction, respectful disagreement, conflicts, privacy, contribution, decision rights and accountability. Use practical scenarios and a recorded human review of understanding. Provide accessible formats and opportunities to resolve misunderstandings.
5. **Commitment:** record acceptance of the relevant admission terms and conduct standards, including their versions and dates. Prohibit harassment, intimidation, dehumanisation and deliberate misrepresentation; provide a process for correcting mistakes and addressing breaches. Protect good-faith disagreement and criticism.
6. **Independent admission:** a reviewer other than the applicant records the outcome and reasons. Incomplete or inconclusive checks cannot produce an accepted/verified result. Give an understandable next action, correction route and appeal to a different reviewer.

KYC establishes identity and specified attributes. It cannot establish honesty, character or future conduct. The Truth Engine, a political-opinion score or an AI personality assessment must not determine admission. Money, popularity and a purchased credential do not substitute for the gates above.

An assisted or in-person route must meet the same approved assurance standard. Exceptions require documented reasons and independent second review; an exception must not falsely claim a check passed. The evidence policy, induction material and operational admission terms still need to be developed and approved through P4A's actual governance process.

## Stronger responsibility brings stronger checks

Officers, identity reviewers, administrators and people handling money need completed member verification, strong multi-factor authentication, verified appointment and authority, conflict disclosures and role-specific eligibility checks. Two people must approve privileged access and significant financial actions under a published authority schedule. Review changes of role, compromised accounts, changed identity evidence and expired verification.

Donors and organisational counterparties need the identity, authority, eligibility and source-of-funds checks appropriate to applicable law and the transaction's risk. Define thresholds and escalation rules before collecting money. Being a political member does not by itself make someone a politically exposed person or require a generic criminal-history check.

## Member-controlled public disclosure

The user expressly selected **name, membership, verification status and a ZKP of identity verification** as the optional public disclosures. Identity documents are not part of this public profile.

- Give separate, off-by-default choices for each public field and proof presentation. Private KYC remains a membership requirement even when a person chooses no public profile.
- Show an exact preview and require explicit confirmation before publishing. Record the disclosure's wording, scope, version, time and member authorisation.
- Label display names and verified identity attributes accurately. A proof must be bound to the profile/account and the actual claims shown; it must not certify an unrelated or unverified name.
- State the issuer, assurance standard, scope, verification date, expiry and current status in understandable language. Identity verification and membership of a named entity are separate claims.
- Permit withdrawal and correction. Remove the site disclosure and stop future proof publication when consent is withdrawn. Explain before publication that external copies may remain; do not promise erasure of public blockchains or third-party copies.
- Publicly naming a person makes that profile linkable. ZK protects undisclosed attributes; it does not make an explicitly named profile anonymous.

## Zero-knowledge credentials and blockchain

### Trust and issuance

An approved identity verifier completes the evidence process. A credential issuer then issues a cryptographically verifiable identity credential to the member's controlled key or approved assisted-custody arrangement. P4A separately issues membership claims only after admission. Publish who may issue which claim and how issuer authority is established, changed or revoked.

The intended proof statement is: the presenter holds a valid credential from an approved issuer, issued under the disclosed verification standard, supporting the selected claims. The proof establishes those cryptographic facts; trust in the identity-checking process and issuer still matters.

Use a reviewed ZK credential protocol with selective disclosure. Evaluate W3C BBS/Data Integrity and suitable alternatives against audited implementations, holder binding, supported runtimes, revocation, portability, accessibility and operational costs. No cryptographic suite, provider, network or assurance-level accreditation is selected by this document. A hash, a signed badge or ordinary selective disclosure alone must not be labelled a ZKP.

At this review, W3C's BBS specification is a Candidate Recommendation Draft dated 10 September 2026, not a final Recommendation. Its holder-binding and pseudonym options need evaluation as part of the complete protocol. Identity and membership credentials must prove a binding to the same legitimate holder without exposing an unnecessary cross-service identifier.

### Blockchain's initial role

| Layer | Intended responsibility |
| --- | --- |
| Private membership service on Cloudflare | Admission rules, scoped access, consent, review and published profile management |
| Private Google storage | Operational member records and minimal verification results; the evidence store needs separate controls |
| Credential holder and issuer | Identity/member credentials, member authorisation, proof generation and key recovery |
| Blockchain | Verifiable issuer/key authority, carefully designed credential-status commitments and independently checkable audit commitments |
| Public verifier | Verify the proof, issuer authority, exact disclosed claims, validity period, status freshness and intended presentation context |

Design public commitments in batches or another privacy-reviewed construction. Assess timing, status queries, wallet activity and identifiers for political-affiliation leakage. Do not put names, addresses, dates of birth, ID numbers, scans, biometrics, raw verification references, individual membership lists or guessable hashes of those values on-chain. A hash of predictable personal information is not anonymisation. The choice of public or permissioned network must be justified against independent verification, privacy, costs and governance.

Issuer/contract changes and key rotation require controlled multi-person approval and an inspectable history. Use operator-funded anchoring and assess relayer/funding traces. Select revocation together with the proof protocol: a conventional status list or stable status index can correlate presentations and is not itself a ZK non-revocation proof.

### Verification and lifecycle acceptance tests

- Live authentication proofs must be bound to a verifier, origin/purpose and fresh challenge, with replay protection and proof of the appropriate account/key control. Merely owning a wallet is not KYC.
- Optional public profile proofs must identify their publication context, consent revision, profile binding and validity time. They are public attestations, not reusable login credentials or proof that the person is currently online.
- Reject forged, altered, wrong-issuer, wrong-profile, expired, revoked and stale-status proofs. Check membership status independently from identity status. An unavailable verifier/status source must display an unconfirmed state rather than a verified badge.
- Test revocation, re-verification, name changes, departure, issuer/key rotation, lost keys, compromise, recovery and consent withdrawal. Recovery must preserve assurance and invalidate superseded credentials when appropriate.
- Demonstrate that proofs disclose only selected claims, cannot be transferred to certify another account, and do not reveal a stable cross-project identifier without a documented need and permission.
- Use established cryptographic implementations with independent review and negative/interoperability tests. Measure browser/Worker performance and network costs before live use. No tokens, trading, public wallet funding or cryptocurrency purchase are required of members unless a later explicitly approved design changes that.

## Payment-funded blockchain operations

Read this alongside [Gamify Democracy](GAMIFY-DEMOCRACY.md): monetary and voluntary leaderboards, portable contribution receipts and recognition across local nodes are core requested capabilities. The blockchain/payment evaluation must include those purposes. Network-fee funding is one operational use within that broader design.

The user clarified that their minted iCi/Solana token is personal to Strange But True. It does not select a P4A asset or network. Evaluate P4A's own arrangement using the [Australian selection criteria](GAMIFY-DEMOCRACY.md#australian-selection-criteria), including AUD accounting, the actual services and authorisations, electoral treatment and privacy.

The user proposes automatically buying a cryptocurrency token from a received payment **when there is a demonstrated benefit for ZKP infrastructure or financial/donation reporting**. This is a candidate capability to evaluate, not a selected asset, investment strategy or authority to execute transactions now. Members should still be able to pay in ordinary money and use credentials without purchasing cryptocurrency themselves.

The clearest operational use is maintaining a capped balance for approved network fees, issuer/status updates and batched audit anchors. Proof generation and credential verification do not inherently require a token purchase; costs depend on where the chosen protocol performs computation and records state. Compare self-funded network fees, transaction sponsorship and a provider charging in fiat against total fees, reliability, custody, portability and disclosure requirements. ERC-4337 paymasters are one Ethereum-compatible sponsorship mechanism to evaluate, not a chosen network or supplier.

Evaluate this payment flow:

1. Authenticate the payment event and record the original payer, recipient legal entity, purpose, currency, gross amount, fees, time and payment reference. Check payer/donor eligibility and classify the receipt under the applicable jurisdiction. A subscription label does not settle electoral treatment.
2. Reconcile settlement and permitted use of funds. Preserve required bank-account flows, restricted donation purposes, refunds, chargebacks and operating commitments. Treat payment authorisation, settlement and later dispute risk as different states.
3. If an approved network-fee balance needs replenishment, purchase only the policy-permitted amount within budget, approved venue/asset/wallet, quote-age, fee and price-movement limits. Aggregate replenishment where practical instead of creating a traceable on-chain purchase for every member payment.
4. Record the conversion as a separate transaction with exchange order, asset quantity, AUD value and valuation source, fees, destination, authority and transaction identifier. Reconcile partial fills, failed transfers, retries and chain finality. A duplicate webhook must never cause another purchase.
5. Link network spending and remaining holdings to the original accounting records and publish appropriate reconciled totals and audit commitments. Changes in crypto value, subsequent spending and disposal are additional accounting events; they must not rewrite the original donor or receipt.

Before activation, approve the actual legal entity, financial-account requirements, custody model, exchange/provider, asset and chain, bank/refund reserves, per-order and period limits, permitted uses and stop conditions. Two authorised people approve the automation policy and changes; ordinary transactions can then run within that authority with monitored limits and an emergency stop. Unexpected quotes, provider/status failures, depleted reserves or unreconciled transfers stop conversion and enter review. Keep financial credentials server-side and tightly restrict withdrawal destinations. No actual numeric budgets or token allocations have been chosen.

Conversion for the organisation's own operating costs, accepting an original crypto donation, and exchanging/holding assets for members are different legal and accounting arrangements. Assess the actual service before assigning AML/CTF, financial-services and electoral obligations. In particular, a blockchain wallet does not replace a required electoral bank account or statutory disclosure. The provider and accountant must establish the correct treatment before live collection/conversion.

Keep each recipient entity's funds and authority separately attributable. The AEC's federal-account requirements commencing 1 January 2027 must be reflected in the relevant receipt and spending paths; do not pool future parties' money or convert restricted funds before establishing their permitted use. A receipt of crypto directly from a donor needs a separately reviewed acceptance and valuation policy. This design does not assume that every jurisdiction permits or treats such gifts identically.

For donation-reporting proofs, evaluate signed receipts and ZK proofs over a committed ledger independently of asset conversion. A proof can support a precise claim about committed records under its stated assumptions; it cannot establish that unrecorded donations do not exist or that a donor's original statements were true. Preserve complete private audit/regulator records and the required named disclosures. Public proof publication follows the same consent, privacy and lawful-disclosure boundaries as other transparency records.

References for this candidate design:

- [ERC-4337 transaction sponsorship and paymasters](https://eips.ethereum.org/EIPS/eip-4337)
- [W3C credential trust infrastructure](https://www.w3.org/TR/vc-data-model-2.0/)
- [AUSTRAC virtual asset designated services](https://www.austrac.gov.au/new-austrac/designated-services-newly-regulated-entities/virtual-asset-designated-services)
- [ATO cryptocurrency record keeping](https://smallbusiness.taxsuperandyou.gov.au/record-keeping/cryptocurrency-records)
- [AEC funding and disclosure reforms](https://www.aec.gov.au/FADReform/factsheets/intro-to-reform.htm)
- [AEC transitional rules](https://aec.gov.au/FADTransitionalRules/)

## Transparency and evidence protection

Publish admission and verification standards, reviewer authority, leadership responsibilities, conflicts, governance decisions and reasons, finances, audit findings and corrective actions. Publish verification/review performance and exception statistics with measures to prevent identification of individuals in small groups. Apply required electoral disclosures and approved voluntary disclosures deliberately; do not publish the private register.

Identity evidence needs a dedicated permission separate from general organiser access. Keep the minimum verified result in the CRM and restrict any necessary raw evidence to an appropriately secured store. Specify lawful purpose, access logging, retention, deletion and recovery for each category. Establish tamper-evident event history, independently retained or anchored audit checkpoints, and append-only corrections. Blockchain commitments alone do not prove that an original decision was accurate or that every event was recorded.

The existing personal Google account is the authorised interim owner. Its empty register and current whole-file JSON bridge do not establish readiness to hold identity documents. Test and establish the required storage, administration and recovery controls before accepting real KYC evidence; preserve the user's Google storage preference when selecting the actual configuration.

## Current implementation gap

The present demo has account roles, membership application/review, selected consents and local activity history. It does **not** implement identity proofing, the induction/admission gates above, dedicated KYC permissions, tamper-evident auditing, credential issuance, ZK proofs, blockchain transactions, public member profiles or live self-registration. Its organiser role currently has broad CRM access. Its JSON activity records are mutable. Existing demo/accepted records must never be backfilled as verified without actual evidence; any future live migration needs an explicit verification-pending transition and fair notice.

The next implementation must make each gate visible and enforce it server-side, preserve existing demo data, provide accurate pending/failed/verified/expired/revoked statuses, and prove private/public separation before external connections. Do not upload real documents, purchase a verification service, publish disclosures or send blockchain transactions merely because this requirement has been recorded.

## Source and policy distinctions

Stringent KYC and induction are explicit user requirements. They exceed a bare email sign-up. Their detailed engineering design is proposed here; lawful obligations and formal governing rules need their own review. AUSTRAC reporting duties depend on actual designated services and the Australian link, not on using the word KYC. Assess future financial/web3 services separately.

Primary references checked 7 November 2026:

- [National Identity Proofing Guidelines](https://www.ag.gov.au/national-security/publications/national-identity-proofing-guidelines)
- [OAIC collection and sensitive-information guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information)
- [AUSTRAC: who and what it regulates](https://www.austrac.gov.au/new-austrac/who-and-what-we-regulate)
- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [W3C BBS Data Integrity cryptosuites](https://www.w3.org/TR/vc-di-bbs/) (check current specification and implementation maturity at selection)
- [W3C Bitstring Status List](https://www.w3.org/TR/vc-bitstring-status-list/) (including its privacy and correlation considerations)
- [AEC registration guide](https://www.aec.gov.au/Parties_and_Representatives/Party_Registration/guide/files/party-registration-guide.pdf)
- [ECQ party-registration policy](https://www.ecq.qld.gov.au/_resource/documents/pdf/donation-and-expenditure-disclosure/political-party-registration/Maintaining-the-register-of-political-parties-Policy-and-procedure.pdf)
