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
- **Role-based access:** Engineers propose changes, Lead Engineers approve them, and all actions are permission-checked server-side; actions are recorded with a user name for accountability.
- **Team-scoped data:** Each team uses the system independently, with its own weekends, setups, and decisions.
- **Audit-first approach:** Core entities are immutable; decisions are recorded as explicit actions so changes are visible and traceable, rather than silently overwriting data.
- **API-first architecture:** A REST API enforces workflow rules and serves as the single source of truth for the frontend.

## Repository Structure

```
docs/
  planning-and-design.md
```

The repository currently contains Sprint 0 planning and design documentation. Implementation will follow in subsequent sprints.

## Project Status

- Sprint 0: Planning & Design — **Complete**
- Sprint 1: Backend Foundations & Workflow Enforcement — **In Progress**

## Tech Stack

- Frontend: React (JavaScript)
  Used to build a state-driven user interface that clearly reflects the current workflow stage, permissions, and decisions.
-	Backend: Node.js + Express
  Provides a lightweight REST API that enforces workflow rules, handles approvals, and acts as the single source of truth for the system.
- Database: PostgreSQL
  Stores structured, relational data such as teams, race weekends, setup versions, change requests, and audit events.
-	API: REST + JSON
  Defines clear, predictable endpoints for frontend–backend communication, making workflow actions explicit and enforceable.

## Notes

This project is intentionally scoped to focus on workflow correctness, decision traceability, and system clarity rather than real-time telemetry or performance modelling.
