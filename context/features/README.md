# Feature Specs

Small, ordered specs. Load one at a time with `/feature load <name>` (e.g. `/feature load 01-project-setup`). Each depends only on earlier ones.

| #   | Feature                    | Area       |
| --- | -------------------------- | ---------- |
| 01  | project-setup              | Foundation |
| 02  | database-schema            | Foundation |
| 03  | clerk-auth                 | Foundation |
| 04  | user-sync                  | Foundation |
| 05  | seed-catalog               | Foundation |
| 06  | app-shell                  | Foundation |
| 07  | streaks-logic              | Today      |
| 08  | today-list                 | Today      |
| 09  | toggle-completion          | Today      |
| 10  | today-stat-tiles           | Today      |
| 11  | consistency-heatmap        | Today      |
| 12  | new-habit-modal            | Habits     |
| 13  | weekly-and-off-day-habits  | Today      |
| 14  | multi-step-habits          | Today      |
| 15  | habit-actions-menu         | Habits     |
| 16  | habits-catalog-page        | Habits     |
| 17  | archived-habits            | Habits     |
| 18  | progress-weekly-grid       | Progress   |
| 19  | progress-insights-tab      | Progress   |
| 20  | ai-weekly-report           | AI         |
| 21  | morning-motivation         | AI         |
| 22  | ai-habit-suggestions       | AI         |
| 23  | journal-write              | Journal    |
| 24  | journal-history            | Journal    |
| 25  | focus-timer                | Focus      |
| 26  | focus-habit-link           | Focus      |
| 27  | settings-modal             | Settings   |
| 28  | celebrations               | Polish     |
| 30  | caching                    | Performance |
| 29a | demo-data-and-cleanup      | Demo       |
| 29b | demo-try-flow              | Demo       |
| 32  | today-declutter            | Polish     |

`29a` and `29b` were split from one larger demo spec (temporary per-IP demo account). Build 29a first, so no demo can exist before the code that deletes it, then 29b. Keep `lib/demo-seed.ts` current as later features add data.
