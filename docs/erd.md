# GrowFlow — Entity-Relationship Diagram

The Mermaid block below renders directly on GitHub. It is the source of truth
for the data model; if you add or remove an entity, update this file.

```mermaid
erDiagram
    USERS ||--o{ TASKS : "owns"
    USERS ||--o{ USER_HABITS : "tracks"
    USERS ||--o{ JOURNAL_ENTRIES : "writes"
    USERS ||--o{ GOALS : "sets"
    USERS ||--o{ APPOINTMENTS : "books (as patient)"
    USERS ||--o{ APPOINTMENTS : "receives (as professional)"
    USERS ||--o{ USER_BADGES : "earns"
    USERS ||--o{ REPORTS : "receives"
    USERS ||--o{ BUDDY_CONNECTIONS : "sends"
    USERS ||--o{ BUDDY_CONNECTIONS : "receives"

    HABITS ||--o{ USER_HABITS : "instantiated by"
    USER_HABITS ||--o{ HABIT_LOGS : "logged on"
    CATEGORIES ||--o{ HABITS : "categorises"

    USERS {
        int user_id PK
        string name
        string email UK
        string password_hash
        enum role "patient | psychiatrist | psychologist"
        text bio
        string credentials
        string languages
        string fee_text
        int years_experience
        bool verified
        int xp
        int level
        timestamp created_at
        timestamp updated_at
    }

    TASKS {
        int task_id PK
        int user_id FK
        string title
        text description
        enum task_status "pending | in_progress | completed"
        timestamp due_date
        timestamp created_at
    }

    HABITS {
        int habit_id PK
        int category_id FK
        string name
        text description
    }

    USER_HABITS {
        int user_habit_id PK
        int user_id FK
        int habit_id FK
        timestamp start_date
    }

    HABIT_LOGS {
        int log_id PK
        int user_habit_id FK
        date date
        string status
        int mood_score
        timestamp created_at
    }

    JOURNAL_ENTRIES {
        int entry_id PK
        int user_id FK
        text text
        text feedback
        int mood_score "0..100"
        timestamp created_at
    }

    GOALS {
        int goal_id PK
        int user_id FK
        string title
        text description
        int target_value
        int current_value
        string unit
        enum status "active | completed | archived"
        date deadline
        int linked_habit_id FK
        timestamp created_at
    }

    APPOINTMENTS {
        int appointment_id PK
        int patient_id FK
        int professional_id FK
        timestamptz proposed_at
        int duration_minutes
        enum status "pending | confirmed | declined | completed | cancelled"
        text patient_note
        text professional_note
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        int category_id PK
        string name
        string color
    }

    USER_BADGES {
        int id PK
        int user_id FK
        string badge_code
        timestamp awarded_at
    }

    REPORTS {
        int report_id PK
        int user_id FK
        date week_start
        text summary
        timestamp created_at
    }

    BUDDY_CONNECTIONS {
        int id PK
        int requester_id FK
        int receiver_id FK
        enum status "pending | accepted | declined"
        timestamp created_at
    }
```

## Reading the diagram

- `USERS` is the central entity. `role` discriminates patients from
  professionals; the same table holds both. Professionals additionally
  populate `bio / credentials / languages / fee_text / years_experience /
  verified`.
- `APPOINTMENTS` is the one place where a single user appears in two roles
  on the same row — `patient_id` and `professional_id` both point at
  `users.user_id`. Both relations cascade on user delete.
- `HABITS` is a *catalog* (shared across users). `USER_HABITS` is the
  per-user assignment. Daily check-ins attach to `USER_HABITS`, not directly
  to `HABITS`, so the catalog stays clean.
- `verified` defaults to `false` on register. Flip via the admin endpoint
  (`PATCH /api/v1/admin/professionals/:id/verify`).

## Cardinality summary

```
1 user           ── owns ──▶  ∞ tasks
1 user           ── owns ──▶  ∞ journal_entries
1 user           ── owns ──▶  ∞ goals
1 user           ── owns ──▶  ∞ user_habits     ── owns ──▶  ∞ habit_logs
1 user (patient) ── books ─▶  ∞ appointments    ── targets ──▶ 1 user (professional)
1 habit catalog  ── used by ▶ ∞ user_habits
```
