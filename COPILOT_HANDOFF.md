# Copilot Handoff

## Current task

Enforce benchmark and measurement-unit integrity throughout THE READ.

## Canonical specification version

Version: 0.5 plus Unit Integrity Specification 1.0
Status: Provisional
Git commit: Not yet assigned

## Latest decisions

- 60-Yard Time uses seconds only.
- Pop Time uses seconds only.
- Velocity metrics use mph only.
- Unit mismatches block grade calculation.
- Progressive spacing applies only to raw measurable tables.
- Frame Projection, Athletic Score, OPG, SOPG, DPG, SDPG, and PPG are excluded from progressive spacing.
- Composite grades remain linear.

## Work requested from GitHub Copilot

1. Audit the repository for invalid metric-unit combinations.
2. Report every occurrence of `SIXTY_TIME` or `POP_TIME` associated with `mph`.
3. Do not change code until the audit is reported.
4. Implement the approved unit contract.
5. Add acceptance and regression tests.
6. Return a complete implementation report.

## Questions for Microsoft 365 Copilot

- Record unresolved product decisions here.
- Do not infer product policy in code.
