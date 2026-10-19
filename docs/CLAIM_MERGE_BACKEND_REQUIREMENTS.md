# Claim / Link / Merge: Backend Requirements

`claim-merge.js` and `claim-review.html` are a **front-end interface only**. State lives in memory and is lost on reload. The site has no backend, so none of the following is enforced today. A production version needs a secure server that provides all of it.

## What the front-end already guarantees (and the server must also enforce)
- A claim never changes athlete data. Approval only links an account to a profile.
- Status labels: Pending, Approved, Rejected, Review Required.
- Mismatched names or grad years, an already linked profile, a competing claim from another account, and any parent / guardian / representative claim are Review Required. Nothing is auto-approved.
- A merge is never automatic. A reviewer picks the canonical profile and decides every conflicting field. Verified values are never overwritten by a merge.
- Every request, decision and merge writes an append-only audit entry with the actor, reason, per-field decisions and before / after snapshots.
- Search results show only: name, grad year, sport, positions, school, state. Never contact data, birth date, scores, notes or private institution data. At most 3 results.

## Server requirements
- Authenticate every request and authorize on the server. Only administrators approve or reject claims and approve merges. Coaches cannot claim athlete profiles.
- Search: rate limiting and bot protection. Return the minimal fields above.
- Verification of the claimant (athlete, or the relationship of a parent / guardian / representative) with random, hashed, expiring, single-use codes. Never put codes in logs or notifications.
- One database transaction for a merge, with locks on both records and a full rollback on failure.
- Merged profiles are archived, not deleted. Old ids keep resolving to the canonical profile.
- Audit rows are immutable (append-only storage). Recovery of a merge is a new audit event.
- Notifications contain no private data.

## Data models
- `AthleteProfile` (status Active or Merged, `mergedIntoId`, `linkedAccountId`, per-field `verified` flags)
- `AthleteClaimRequest` (status, reasons, relationship, reviewer, decision reason, timestamps)
- `AthleteMergeAudit` (append-only: actor, canonical id, duplicate id, per-field decisions, before / after snapshots)

## Requires Founder Decision
- How a parent, guardian or authorized representative is verified, and what extra rules apply to minors.
- Which verification methods are accepted.
- Whether handedness is added to athlete profiles and who may enter it (the handedness configuration in `sports-config.js` is a foundation only).
- Approved handedness choices for every sport other than Baseball. Until approved, those sports accept no handedness value.
- Whether reviewers other than administrators may decide claims.
