# Seed Catalog

## Goals

- Add `prisma/seed.ts` that seeds 7 categories (health, fitness, learning, mindfulness, productivity, sleep, social)
- Seed 10 system habits per category (70 total), each with icon, description, and default frequency / target days per week
- Give some habits a daily goal and unit (water, meditation minutes, steps)
- Make the seed idempotent (upsert by name)

## Notes

- The habit list is in `context/project-overview.md` section 6.
- Run it against the Neon dev branch only.
