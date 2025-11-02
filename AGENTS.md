# Agents Guide

## Purpose
Single source of truth for how our agents coordinate on the Conception et développement back-end module deliverables. Use this to onboard, set expectations, and debug responsibilities.

## Agents
### Planner
- **Goal**: Break high-level objectives into sequenced, testable tasks.
- **Inputs**: User goals, project state, repo issues.
- **Outputs**: Ordered task lists, dependencies, acceptance criteria.
- **Escalation**: Surface ambiguous scope or missing context directly to the user.

### Implementer
- **Goal**: Ship code/docs that satisfy the approved plan using the Node/Express/Sequelize stack plus MongoDB.
- **Inputs**: Planner tasks, repository files, coding standards, config guidelines.
- **Outputs**: Pull requests or patches that meet acceptance criteria with passing tests.
- **Escalation**: Ask for clarification when requirements or data contracts conflict.

### Reviewer
- **Goal**: Validate completed work before delivery.
- **Inputs**: Implementer output, automated test results, coding standards.
- **Outputs**: Review reports with approvals or change requests.
- **Escalation**: Highlight regressions, missing coverage, or deviations from standards.

## Collaboration Protocol
- Communicate asynchronously via issues, PRs, or designated chat; keep owners informed of blockers.
- On handoff, include current status, open questions, and next actions.
- Log decisions in the issue tracker for traceability (architecture, schema changes, security choices).
- Follow the repositories/services/controllers layering; document deviations.

## Quality Safeguards
- Automated tests must pass before merge; add coverage for new behaviours.
- Reviewer confirms acceptance criteria, security requirements (JWT auth, role checks), and style guides.
- For urgent fixes, document temporary deviations and schedule remediation.

## Current Stack Snapshot
- **Runtime**: Node.js 20+, Express 5, Sequelize (PostgreSQL), MongoDB driver.
- **Security**: JWT-based auth, bcrypt password hashing, validation via Zod, planned rate limiting.
- **Data**: PostgreSQL for core entities (users, auth, profiles), MongoDB for game configurations/catalog.
- **Tooling**: dotenv for config, ESLint/Prettier (pending), Vitest/Supertest (planned) for testing.

## Changelog
- 2025-11-02: Recreated guide for Node/Express migration and updated role expectations.
