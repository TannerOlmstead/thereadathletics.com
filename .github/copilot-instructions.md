# THE READ GitHub Copilot Instructions

## Source of truth

Read all applicable files in `docs/specifications/` before proposing or implementing changes.

## Measurement unit rules

- `SIXTY_TIME` is elapsed time, uses `seconds`, and is `LowerIsBetter`.
- `POP_TIME` is elapsed time, uses `seconds`, and is `LowerIsBetter`.
- `AVG_EV`, `MAX_EV`, `THROW_VELO`, `AVG_FBV`, and `MAX_FBV` use `mph` and are `HigherIsBetter`.
- Reject incompatible metric-unit combinations.
- A unit mismatch must not produce a grade, F, zero, or Not Rated.

## Progressive Tier Spacing

Apply Progressive Tier Spacing only to raw measurable benchmark tables.

Do not apply it to Frame Projection, Athletic Score, OPG, SOPG, DPG, SDPG, PPG, Recruit Score, Confidence, or Player Tier.

## Change control

Before implementation:

1. Audit current behavior.
2. Identify conflicts with the specifications.
3. Identify the smallest set of files requiring changes.
4. Do not modify unrelated functionality.

After implementation:

1. Report every file changed.
2. Report every test added.
3. Report every unresolved issue.
4. Confirm every acceptance criterion.
5. Do not claim completion if required tests fail.
