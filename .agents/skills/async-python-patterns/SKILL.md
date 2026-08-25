---
name: async-python-patterns
description: Implements asynchronous Python applications. Use when building non-blocking, concurrent, or high-performance I/O-bound systems.
---

# Async Python Patterns

Apply comprehensive patterns for implementing asynchronous Python applications using `asyncio`, concurrent programming, and `async/await` to build high-performance, non-blocking systems. 

## When to use this skill

- Use this when building async web APIs (e.g., FastAPI, aiohttp, Sanic).
- This is helpful for implementing concurrent I/O operations (database, files, network) and optimizing I/O-bound workloads.
- Use this when creating web scrapers with concurrent requests or real-time applications (WebSocket servers, chat systems).
- This is helpful for processing multiple independent tasks simultaneously, implementing async background tasks/queues, or building microservices with async communication.

## How to use it

Follow these core principles and patterns when writing asynchronous Python code:

- **Fundamental Rules:**
  - **Never block the event loop.** Use `await asyncio.sleep()` instead of `time.sleep()`.
  - Offload CPU-intensive blocking operations to a thread pool using `asyncio.get_event_loop().run_in_executor()`.
  - Always `await` coroutines; otherwise, they only return a coroutine object and do not execute.
  - Use `asyncio.run(main())` as the standard entry point (Python 3.7+). Do not call async functions directly from synchronous code without it.

- **Concurrency & Task Management:**
  - Use `asyncio.gather(*tasks)` to execute multiple tasks concurrently. Apply `return_exceptions=True` for resilient error handling without crashing the entire batch.
  - Use `asyncio.create_task()` to fire-and-forget or schedule background tasks without blocking the current flow.
  - Properly handle `asyncio.CancelledError` if a background task requires graceful cleanup before termination.

- **Resource Management & Safety:**
  - Enforce rate limiting on external API calls or concurrent tasks using `asyncio.Semaphore(max_concurrent)`.
  - Prevent infinite hanging by wrapping volatile/network operations in `asyncio.wait_for(task, timeout=seconds)`.
  - Implement async context managers (`async with`) for handling database connections or network sessions (e.g., using connection pools in `aiohttp.ClientSession`).
  - Use `asyncio.Lock()` to safely synchronize access to shared state and prevent race conditions.
  - Batch process large lists of items rather than creating thousands of tasks simultaneously.

- **Testing:**
  - Write tests using `pytest-asyncio` by applying the `@pytest.mark.asyncio` decorator to properly execute async test functions.

### Quick Reference Patterns

**Concurrent Execution:**
```python
tasks = [fetch_data(uid) for uid in user_ids]
results = await asyncio.gather(*tasks)
```

**Rate Limiting (Semaphore):**

```python
semaphore = asyncio.Semaphore(5)
async with semaphore:
    return await api_call()
```

**Timeout Handling:**
```python
try:
    result = await asyncio.wait_for(slow_operation(), timeout=2.0)
except asyncio.TimeoutError:
    # Handle timeout
```

**Shared State & Race Conditions:**
```python
lock = asyncio.Lock()
async with lock:
    # critical section
    shared_resource += 1
```

**Producer-Consumer Queue:**
```python
queue = asyncio.Queue(maxsize=10)
await queue.put(item) # in producer
item = await queue.get() # in consumer
```