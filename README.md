# f1-race-weekend-workflow

A workflow and decision-tracking system designed to manage car setup changes across an F1 race weekend, scoped per racing team.

This project focuses on modelling how engineering teams make, approve, and review setup decisions under time pressure, with clear workflow stages, role-based permissions, and full auditability.

## Problem Overview

During an F1 race weekend, teams make frequent setup decisions across Practice, Qualifying, and Race sessions. These decisions often involve multiple engineers, strict timing constraints, and session-based rules that restrict what can be changed and when. Information is commonly spread across tools and conversations, making it difficult to track what changed, who approved it, and why.

This system provides a single source of truth for:
- the current stage of the race weekend
- versioned car setups
- proposed and approved setup changes
- decision history and accountability

## Key Concepts

- **Workflow-driven design:** The system behaviour changes based on the current weekend stage (Practice, Qualifying, Race, Review).
- **Role-based access:** Engineers propose changes, Lead Engineers approve them, and all actions are permission-checked server-side. Users operate within a team context and provide a role and name for accountability and audit logging.
- **Team-scoped data:** All weekends, setups, and decisions belong to a specific team, ensuring clear separation, ownership, and accountability.
- **Audit-first approach:** Core entities are immutable; decisions are recorded as explicit events rather than silent updates.
- **API-first architecture:** A REST API enforces workflow rules and serves as the single source of truth for the frontend.

## Repository Structure

```
docs/
  planning-and-design.md
```

The repository currently contains Sprint 0 planning and design documentation. Implementation will follow in subsequent sprints.

## Project Status

- Sprint 0: Planning & Design — **In Progress**
- Sprint 1: Core Workflow Implementation — **Planned**

## Tech Stack (Planned)

- Frontend: React
- Backend: REST API (Node.js / Express or equivalent)
- Data Storage: Relational database (PostgreSQL or equivalent)

## Notes

This project is intentionally scoped to focus on workflow correctness, decision traceability, and system clarity rather than real-time telemetry or performance modelling.
