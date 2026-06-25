# /legacy — Deprecated Implementations

This folder receives obsolete pages and components **after** their replacements
are validated in Phase 2. Nothing is deleted until all new implementations are
tested and functional.

## Migration-first rules
- Old pages/routes stay wired and functional during Phase 1.
- Each moved file is marked with:
  ```
  @deprecated
  TODO: remove after migration validation
  ```
- Deletion happens only in Phase 2f, post-validation.

## Scheduled to move here (Phase 2f)
| Legacy | Superseded by |
|---|---|
| pages/ATIQuickScore, ATIStandard, ATIFullReport, ATIPassport, ATICard, ATIVerify, ATIVerifySession | pages/ATICenter (tabs) |
| pages/SoarStartupHub, AviationStartupHub | pages/StartupHub |
| pages/FunnelDashboard, FunnelCanvas | pages/GrowthCenter |
| components/GlassCard + glassmorphism CSS (.glass*, --glass-*) | components/core/CoreCard |
| Duplicate stat tiles (dashboard/StatCard, analytics/StatTile, commissions/StatTile) | components/core/CoreStatCard |
| Experimental pages (MaxChat, SkyBoss, IntraZone, IntraZoneDemo) | pages/labs/* (out of primary nav) |

## New routes added in Phase 1 (alongside legacy, no removals)
- `/ati-center` → ATICenter
- `/startup-center` → StartupHub
- `/growth-center` → GrowthCenter