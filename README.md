# curb-mishaps

How much money does Larry David lose through his mishaps on *Curb Your Enthusiasm*, and how does it compare with his real net worth?

The real point is the build: every number comes from a metric defined once in the dbt semantic layer (MetricFlow) and requested by name. No hand-written SQL behind any chart.

**Stack:** Google Sheet → BigQuery (external table) → dbt Core → MetricFlow → Next.js

- `docs/PROJECT_BRIEF.md`: thesis, data rules, metric list
- `docs/SETUP.md`: Google Cloud, GitHub and local setup
- `CLAUDE.md`: conventions for agents working in this repo
