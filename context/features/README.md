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
| —   | demo-spec                  | Demo       |

`demo-spec` is a larger spec (temporary per-IP demo account). Build it after 04, then keep `lib/demo-seed.ts` current as later features add data. Consider splitting it into smaller specs (create/resume, cleanup job, seed) before loading.
