# Measurement Unit Contract

## Canonical mapping

| Metric key | Physical quantity | Canonical unit | Direction | Display precision |
|---|---|---|---|---:|
| AVG_EV | Velocity | mph | HigherIsBetter | 1 |
| MAX_EV | Velocity | mph | HigherIsBetter | 1 |
| THROW_VELO | Velocity | mph | HigherIsBetter | 1 |
| AVG_FBV | Velocity | mph | HigherIsBetter | 1 |
| MAX_FBV | Velocity | mph | HigherIsBetter | 1 |
| SIXTY_TIME | ElapsedTime | seconds | LowerIsBetter | 2 |
| POP_TIME | ElapsedTime | seconds | LowerIsBetter | 2 |

## Non-negotiable rule

`SIXTY_TIME` and `POP_TIME` must never use mph.

A unit mismatch must:

- Stop calculation
- Return `UnitMismatch`
- Produce no grade or grade value
- Be excluded from derived calculations
- Be logged for correction or review
