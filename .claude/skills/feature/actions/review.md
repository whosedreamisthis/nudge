# Review Action


1. Read current-feature.md to understand the goals
2. Review all code changes made for this feature
3. Check for:
   - ✅ Goals met
   - ❌ Goals missing or incomplete
   - ⚠️ Code quality issues or bugs
   - 🚫 Scope creep (code beyond goals)
   - 🔒 Data access: queries are scoped by `userId`, input is validated with Zod, and schema changes use migrations (never `prisma db push`)
   - 🌱 System habits: if the feature adds or changes habit fields, the system-habit catalog seed is updated to match
   - 🧪 Tests: new or changed server actions and utilities with testable logic have Vitest tests, and `npm test` passes
4. Final verdict: Ready to complete or needs changes