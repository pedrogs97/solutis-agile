---
name: python-testing-patterns
description: Implements robust testing strategies in Python using pytest. Use when writing unit, integration, or async tests, and when setting up test infrastructure.
---

# Python Testing Patterns

Apply comprehensive testing strategies using `pytest`, fixtures, mocking, and parameterization to ensure code reliability and maintainability. Follow the Arrange-Act-Assert (AAA) pattern strictly to keep tests clean and readable.

## When to use this skill

- Use this when writing unit, integration, or functional tests for Python code.
- This is helpful for implementing Test-Driven Development (TDD), mocking external dependencies, and validating async operations.
- Use this when setting up test infrastructure, verifying database operations safely, or debugging failing tests.

## How to use it

Follow these core principles and patterns when writing Python tests:

- **Test Structure & Naming:**
  - Structure every test using the AAA pattern: **Arrange** (set up data), **Act** (execute function), and **Assert** (verify results).
  - Use highly descriptive test names that explain the behavior and expected outcome (e.g., `test_login_fails_with_invalid_password` instead of `test_login`).
  - Keep tests isolated. No test should depend on the state of another.

- **Fixtures for Setup & Teardown:**
  - Avoid legacy `setUp`/`tearDown` methods. Use `@pytest.fixture`.
  - Use the `yield` statement in fixtures to handle teardown/cleanup logic automatically after the test finishes.
  - Appropriately scope fixtures (`scope="function"`, `"module"`, or `"session"`) to optimize test execution time.

- **Parameterization:**
  - Do not write duplicate test functions for different inputs. Use `@pytest.mark.parametrize` to test multiple sets of data against the same test logic.

- **Mocking & Environment:**
  - Use `unittest.mock.patch` (or `pytest-mock`) to isolate external dependencies like third-party APIs or heavy I/O operations.
  - Use pytest's built-in `monkeypatch` fixture to safely override environment variables or object attributes during tests.
  - Use the built-in `tmp_path` fixture for any tests requiring file system operations.

- **Async Code Testing:**
  - Apply the `@pytest.mark.asyncio` decorator to test async functions.
  - Remember to properly `await` both the function under test and any async setup/teardown logic.

- **Exception Testing:**
  - Always verify both the exception type and the message using `with pytest.raises(ExpectedError, match="expected message"):`.

- **Database Testing:**
  - Never run tests against a production database. Spin up an isolated in-memory database (e.g., SQLite `sqlite:///:memory:`) or a dedicated test database container.
  - Use fixtures to inject fresh database sessions into tests, and roll back transactions after each test to maintain isolation.

### Quick Reference Patterns

**Basic Assertion & Exception:**
```python
def test_division_by_zero():
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(5, 0)