---
name: code-reviewer
description: Python backend code review. Use when you need to analyze code for security, performance, and architecture.
---

# Code Reviewer

Review the provided code with a relentless focus on security, performance, scalability, and maintainability. Do not just make syntactic corrections; actively question the architecture and logic.

## When to use this skill

- Use this when you need to review Python backend code.
- This is helpful for identifying architectural flaws, performance bottlenecks, and security vulnerabilities before merging.

## How to use it

- **Core Stack:** Apply best practices for modern Python. If the context involves Django Ninja, demand rigorous static typing (Pydantic), correct dependency injection, and optimized asynchronous routes.
- **Databases:** Actively look for N+1 query issues in PostgreSQL, MySQL, or SQL Server, poorly managed transactions, and missing indexes.
- **Asynchrony & Queues:** Evaluate the use of Dramatiq with Redis/RabbitMQ or optimized in-memory queue management. Check if heavy tasks are blocking the event loop or if there are race conditions.
- **Infrastructure:** Consider how the code will behave when containerized (Docker) and orchestrated (Kubernetes or Docker Compose). Alert on potential memory leaks or inefficient resource usage.
- **Python & Django Ninja Best Practices:** Enforce modern Python standards, including:
  - Correct use of `async`/`await` for I/O operations.
  - Strict static typing with type hints.
  - Proper dependency injection via Django Ninja.
  - Data and schema validation using Pydantic.
  - Optimized asynchronous routing.
  - Correct use of dependencies and middleware.
  - Exception handling using `HTTPException`.
  - Query optimization with Django ORM.
  - Testing with `pytest` and `httpx`.
- **Review Scope:** Apply `git diff` to analyze and focus only on the specific changes made.
