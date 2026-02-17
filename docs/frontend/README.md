# Frontend Documentation

Welcome to the frontend documentation section! This folder contains documentation about the user-facing components and features of the Eshop application.

## Contents

### UI Components & Patterns

1. **[01-STICKY-HEADER-IMPLEMENTATION.md](01-STICKY-HEADER-IMPLEMENTATION.md)**
   - Complete explanation of the sticky header behavior
   - Deep dive into `useState` and `useEffect` hooks
   - How scroll events are detected and handled
   - JSX implementation and Tailwind CSS usage
   - Testing and debugging guide
   - Common mistakes and best practices

## Structure

```
frontend/
├── 01-STICKY-HEADER-IMPLEMENTATION.md  ← Sticky header documentation
└── README.md                            ← This file
```

## Quick Reference

### Sticky Header Component

- **File**: `apps/user-ui/src/shared/widgets/HeaderBottom.tsx`
- **Framework**: React + Next.js
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (`useState`, `useEffect`)

## Backend vs Frontend Docs

- **Backend Documentation**: `/docs/` (root level)
  - Authentication and API Gateway
  - Database and Prisma
  - Email service
  - Redis caching
  - Configuration

- **Frontend Documentation**: `/docs/frontend/` (this folder)
  - React components
  - UI patterns and behaviors
  - Hooks and state management
  - User interactions

---

**Note**: Always keep frontend and backend documentation separate for clarity. Frontend docs focus on React/Next.js/UI implementation, while backend docs focus on services, APIs, and infrastructure.
