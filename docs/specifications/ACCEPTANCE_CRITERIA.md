# Acceptance Criteria

The implementation is complete only when:

1. One Metric Registry defines every metric's quantity, unit, direction, label, and precision.
2. `SIXTY_TIME` and `POP_TIME` accept seconds only.
3. Velocity metrics accept mph only.
4. Client, API, server, database, benchmark loader, imports, exports, and spreadsheets reject incompatible units.
5. Unit mismatches produce no grade and are excluded from derived calculations.
6. Existing data, benchmark configurations, imports, exports, templates, labels, calculations, and fixtures are audited.
7. Ambiguous records are marked `RequiresReview` and are not silently converted.
8. Corrections retain complete audit history.
9. Cached and indexed invalid results are invalidated.
10. Static scans find no active `60-Yard + mph`, `SIXTY_TIME + mph`, `Pop Time + mph`, or `POP_TIME + mph` combinations.
11. Round-trip tests preserve metric, quantity, unit, direction, and raw value.
12. Deployment is blocked when unit-integrity tests or scans fail.
13. Rollback is tested.
14. No unresolved critical or high-severity unit-integrity defect remains.
