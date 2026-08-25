FROM python:3.13-slim

WORKDIR /solutis-flow-back

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml .
RUN uv sync --frozen --no-cache || uv sync --no-cache

COPY . .

EXPOSE 8004

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8004"]
